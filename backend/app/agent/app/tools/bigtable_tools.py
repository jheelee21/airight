import os
import json
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

from pathlib import Path
from dotenv import load_dotenv

# Walk up from this file until we find a .env, regardless of CWD
for _parent in Path(__file__).resolve().parents:
    if (_parent / ".env").exists():
        load_dotenv(dotenv_path=_parent / ".env")
        break

load_dotenv()

# ---------------------------------------------------------------------------
# Database session factory (reuses the same pattern as app/database.py but
# kept self-contained so the tool module can be imported standalone by ADK)
# ---------------------------------------------------------------------------

_DATABASE_URL = (
    "postgresql+psycopg2://{user}:{password}@{host}:{port}/{dbname}?sslmode=require"
).format(
    user=os.getenv("dbuser", ""),
    password=os.getenv("dbpassword", ""),
    host=os.getenv("dbhost", ""),
    port=os.getenv("dbport", "5432"),
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
            text("SELECT id, name, description, product_lines, competitors, regional_focus FROM business WHERE id = :bid"),
            {"bid": business_id},
        ).fetchone()

        if biz_row is None:
            return json.dumps({"error": f"Business with id={business_id} not found."})

        business = {
            "id": biz_row[0],
            "name": biz_row[1],
            "description": biz_row[2],
            "product_lines": biz_row[3],
            "competitors": biz_row[4],
            "regional_focus": biz_row[5],
        }

        # Entities (supply-chain nodes)
        entities = _rows_to_dicts(
            session.execute(
                text(
                    """
                    SELECT id, category, name, description, location
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


# ---------------------------------------------------------------------------
# Tool 4 – create_business
# Used by: business_analyst_agent
# ---------------------------------------------------------------------------

def create_business(
    name: str,
    description: str,
    product_lines: Optional[str] = None,
    competitors: Optional[str] = None,
    regional_focus: Optional[str] = None,
) -> str:
    """
    Insert a new business record into the database.

    Args:
        name:        The company's trading name.
        description: One-paragraph description of what the company makes and does.
        product_lines: Comma-separated products/product families.
        competitors:  Comma-separated competitor names.
        regional_focus: Comma-separated key regions/countries the business serves.

    Returns:
        JSON string with the new business fields,
        or an error message if the insert failed.
    """
    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO business (
                    name, description, product_lines, competitors, regional_focus
                )
                VALUES (
                    :name, :description, :product_lines, :competitors, :regional_focus
                )
                RETURNING
                    id, name, description, product_lines, competitors, regional_focus
                """
            ),
            {
                "name": name,
                "description": description,
                "product_lines": product_lines,
                "competitors": competitors,
                "regional_focus": regional_focus,
            },
        ).fetchone()
        session.commit()
        return json.dumps({
            "id": result[0],
            "name": result[1],
            "description": result[2],
            "product_lines": result[3],
            "competitors": result[4],
            "regional_focus": result[5],
        })
    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool 5 – create_entity
# Used by: business_analyst_agent
# ---------------------------------------------------------------------------

def create_entity(
    business_id: int,
    category: str,
    name: str,
    description: str,
    location: str,
) -> str:
    """
    Insert a new supply-chain entity (factory, warehouse, supplier, OEM, etc.)
    for a given business.

    Args:
        business_id: The primary key of the owning business.
        category:    Entity type. Must be one of: supplier, factory,
                     warehouse, distribution_center, port_hub, oem_customer, other.
        name:        Short identifying name for the entity (e.g. "Foxconn Shenzhen").
        description: Role and function of this node in the supply chain
                     (e.g. "Tier-1 assembly factory producing camera modules").
        location:    City and country string (e.g. "Shenzhen, China").

    Returns:
        JSON string with the new entity's id and fields, or an error message.
    """
    allowed_categories = {
        "supplier",
        "factory",
        "warehouse",
        "distribution_center",
        "port_hub",
        "oem_customer",
        "other",
    }
    if category not in allowed_categories:
        return json.dumps({
            "error": (
                f"Invalid category '{category}'. Must be one of: "
                f"{sorted(allowed_categories)}"
            )
        })

    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO entity (business_id, category, name, description, location)
                VALUES (:bid, :category, :name, :description, :location)
                RETURNING id, business_id, category, name, description, location
                """
            ),
            {
                "bid": business_id,
                "category": category,
                "name": name,
                "description": description,
                "location": location,
            },
        ).fetchone()
        session.commit()
        return json.dumps({
            "id": result[0],
            "business_id": result[1],
            "category": result[2],
            "name": result[3],
            "description": result[4],
            "location": result[5],
        })
    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool 6 – create_item
# Used by: business_analyst_agent
# ---------------------------------------------------------------------------

def create_item(
    business_id: int,
    name: str,
    description: str,
    category: str,
) -> str:
    """
    Insert a new item (raw material, component, or finished product) for a business.

    Args:
        business_id: The primary key of the owning business.
        name:        Item name (e.g. "CMOS Image Sensor", "Lithium Cell", "Camera Module A3").
        description: What this item is, its spec or grade if known.
        category:    Must be exactly one of: "raw material", "component", "finished product".

    Returns:
        JSON string with the new item's id and fields, or an error message.
    """
    allowed_categories = {"raw material", "component", "finished product"}
    if category not in allowed_categories:
        return json.dumps({
            "error": f"Invalid category '{category}'. Must be one of: {sorted(allowed_categories)}"
        })

    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO item (business_id, name, description, category)
                VALUES (:bid, :name, :description, :category)
                RETURNING id, business_id, category, name, description
                """
            ),
            {
                "bid": business_id,
                "name": name,
                "description": description,
                "category": category,
            },
        ).fetchone()
        session.commit()
        return json.dumps({
            "id": result[0],
            "business_id": result[1],
            "category": result[2],
            "name": result[3],
            "description": result[4],
        })
    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool 7 – create_route
