import sys
import os
from sqlalchemy.orm import Session

# Add the root directory to sys.path so we can import 'app' as a package
ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if ROOT_DIR not in sys.path:
    sys.path.append(ROOT_DIR)

from app.database import SessionLocal, engine, Base
from app.models.business import Business
from app.models.user import User
from app.models.entity import Entity
from app.models.item import Item
from app.models.route import Route
from app.models.risk import Risk
from app.models.action import Action
from app.models.news import News
import datetime

def seed_data():
    # Ensure tables are created
    print("Creating tables...")
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Clear existing data to avoid unique constraint violations
        print("Clearing existing data...")
        db.query(News).delete()
        db.query(Action).delete()
        db.query(Risk).delete()
        db.query(Route).delete()
        db.query(Item).delete()
        db.query(Entity).delete()
        db.query(User).delete()
        db.query(Business).delete()
        db.commit()

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
            email="admin@gmail.com",
            password="0000",
            name="Jeff Ryu"
        )
        db.add(user)
        print(f"Created User: {user.name} (admin@gmail.com / 0000)")

        # 3. Create Entities
        entities = [
            # Tier 3 & 2 -> supplier
            Entity(business_id=business.id, category="supplier", name="Boliden Mine (Sweden)", description="Copper and zinc extraction", location="Skellefteå, Sweden"),
            Entity(business_id=business.id, category="supplier", name="Albemarle Salar", description="Lithium extraction site", location="Atacama, Chile"),
            Entity(business_id=business.id, category="supplier", name="Sumitomo Metal Mining Co.", description="Refined cobalt and lithium production", location="Niihama, Japan"),
            Entity(business_id=business.id, category="supplier", name="TSMC Hsinchu", description="Semiconductor fabrication plant", location="Hsinchu, Taiwan"),
            Entity(business_id=business.id, category="supplier", name="Sunny Optical", description="Camera module assembly", location="Ningbo, China"),
            
            # Internal -> factory / inventory
            Entity(business_id=business.id, category="factory", name="LG Energy Solution (Cheongju)", description="Battery pack assembly", location="Cheongju, South Korea"),
            Entity(business_id=business.id, category="inventory", name="Shenzhen Component Hub", description="Strategic inventory for components", location="Shenzhen, China"),
            
            # OEM
            Entity(business_id=business.id, category="oem", name="Foxconn Shenzhen", description="Main assembly factory", location="Shenzhen, China"),
            Entity(business_id=business.id, category="oem", name="Google Taipei R&D", description="Engineering and design center", location="Taipei, Taiwan")
        ]
        db.add_all(entities)
        db.commit()
        for e in entities:
            db.refresh(e)
            print(f"Created Entity: {e.name} ({e.category})")

        # 4. Create Items
        items = [
            Item(business_id=business.id, name="Refined Lithium", category="raw material", description="High-purity Lithium Carbonate"),
            Item(business_id=business.id, name="Tensor G4 Chip", category="component", description="Next-gen AI processor"),
            Item(business_id=business.id, name="Battery Pack", category="sub-assembly", description="5000mAh Li-ion battery"),
            Item(business_id=business.id, name="Camera Module", category="sub-assembly", description="Triple-lens setup"),
            Item(business_id=business.id, name="Google Pixel 9 Pro", category="finished product", description="Flagship smartphone")
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
            # Supplier -> Factory/Inventory
            Route(business_id=business.id, name="Lithium Supply", description="Raw lithium transport from Chile to Japan", start_entity_id=id_map["Albemarle Salar"], end_entity_id=id_map["Sumitomo Metal Mining Co."], item_id=item_map["Refined Lithium"], transportation_mode="Sea", lead_time=30, cost=50000),
            Route(business_id=business.id, name="Refined Lithium Flow", description="Lithium to Battery Factory", start_entity_id=id_map["Sumitomo Metal Mining Co."], end_entity_id=id_map["LG Energy Solution (Cheongju)"], item_id=item_map["Refined Lithium"], transportation_mode="Air", lead_time=3, cost=10000),
            
            # Boliden -> TSMC (Copper for chips)
            Route(business_id=business.id, name="Copper Supply", description="Copper for semiconductor lead frames", start_entity_id=id_map["Boliden Mine (Sweden)"], end_entity_id=id_map["TSMC Hsinchu"], item_id=item_map["Refined Lithium"], transportation_mode="Sea", lead_time=15, cost=20000),

            # Components -> Inventory
            Route(business_id=business.id, name="Chip Stockpiling", description="Processing wafers to inventory", start_entity_id=id_map["TSMC Hsinchu"], end_entity_id=id_map["Shenzhen Component Hub"], item_id=item_map["Tensor G4 Chip"], transportation_mode="Air", lead_time=2, cost=15000),
            Route(business_id=business.id, name="Optics Buffer", description="Camera modules to inventory", start_entity_id=id_map["Sunny Optical"], end_entity_id=id_map["Shenzhen Component Hub"], item_id=item_map["Camera Module"], transportation_mode="Truck", lead_time=1, cost=5000),
            
            # Factory/Inventory -> OEM
            Route(business_id=business.id, name="Battery Delivery", description="Assembled packs to OEM", start_entity_id=id_map["LG Energy Solution (Cheongju)"], end_entity_id=id_map["Foxconn Shenzhen"], item_id=item_map["Battery Pack"], transportation_mode="Sea", lead_time=7, cost=12000),
            Route(business_id=business.id, name="Component Kitting", description="Sending all parts for assembly", start_entity_id=id_map["Shenzhen Component Hub"], end_entity_id=id_map["Foxconn Shenzhen"], item_id=item_map["Tensor G4 Chip"], transportation_mode="Truck", lead_time=1, cost=3000),
            
            # OEM -> R&D
            Route(business_id=business.id, name="Quality Validation", description="Final devices for R&D validation", start_entity_id=id_map["Foxconn Shenzhen"], end_entity_id=id_map["Google Taipei R&D"], item_id=item_map["Google Pixel 9 Pro"], transportation_mode="Air", lead_time=1, cost=2000)
        ]
        db.add_all(routes)
        db.commit()

        # 6. Create Risks
        risks = [
            Risk(
                business_id=business.id,
                target_type="entity",
                target_id=id_map["TSMC Hsinchu"],
                category="geopolitical",
                severity=0.9,
                probability=0.4,
                description="Export restrictions on advanced semiconductor nodes."
            ),
            Risk(
                business_id=business.id,
                target_type="entity",
                target_id=id_map["Albemarle Salar"],
                category="environmental",
                severity=0.7,
                probability=0.3,
                description="Water usage regulations impacting lithium extraction rates."
            ),
            Risk(
                business_id=business.id,
                target_type="route",
                target_id=routes[0].id, # Lithium Supply
                category="physical",
                severity=0.5,
                probability=0.6,
                description="Canal blockages delaying bulk raw material shipments."
            )
        ]
        db.add_all(risks)
        db.commit()

        # 7. Create Actions
        actions = [
            Action(
                risk_id=risks[0].id,
                action_type="Mitigation",
                description="Strategic stockpile of 12-month supply of Tensor chipsets.",
                estimated_cost=5000000.0,
                expected_impact=0.8,
                implementation_status="In Progress"
            ),
            Action(
                risk_id=risks[1].id,
                action_type="Diversification",
                description="Qualify secondary lithium suppliers in Australia.",
                estimated_cost=1000000.0,
                expected_impact=0.6,
                implementation_status="Planned"
            ),
            Action(
                risk_id=risks[2].id,
                action_type="Avoidance",
                description="Establish alternative sea routes via Cape of Good Hope.",
                estimated_cost=200000.0,
                expected_impact=0.4,
                implementation_status="Planned"
            )
        ]
        db.add_all(actions)
        db.commit()

        # 8. Create News
        news_items = [
            News(
                business_id=business.id,
                risk_id=risks[0].id, # TSMC risk
                title="Taiwanese Export Control Update",
                content="New restrictions on advanced semiconductor node exports expected in Q3.",
                source="Global Trade News",
                published_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
            ),
            News(
                business_id=business.id,
                risk_id=risks[1].id, # Lithium risk
                title="Atacama Water Rights Dispute",
                content="Local communities challenge water usage of major lithium extractors.",
                source="Environmental Insight",
                published_at=datetime.datetime.utcnow() - datetime.timedelta(hours=5)
            ),
            News(
                business_id=business.id,
                title="Shenzen Logistics Recovery",
                content="Port operations returning to normal after seasonal peak capacity reached.",
                source="Logistics Weekly",
                published_at=datetime.datetime.utcnow() - datetime.timedelta(hours=8)
            )
        ]
        db.add_all(news_items)
        db.commit()
        print(f"Created {len(news_items)} news items.")

        print("\nSeed data population completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
