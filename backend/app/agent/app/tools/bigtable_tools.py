import os
import json
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

load_dotenv()

# ---------------------------------------------------------------------------
# Database session factory (reuses the same pattern as app/database.py but
# kept self-contained so the tool module can be imported standalone by ADK)
# ---------------------------------------------------------------------------

_DATABASE_URL = (
    "postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}?sslmode=require"
).format(
    user=os.getenv("user", ""),
    password=os.getenv("password", ""),
    host=os.getenv("host", ""),
    port=os.getenv("port", "5432"),
    dbname=os.getenv("dbname", ""),
)

_engine = create_engine(_DATABASE_URL, pool_pre_ping=True)
_SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


def _get_session():
    return _SessionLocal()


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _rows_to_dicts(result) -> list[dict]:
    """Convert SQLAlchemy Result rows to plain dicts."""
    keys = list(result.keys())
    return [dict(zip(keys, row)) for row in result.fetchall()]


# ---------------------------------------------------------------------------
# Tool 1 – get_business_profile
# Used by: business_analyst_agent, risk_analyst_agent
# ---------------------------------------------------------------------------


def get_business_profile(business_id: int) -> str:
    """
    Retrieve the full supply-chain profile of a business from the database.

    Returns a JSON string with:
      - business:  name, description
      - entities:  all physical locations (factories, warehouses, suppliers …)
      - items:     all materials / components / finished goods
      - routes:    all supply-chain legs (start→end entity, item, transport,
                   lead_time, cost)

    Args:
        business_id: The primary key of the business to look up.

    Returns:
        A JSON-encoded string containing the business profile,
        or an error message string if the business is not found.
    """
    session = _get_session()
    try:
        # Business
        biz_row = session.execute(
            text("SELECT id, name, description FROM business WHERE id = :bid"),
            {"bid": business_id},
        ).fetchone()

        if biz_row is None:
            return json.dumps({"error": f"Business with id={business_id} not found."})

        business = {"id": biz_row[0], "name": biz_row[1], "description": biz_row[2]}

        # Entities (supply-chain nodes)
        entities = _rows_to_dicts(
            session.execute(
                text(
                    """
                    SELECT id, name, description, location
                    FROM entity
                    WHERE business_id = :bid
                    ORDER BY id
                    """
                ),
                {"bid": business_id},
            )
        )

        # Items (raw materials, components, finished products)
        items = _rows_to_dicts(
            session.execute(
                text(
                    """
                    SELECT id, category, name, description
                    FROM item
                    WHERE business_id = :bid
                    ORDER BY id
                    """
                ),
                {"bid": business_id},
            )
        )

        # Routes with resolved entity/item names for readability
        routes = _rows_to_dicts(
            session.execute(
                text(
                    """
                    SELECT
                        r.id,
                        r.name,
                        r.description,
                        se.name  AS start_entity,
                        se.location AS start_location,
                        ee.name  AS end_entity,
                        ee.location AS end_location,
                        i.name   AS item_name,
                        i.category AS item_category,
                        r.transportation_mode,
                        r.lead_time,
                        r.cost
                    FROM route r
                    JOIN entity se ON se.id = r.start_entity_id
                    JOIN entity ee ON ee.id = r.end_entity_id
                    JOIN item   i  ON i.id  = r.item_id
                    WHERE r.business_id = :bid
                    ORDER BY r.id
                    """
                ),
                {"bid": business_id},
            )
        )

        profile = {
            "business": business,
            "entities": entities,
            "items": items,
            "routes": routes,
        }
        return json.dumps(profile, default=str)

    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool 2 – get_existing_risks
# Used by: risk_analyst_agent
# ---------------------------------------------------------------------------