# Used by: business_analyst_agent
# ---------------------------------------------------------------------------

def create_route(
    business_id: int,
    name: str,
    description: str,
    start_entity_id: int,
    end_entity_id: int,
    item_id: int,
    transportation_mode: str,
    lead_time: int,
    cost: int,
) -> str:
    """
    Insert a new supply-chain route linking two entities via a transported item.

    Args:
        business_id:        The primary key of the owning business.
        name:               Short route label (e.g. "Sensor Factory → Assembly Plant").
        description:        What this route represents in the supply chain.
        start_entity_id:    ID of the origin entity (must already exist in DB).
        end_entity_id:      ID of the destination entity (must already exist in DB).
        item_id:            ID of the item transported on this route (must already exist).
        transportation_mode: One of: "air", "sea", "road", "rail", "multimodal".
        lead_time:          Transit time in days (integer).
        cost:               Estimated cost per shipment in USD (integer).

    Returns:
        JSON string with the new route's id and all fields resolved with entity/item
        names, or an error message.
    """
    allowed_modes = {"air", "sea", "road", "rail", "multimodal"}
    if transportation_mode not in allowed_modes:
        return json.dumps({
            "error": f"Invalid transportation_mode '{transportation_mode}'. Must be one of: {sorted(allowed_modes)}"
        })

    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO route (
                    business_id, name, description,
                    start_entity_id, end_entity_id, item_id,
                    transportation_mode, lead_time, cost
                )
                VALUES (
                    :bid, :name, :description,
                    :start_eid, :end_eid, :iid,
                    :mode, :lead_time, :cost
                )
                RETURNING id
                """
            ),
            {
                "bid":       business_id,
                "name":      name,
                "description": description,
                "start_eid": start_entity_id,
                "end_eid":   end_entity_id,
                "iid":       item_id,
                "mode":      transportation_mode,
                "lead_time": lead_time,
                "cost":      cost,
            },
        ).fetchone()
        session.commit()
        new_id = result[0]

        # Return a resolved view so the agent can confirm what was saved
        resolved = session.execute(
            text(
                """
                SELECT
                    r.id, r.name, r.description,
                    se.name AS start_entity, se.location AS start_location,
                    ee.name AS end_entity,   ee.location AS end_location,
                    i.name  AS item_name,    i.category  AS item_category,
                    r.transportation_mode, r.lead_time, r.cost
                FROM route r
                JOIN entity se ON se.id = r.start_entity_id
                JOIN entity ee ON ee.id = r.end_entity_id
                JOIN item   i  ON i.id  = r.item_id
                WHERE r.id = :rid
                """
            ),
            {"rid": new_id},
        ).fetchone()

        return json.dumps({
            "id":                 resolved[0],
            "name":               resolved[1],
            "description":        resolved[2],
            "start_entity":       resolved[3],
            "start_location":     resolved[4],
            "end_entity":         resolved[5],
            "end_location":       resolved[6],
            "item_name":          resolved[7],
            "item_category":      resolved[8],
            "transportation_mode": resolved[9],
            "lead_time":          resolved[10],
            "cost":               resolved[11],
        })
    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()

# ---------------------------------------------------------------------------
# Tool 8 – create_supply_chain  (bulk onboarding)
# Used by: business_analyst_agent
# ---------------------------------------------------------------------------

def create_supply_chain(payload: str) -> str:
    """
    Insert a complete supply-chain graph in a single atomic transaction.

    Accepts the entire graph as a JSON string so the agent never needs to chain
    IDs across multiple tool turns.  Routes reference entities and items by their
    0-based index in the supplied arrays; the function resolves them to real DB IDs.

    Args:
        payload: A JSON string with the following structure:
            {
              "business": {
                "name":           string  (required),
                "description":    string  (required),
                "product_lines":  string | null,
                "competitors":    string | null,
                "regional_focus": string | null
              },
              "entities": [
                {
                  "category":    string,   // supplier | factory | warehouse |
                                           // distribution_center | port_hub |
                                           // oem_customer | other
                  "name":        string,
                  "description": string,
                  "location":    string    // "City, Country"
                }
              ],
              "items": [
                {
                  "name":        string,
                  "description": string,
                  "category":    string    // "raw material" | "component" |
                                           // "finished product"
                }
              ],
              "routes": [
                {
                  "name":                string,
                  "description":         string,
                  "start_entity_index":  integer,  // 0-based index into entities
                  "end_entity_index":    integer,  // 0-based index into entities
                  "item_index":          integer,  // 0-based index into items
                  "transportation_mode": string,   // air | sea | road | rail | multimodal
                  "lead_time":           integer,  // days
                  "cost":                integer   // USD per shipment (0 if unknown)
                }
              ]
            }

    Returns:
        JSON string with the full persisted graph including all assigned IDs,
        or a JSON error object if validation or the transaction fails.
    """
    # ── Parse ────────────────────────────────────────────────────────────────
    try:
        data = json.loads(payload)
    except (json.JSONDecodeError, TypeError) as exc:
        return json.dumps({"error": f"payload is not valid JSON: {exc}"})

    business = data.get("business", {})
    entities = data.get("entities", [])
    items    = data.get("items", [])
    routes   = data.get("routes", [])

    # ── Validate ─────────────────────────────────────────────────────────────
    if not business.get("name"):
        return json.dumps({"error": "business.name is required"})
    if not business.get("description"):
        return json.dumps({"error": "business.description is required"})

    allowed_entity_categories = {
        "supplier", "factory", "warehouse",
        "distribution_center", "port_hub", "oem_customer", "other",
    }
    allowed_item_categories = {"raw material", "component", "finished product"}
    allowed_modes = {"air", "sea", "road", "rail", "multimodal"}

    for i, e in enumerate(entities):
        if e.get("category") not in allowed_entity_categories:
            return json.dumps({
                "error": f"entities[{i}]: invalid category '{e.get('category')}'. "
                         f"Must be one of: {sorted(allowed_entity_categories)}"
            })
        if not e.get("location") or "," not in e["location"]:
            return json.dumps({
                "error": f"entities[{i}]: location must be 'City, Country' format, "
                         f"got: '{e.get('location')}'"
            })

    for i, it in enumerate(items):
        if it.get("category") not in allowed_item_categories:
            return json.dumps({
                "error": f"items[{i}]: invalid category '{it.get('category')}'. "
                         f"Must be one of: {sorted(allowed_item_categories)}"
            })

    for i, r in enumerate(routes):
        if r.get("transportation_mode") not in allowed_modes:
            return json.dumps({
                "error": f"routes[{i}]: invalid transportation_mode "
                         f"'{r.get('transportation_mode')}'. "
                         f"Must be one of: {sorted(allowed_modes)}"
            })
        for idx_field in ("start_entity_index", "end_entity_index"):
            idx = r.get(idx_field)
            if idx is None or not (0 <= idx < len(entities)):
                return json.dumps({
                    "error": f"routes[{i}]: {idx_field}={idx} is out of range "
                             f"(entities has {len(entities)} entries)"
                })
        item_idx = r.get("item_index")
        if item_idx is None or not (0 <= item_idx < len(items)):
            return json.dumps({
                "error": f"routes[{i}]: item_index={item_idx} is out of range "
                         f"(items has {len(items)} entries)"
            })

    # ── Persist in one transaction ────────────────────────────────────────────
    session = _get_session()
    try:
        # 1. Business
        biz_row = session.execute(
            text(
                """
                INSERT INTO business (name, description, product_lines, competitors, regional_focus)
                VALUES (:name, :description, :product_lines, :competitors, :regional_focus)
                RETURNING id, name, description, product_lines, competitors, regional_focus
                """
            ),
            {
                "name":           business["name"],
                "description":    business["description"],
                "product_lines":  business.get("product_lines"),
                "competitors":    business.get("competitors"),
                "regional_focus": business.get("regional_focus"),
            },
        ).fetchone()
        business_id = biz_row[0]

        # 2. Entities
        entity_ids = []
        entities_saved = []
        for e in entities:
            row = session.execute(
                text(
                    """
                    INSERT INTO entity (business_id, category, name, description, location)
                    VALUES (:bid, :category, :name, :description, :location)
                    RETURNING id, category, name, description, location
                    """
                ),
                {
                    "bid":         business_id,
                    "category":    e["category"],
                    "name":        e["name"],
                    "description": e["description"],
                    "location":    e["location"],
                },
            ).fetchone()
            entity_ids.append(row[0])
            entities_saved.append({
                "id": row[0], "category": row[1],
                "name": row[2], "description": row[3], "location": row[4],
            })

        # 3. Items
        item_ids = []
        items_saved = []
        for it in items:
            row = session.execute(
                text(
                    """
                    INSERT INTO item (business_id, name, description, category)
                    VALUES (:bid, :name, :description, :category)
                    RETURNING id, name, description, category
                    """
                ),
                {
                    "bid":         business_id,
                    "name":        it["name"],
                    "description": it["description"],
                    "category":    it["category"],
                },
            ).fetchone()
            item_ids.append(row[0])
            items_saved.append({
                "id": row[0], "name": row[1],
                "description": row[2], "category": row[3],
            })

        # 4. Routes — resolve indexes to real DB IDs
        routes_saved = []
        for r in routes:
            start_eid = entity_ids[r["start_entity_index"]]
            end_eid   = entity_ids[r["end_entity_index"]]
            item_id   = item_ids[r["item_index"]]

            row = session.execute(
                text(
                    """
                    INSERT INTO route (
                        business_id, name, description,
                        start_entity_id, end_entity_id, item_id,
                        transportation_mode, lead_time, cost
                    )
                    VALUES (
                        :bid, :name, :description,
                        :start_eid, :end_eid, :iid,
                        :mode, :lead_time, :cost
                    )
                    RETURNING id
                    """
                ),
                {
                    "bid":         business_id,
                    "name":        r["name"],
                    "description": r["description"],
                    "start_eid":   start_eid,
                    "end_eid":     end_eid,
                    "iid":         item_id,
                    "mode":        r["transportation_mode"],
                    "lead_time":   r["lead_time"],
                    "cost":        r["cost"],
                },
            ).fetchone()
            route_id = row[0]

            resolved = session.execute(
                text(
                    """
                    SELECT
                        r.id, r.name, r.description,
                        se.name AS start_entity, se.location AS start_location,
                        ee.name AS end_entity,   ee.location AS end_location,
                        i.name  AS item_name,    i.category  AS item_category,
                        r.transportation_mode, r.lead_time, r.cost
                    FROM route r
                    JOIN entity se ON se.id = r.start_entity_id
                    JOIN entity ee ON ee.id = r.end_entity_id
                    JOIN item   i  ON i.id  = r.item_id
                    WHERE r.id = :rid
                    """
                ),
                {"rid": route_id},
            ).fetchone()
            routes_saved.append({
                "id": resolved[0], "name": resolved[1], "description": resolved[2],
                "start_entity": resolved[3], "start_location": resolved[4],
                "end_entity": resolved[5], "end_location": resolved[6],
                "item_name": resolved[7], "item_category": resolved[8],
                "transportation_mode": resolved[9],
                "lead_time": resolved[10], "cost": resolved[11],
            })

        session.commit()

        return json.dumps({
            "business_id": business_id,
            "business": {
                "id": biz_row[0], "name": biz_row[1], "description": biz_row[2],
                "product_lines": biz_row[3], "competitors": biz_row[4],
                "regional_focus": biz_row[5],
            },
            "entities_saved": entities_saved,
            "items_saved":    items_saved,
            "routes_saved":   routes_saved,
        })

    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()

# ---------------------------------------------------------------------------
# Tool — create_risk
# ---------------------------------------------------------------------------

def create_risk(
    business_id: int,
    target_type: str,
    target_name: str,
    category: str,
    severity: float,
    probability: float,
    description: str,
) -> str:
    """
    Insert a new risk row linked to a named entity or route.

    target_name is resolved to a target_id automatically:
      - If target_type == 'entity': looks up entity.name WHERE business_id matches
      - If target_type == 'route':  looks up route.name  WHERE business_id matches
      - Falls back to the first entity for the business if no match is found

    severity and probability must be 0.0–1.0.

    Returns JSON with the new risk id, or an error object.
    """
    session = _get_session()
    try:
        # Resolve target_name → target_id
        if target_type == "route":
            row = session.execute(
                text("SELECT id FROM route WHERE business_id = :bid AND name = :name LIMIT 1"),
                {"bid": business_id, "name": target_name},
            ).fetchone()
        else:
            row = session.execute(
                text("SELECT id FROM entity WHERE business_id = :bid AND name = :name LIMIT 1"),
                {"bid": business_id, "name": target_name},
            ).fetchone()

        if row is None:
            # Fallback to first entity
            row = session.execute(
                text("SELECT id FROM entity WHERE business_id = :bid ORDER BY id LIMIT 1"),
                {"bid": business_id},
            ).fetchone()

        if row is None:
            return json.dumps({"error": f"No entity/route found for business_id={business_id}"})

        target_id = row[0]

        result = session.execute(
            text(
                """
                INSERT INTO risk
                    (business_id, target_type, target_id,
                     category, severity, probability, description)
                VALUES
                    (:bid, :ttype, :tid, :cat, :sev, :prob, :desc)
                RETURNING id
                """
            ),
            {
                "bid":   business_id,
                "ttype": target_type,
                "tid":   target_id,
                "cat":   category,
                "sev":   round(severity, 4),
                "prob":  round(probability, 4),
                "desc":  description,
            },
        ).fetchone()
        session.commit()

        return json.dumps({
            "id":          result[0],
            "business_id": business_id,
            "target_type": target_type,
            "target_id":   target_id,
            "category":    category,
            "severity":    severity,
            "probability": probability,
            "description": description,
        })

    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool — create_action
# ---------------------------------------------------------------------------

def create_action_items(
    risk_id: int,
    action_type: str,
    description: str,
    estimated_cost: Optional[float] = None,
    expected_impact: Optional[float] = None,
    implementation_status: str = "Suggested",
) -> str:
    """
    Insert a new action row linked to an existing risk.

    action_type should encode urgency, e.g. "IMMEDIATE – Mitigation".
    expected_impact is 0.0–1.0 (fraction of risk resolved if action taken).

    Returns JSON with the new action id, or an error object.
    """
    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO action
                    (risk_id, action_type, description,
                     estimated_cost, expected_impact, implementation_status)
                VALUES
                    (:rid, :atype, :desc, :cost, :impact, :status)
                RETURNING id
                """
            ),
            {
                "rid":    risk_id,
                "atype":  action_type,
                "desc":   description,
                "cost":   estimated_cost,
                "impact": expected_impact,
                "status": implementation_status,
            },
        ).fetchone()
        session.commit()

        return json.dumps({
            "id":                    result[0],
            "risk_id":               risk_id,
            "action_type":           action_type,
            "description":           description,
            "estimated_cost":        estimated_cost,
            "expected_impact":       expected_impact,
            "implementation_status": implementation_status,
        })

    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


