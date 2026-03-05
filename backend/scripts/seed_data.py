import sys
import os
from sqlalchemy.orm import Session

# Add the 'app' directory to sys.path so we can import from 'database' and 'models'
# Use absolute paths to be safe
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app"))
if BASE_DIR not in sys.path:
    sys.path.append(BASE_DIR)

from database import SessionLocal, engine, Base
from models.business import Business
from models.user import User
from models.entity import Entity
from models.item import Item
from models.route import Route
from models.risk import Risk
from models.action import Action

def seed_data():
    # Ensure tables are created
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # 1. Create Business
        business = Business(
            name="Google Consumer Electronics",
            description="Developing and distributing high-end consumer electronics like the Pixel series."
        )
        db.add(business)
        db.commit()
        db.refresh(business)
        print(f"Created Business: {business.name} (ID: {business.id})")

        # 2. Create User
        user = User(
            business_id=business.id,
            email="jeff-ryu@google.com",
            password="hashed_password_placeholder",
            name="Jeff Ryu"
        )
        db.add(user)
        print(f"Created User: {user.name}")

        # 3. Create Entities
        entities = [
            Entity(business_id=business.id, name="TSMC Hsinchu", description="Semiconductor manufacturing plant", location="Hsinchu, Taiwan"),
            Entity(business_id=business.id, name="Foxconn Shenzhen", description="Main assembly factory", location="Shenzhen, China"),
            Entity(business_id=business.id, name="Google Taipei R&D", description="Engineering and design center", location="Taipei, Taiwan"),
            Entity(business_id=business.id, name="Google Mountain View Warehouse", description="North American distribution hub", location="Mountain View, CA, USA"),
            Entity(business_id=business.id, name="Google Store NYC", description="Flagship retail location", location="New York, NY, USA")
        ]
        db.add_all(entities)
        db.commit()
        for e in entities:
            db.refresh(e)
            print(f"Created Entity: {e.name}")

        # 4. Create Items
        items = [
            Item(business_id=business.id, name="Tensor G4 Chip", category="component", description="Next-gen AI processor"),
            Item(business_id=business.id, name="OLED Display Panel", category="component", description="High-refresh rate AMOLED panel"),
            Item(business_id=business.id, name="Google Pixel 9 Pro", category="finished product", description="Flagship smartphone"),
            Item(business_id=business.id, name="Recycled Aluminum", category="raw material", description="Eco-friendly chassis material")
        ]
        db.add_all(items)
        db.commit()
        for i in items:
            db.refresh(i)
            print(f"Created Item: {i.name}")

        # Map entities and items for easy access
        id_map = {e.name: e.id for e in entities}
        item_map = {i.name: i.id for i in items}

        # 5. Create Routes
        routes = [
            Route(
                business_id=business.id,
                name="Chip Logistics",
                description="Shipping Tensor chips for assembly",
                start_entity_id=id_map["TSMC Hsinchu"],
                end_entity_id=id_map["Foxconn Shenzhen"],
                item_id=item_map["Tensor G4 Chip"],
                transportation_mode="Air",
                lead_time=2,
                cost=50000
            ),
            Route(
                business_id=business.id,
                name="Final Product Export",
                description="Shipping assembled Pixels to US hub",
                start_entity_id=id_map["Foxconn Shenzhen"],
                end_entity_id=id_map["Google Mountain View Warehouse"],
                item_id=item_map["Google Pixel 9 Pro"],
                transportation_mode="Sea",
                lead_time=21,
                cost=200000
            ),
            Route(
                business_id=business.id,
                name="Retail Distribution",
                description="Shipping to NYC store",
                start_entity_id=id_map["Google Mountain View Warehouse"],
                end_entity_id=id_map["Google Store NYC"],
                item_id=item_map["Google Pixel 9 Pro"],
                transportation_mode="Truck",
                lead_time=5,
                cost=15000
            )
        ]
        db.add_all(routes)
        db.commit()
        for r in routes:
            db.refresh(r)
            print(f"Created Route: {r.name}")

        # 6. Create Risks
        risks = [
            Risk(
                business_id=business.id,
                target_type="entity",
                target_id=id_map["TSMC Hsinchu"],
                category="geopolitical",
                severity=0.8,
                probability=0.2,
                description="Regional tensions affecting semiconductor exports."
            ),
            Risk(
                business_id=business.id,
                target_type="route",
                target_id=routes[1].id, # Final Product Export
                category="physical",
                severity=0.6,
                probability=0.3,
                description="Port congestion causing lead time delays."
            )
        ]
        db.add_all(risks)
        db.commit()
        for risk in risks:
            db.refresh(risk)
            print(f"Created Risk: {risk.category} (ID: {risk.id})")

        # 7. Create Actions
        actions = [
            Action(
                risk_id=risks[0].id,
                action_type="Mitigation",
                description="Maintain 3-month buffer inventory of Tensor chips in a local warehouse.",
                estimated_cost=2000000.0,
                expected_impact=0.7,
                implementation_status="In Progress"
            ),
            Action(
                risk_id=risks[1].id,
                action_type="Avoidance",
                description="Redirect logic to air freight for urgent shipments during peak congestion.",
                estimated_cost=500000.0,
                expected_impact=0.5,
                implementation_status="Planned"
            )
        ]
        db.add_all(actions)
        db.commit()
        for a in actions:
            print(f"Created Action: {a.action_type}")

        print("\nSeed data population completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