def get_existing_risks(business_id: int, category: Optional[str] = None) -> str:
    """
    Retrieve all existing risk records (and their mitigation actions) for a
    business, optionally filtered by risk category.

    Returns a JSON string with a list of risks, each containing:
      - id, category, severity, probability, description
      - target_type  ("entity" | "route")
      - target_name  (resolved name of the entity or route)
      - actions:     list of mitigation actions already defined for this risk

    Args:
        business_id: The primary key of the business.
        category:    Optional filter (e.g. "Supply Chain", "Geopolitical",
                     "Financial", "Operational", "Climate", "Regulatory").

    Returns:
        A JSON-encoded string with the list of risk objects.
    """
    session = _get_session()
    try:
        where_clause = "r.business_id = :bid"
        params: dict = {"bid": business_id}

        if category:
            where_clause += " AND LOWER(r.category) = LOWER(:cat)"
            params["cat"] = category

        risks = _rows_to_dicts(
            session.execute(
                text(
                    f"""
                    SELECT
                        r.id,
                        r.category,
                        r.severity,
                        r.probability,
                        r.description,
                        r.target_type,
                        r.target_id,
                        CASE
                            WHEN r.target_type = 'entity' THEN e.name
                            WHEN r.target_type = 'route'  THEN ro.name
                            ELSE 'Unknown'
                        END AS target_name
                    FROM risk r
                    LEFT JOIN entity e  ON r.target_type = 'entity' AND e.id  = r.target_id
                    LEFT JOIN route  ro ON r.target_type = 'route'  AND ro.id = r.target_id
                    WHERE {where_clause}
                    ORDER BY (r.severity * r.probability) DESC
                    """
                ),
                params,
            )
        )

        # Attach actions to each risk
        for risk in risks:
            actions = _rows_to_dicts(
                session.execute(
                    text(
                        """
                        SELECT
                            id,
                            action_type,
                            description,
                            estimated_cost,
                            expected_impact,
                            implementation_status
                        FROM action
                        WHERE risk_id = :rid
                        ORDER BY id
                        """
                    ),
                    {"rid": risk["id"]},
                )
            )
            risk["actions"] = actions

        return json.dumps(risks, default=str)

    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool 3 – get_risks_with_actions
# Used by: action_item_creator_agent
# ---------------------------------------------------------------------------


def get_risks_with_actions(business_id: int) -> str:
    """
    Retrieve all risks for a business together with their existing mitigation
    actions, plus the name and location of the affected entity/route.

    This is the primary data feed for the Action Item Creator Agent: it shows
    which risks already have actions and which still need mitigation plans.

    Returns a JSON string with a list of risk objects, each containing:
      - risk metadata (id, category, severity, probability, description)
      - target details (target_type, target_name, target_location if entity)
      - actions: list of action items (type, description, cost, impact, status)

    Args:
        business_id: The primary key of the business.

    Returns:
        A JSON-encoded string with the enriched risk+action list.
    """
    session = _get_session()
    try:
        risks = _rows_to_dicts(
            session.execute(
                text(
                    """
                    SELECT
                        r.id          AS risk_id,
                        r.category,
                        r.severity,
                        r.probability,
                        ROUND(CAST(r.severity * r.probability AS NUMERIC), 4)
                                      AS risk_score,
                        r.description AS risk_description,
                        r.target_type,
                        CASE
                            WHEN r.target_type = 'entity' THEN e.name
                            WHEN r.target_type = 'route'  THEN ro.name
                            ELSE 'Unknown'
                        END AS target_name,
                        CASE
                            WHEN r.target_type = 'entity' THEN e.location
                            ELSE NULL
                        END AS target_location
                    FROM risk r
                    LEFT JOIN entity e  ON r.target_type = 'entity' AND e.id  = r.target_id
                    LEFT JOIN route  ro ON r.target_type = 'route'  AND ro.id = r.target_id
                    WHERE r.business_id = :bid
                    ORDER BY risk_score DESC
                    """
                ),
                {"bid": business_id},
            )
        )

        for risk in risks:
            actions = _rows_to_dicts(
                session.execute(
                    text(
                        """
                        SELECT
                            id             AS action_id,
                            action_type,
                            description    AS action_description,
                            estimated_cost,
                            expected_impact,
                            implementation_status
                        FROM action
                        WHERE risk_id = :rid
                        ORDER BY id
                        """
                    ),
                    {"rid": risk["risk_id"]},
                )
            )
            risk["existing_actions"] = actions

        return json.dumps(risks, default=str)

    except Exception as exc:
        return json.dumps({"error": str(exc)})
    finally:
        session.close()