# ---------------------------------------------------------------------------
# Tool — create_news
# ---------------------------------------------------------------------------

def create_news(
    business_id: int,
    title: str,
    content: str,
    source: str,
    url: Optional[str] = None,
    published_at: Optional[str] = None,
    risk_id: Optional[int] = None,
) -> str:
    """
    Insert a news article linked to a business and optionally a risk.

    published_at accepts ISO date strings: "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS".
    If omitted, defaults to the current UTC timestamp.

    Returns JSON with the new news id, or an error object.
    """
    session = _get_session()
    try:
        result = session.execute(
            text(
                """
                INSERT INTO news
                    (business_id, risk_id, title, content, source, url, published_at)
                VALUES
                    (:bid, :rid, :title, :content, :source, :url,
                     COALESCE(CAST(:pub AS TIMESTAMP), NOW()))
                RETURNING id
                """
            ),
            {
                "bid":     business_id,
                "rid":     risk_id,
                "title":   title,
                "content": content,
                "source":  source,
                "url":     url,
                "pub":     published_at,
            },
        ).fetchone()
        session.commit()

        return json.dumps({
            "id":           result[0],
            "business_id":  business_id,
            "risk_id":      risk_id,
            "title":        title,
            "source":       source,
            "published_at": published_at,
        })

    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()


def save_pipeline_output(payload: str) -> str:
    """
    Persist the full agent pipeline output to the database by calling
    create_risk, create_action, and create_news for each record.

    Mapping rules
    -------------
    new_risks
        severity / likelihood : agent outputs 1–5 → normalised to 0.0–1.0
        target_type / target_name : resolved from risk_ref in action_plan
          (falls back to "entity" / first entity name if no risk_ref match)

    action_plan
        urgency + action_type : merged as "URGENCY – ActionType" string
        title prepended to description to preserve the card headline

    news articles
        risk_id : matched by entity name → most recent risk on that entity
          (nullable — articles with no matching entity are still saved)

    Args:
        payload: JSON string of the full pipeline output object.

    Returns:
        JSON summary: { status, risks_inserted, actions_inserted, news_inserted }
        or { error } on failure.
    """
    try:
        data = json.loads(payload)
    except Exception as exc:
        return json.dumps({"error": f"Invalid JSON payload: {exc}"})

    business_id: int = data["business_id"]
    errors: list[str] = []

    # ── Build risk_ref lookup (title → ref metadata) from action_plan ──────
    risk_ref_map: dict[str, dict] = {}
    for plan in data.get("action_plan", []):
        ref = plan.get("risk_ref", {})
        title = ref.get("title", "")
        if title:
            risk_ref_map[title] = ref

    # ── 1. Insert risks, collect title → new DB id ──────────────────────────
    title_to_risk_id: dict[str, int] = {}

    for risk in data.get("risks", {}).get("new_risks", []):
        title: str = risk.get("title", "Unnamed Risk")
        ref = risk_ref_map.get(title, {})

        target_type: str = ref.get("target_type", "entity")
        target_name: str = ref.get("target_name", "")

        # Normalise 1–5 scale → 0.0–1.0
        severity:    float = round(risk.get("severity",   3) / 5.0, 2)
        probability: float = round(risk.get("likelihood", 3) / 5.0, 2)

        description = f"{title}: {risk.get('description', '')}"

        result_str = create_risk(
            business_id=business_id,
            target_type=target_type,
            target_name=target_name,
            category=risk.get("category", "Operational"),
            severity=severity,
            probability=probability,
            description=description,
        )
        result = json.loads(result_str)

        if "error" in result:
            errors.append(f"Risk '{title}': {result['error']}")
        else:
            title_to_risk_id[title] = result["id"]

    # ── 2. Insert actions ────────────────────────────────────────────────────
    actions_inserted = 0

    for plan in data.get("action_plan", []):
        risk_title: str = plan.get("risk_ref", {}).get("title", "")
        risk_db_id: Optional[int] = title_to_risk_id.get(risk_title)

        if risk_db_id is None:
            errors.append(f"Action skipped — no risk_id found for '{risk_title}'")
            continue

        for item in plan.get("action_items", []):
            urgency:    str = item.get("urgency", "")
            atype:      str = item.get("action_type", "Mitigation")
            item_title: str = item.get("title", "")
            item_desc:  str = item.get("description", "")

            composite_type = f"{urgency} – {atype}" if urgency else atype
            full_desc = f"{item_title}. {item_desc}".strip(". ") if item_title else item_desc

            result_str = create_action(
                risk_id=risk_db_id,
                action_type=composite_type,
                description=full_desc,
                estimated_cost=item.get("estimated_cost"),
                expected_impact=item.get("expected_impact"),
                implementation_status=item.get("implementation_status", "Suggested"),
            )
            result = json.loads(result_str)

            if "error" in result:
                errors.append(f"Action '{item_title}': {result['error']}")
            else:
                actions_inserted += 1

    # ── 3. Insert news articles ──────────────────────────────────────────────
    # Build entity-name → latest risk_id map for linking
    entity_risk_map: dict[str, int] = {}
    for t, rid in title_to_risk_id.items():
        ref = risk_ref_map.get(t, {})
        ename = ref.get("target_name", "")
        if ename:
            entity_risk_map[ename] = rid

    news_inserted = 0

    for article in data.get("news_scraping", {}).get("articles", []):
        linked_risk_id: Optional[int] = None
        for ename in article.get("affected_profile_entities", []):
            if ename in entity_risk_map:
                linked_risk_id = entity_risk_map[ename]
                break

        result_str = create_news(
            business_id=business_id,
            title=article.get("title", ""),
            content=article.get("supply_chain_signal", ""),
            source=article.get("source", ""),
            url=article.get("url"),
            published_at=article.get("publication_date"),
            risk_id=linked_risk_id,
        )
        result = json.loads(result_str)

        if "error" in result:
            errors.append(f"News '{article.get('title', '')}': {result['error']}")
        else:
            news_inserted += 1

    return json.dumps({
        "status":           "ok" if not errors else "partial",
        "business_id":      business_id,
        "risks_inserted":   len(title_to_risk_id),
        "actions_inserted": actions_inserted,
        "news_inserted":    news_inserted,
        "errors":           errors,
    })

# ---------------------------------------------------------------------------
# Tool – create_risks
# Used by: root_agent (Step 4.5 — after risk_analyst, before action_item_creator)
# ---------------------------------------------------------------------------

def create_risks(business_id: int, risks_json: str) -> str:
    """
    Persist newly identified risks to the database and return their integer IDs.

    This is the bridge between risk_analyst_agent (which produces temporary string
    identifiers like "R-001") and action_item_creator_agent (which needs real integer
    foreign keys to insert action rows).  The root_agent must call this tool after
    receiving new_risks from risk_analyst_agent and before delegating to
    action_item_creator_agent.

    Target resolution
    -----------------
    The risk analyst output uses ``target_name`` (a human-readable string) and
    ``target_type`` ("entity" | "route").  This function resolves each name to
    the correct integer ``target_id`` by querying the entity / route tables for
    the given business.  If a name cannot be resolved the row is still inserted
    with ``target_id = NULL`` and a warning is attached to the returned object.

    Args:
        business_id: Integer primary key of the business these risks belong to.
        risks_json:  JSON string — the array returned by risk_analyst_agent.
                     Each element must have at minimum:
                       {
                         "title":       "<string>",
                         "description": "<string>",
                         "category":    "<Supply Chain|Geopolitical|Financial|
                                          Operational|Climate|Regulatory>",
                         "severity":    <1-5 integer>,
                         "likelihood":  <1-5 integer>,   ← risk analyst field name
                         "target_type": "entity | route",
                         "target_name": "<exact entity or route name>"
                       }

    Returns:
        JSON string with the list of saved risk objects, each augmented with its
        real integer ``risk_id``::

            {
              "risks_saved": <int>,
              "saved": [
                {
                  "risk_id":     <int>,          ← real DB primary key
                  "title":       "<string>",
                  "category":    "<string>",
                  "severity":    <int>,
                  "probability": <float>,        ← normalised from likelihood/5
                  "target_type": "entity|route",
                  "target_name": "<string>",
                  "target_id":   <int|null>,
                  "warning":     "<string|null>" ← set if target_name unresolved
                }
              ]
            }

        On failure a JSON error object is returned instead.
    """
    try:
        risks = json.loads(risks_json)
    except (json.JSONDecodeError, TypeError) as exc:
        return json.dumps({"error": f"Invalid JSON input: {exc}"})

    if not isinstance(risks, list):
        return json.dumps({"error": "risks_json must be a JSON array."})

    session = _get_session()
    try:
        # ------------------------------------------------------------------
        # Pre-load name → id maps for entities and routes owned by this business
        # ------------------------------------------------------------------
        entity_map: dict[str, int] = {
            row[0]: row[1]
            for row in session.execute(
                text("SELECT name, id FROM entity WHERE business_id = :bid"),
                {"bid": business_id},
            ).fetchall()
        }
        route_map: dict[str, int] = {
            row[0]: row[1]
            for row in session.execute(
                text("SELECT name, id FROM route WHERE business_id = :bid"),
                {"bid": business_id},
            ).fetchall()
        }

        saved = []
        for risk in risks:
            target_type = risk.get("target_type", "entity")
            target_name = risk.get("target_name", "")
            warning = None

            # Resolve name → integer id
            if target_type == "entity":
                target_id = entity_map.get(target_name)
            elif target_type == "route":
                target_id = route_map.get(target_name)
            else:
                target_id = None

            if target_id is None:
                warning = (
                    f"Could not resolve target_name '{target_name}' "
                    f"(target_type='{target_type}') to a database ID. "
                    "Row inserted with target_id = NULL."
                )

            # Both severity and probability are 0.0-1.0 floats; clamp defensively.
            def _clamp(val, default: float) -> float:
                try:
                    return round(min(1.0, max(0.0, float(val))), 4)
                except (TypeError, ValueError):
                    return default

            severity    = _clamp(risk.get("severity"),    0.5)
            probability = _clamp(
                risk.get("likelihood") or risk.get("probability"), 0.5
            )

            row = session.execute(
                text(
                    """
                    INSERT INTO risk (
                        business_id,
                        category,
                        severity,
                        probability,
                        description,
                        target_type,
                        target_id
                    )
                    VALUES (
                        :bid,
                        :category,
                        :severity,
                        :probability,
                        :description,
                        :target_type,
                        :target_id
                    )
                    RETURNING id, category, severity, probability, description,
                              target_type, target_id
                    """
                ),
                {
                    "bid":         business_id,
                    "category":    risk.get("category", "Operational"),
                    "severity":    severity,
                    "probability": probability,
                    "description": (
                        risk.get("description")
                        or risk.get("title")
                        or "No description provided."
                    ),
                    "target_type": target_type,
                    "target_id":   target_id,
                },
            ).fetchone()

            saved.append({
                "risk_id":     row[0],   # ← real integer DB primary key
                "category":    row[1],
                "severity":    row[2],
                "probability": float(row[3]),
                "description": row[4],
                "target_type": row[5],
                "target_id":   row[6],
                "title":       risk.get("title", ""),
                "target_name": target_name,
                "warning":     warning,
            })

        session.commit()
        return json.dumps({"risks_saved": len(saved), "saved": saved}, default=str)

    except Exception as exc:
        session.rollback()
        return json.dumps({"error": str(exc)})
    finally:
        session.close()