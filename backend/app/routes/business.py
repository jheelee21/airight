from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.entity import Entity
from models.route import Route
from models.business import Business
import schemas.business as business_schemas

router = APIRouter(prefix="/api/business", tags=["Business"])

@router.get("/{business_id}", response_model=business_schemas.BusinessResponse)
def get_business(business_id: int, db: Session = Depends(get_db)):
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")
    return business


@router.patch("/{business_id}", response_model=business_schemas.BusinessResponse)
def update_business(business_id: int, business_update: business_schemas.BusinessUpdate, db: Session = Depends(get_db)):
    db_business = db.query(Business).filter(Business.id == business_id).first()
    if not db_business:
        raise HTTPException(status_code=404, detail="Business not found")
    
    update_data = business_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_business, key, value)
    
    db.commit()
    db.refresh(db_business)
    return db_business


from models.risk import Risk
import schemas.risk as risk_schemas

@router.get("/{business_id}/risks", response_model=List[risk_schemas.RiskSchema])
def get_business_risks(business_id: int, db: Session = Depends(get_db)):
    """
    Returns all risks associated with a specific business.
    """
    risks = db.query(Risk).filter(Risk.business_id == business_id).all()
    return risks


@router.get("/{business_id}/graph", response_model=business_schemas.GraphResponse)
def get_business_graph(business_id: int, db: Session = Depends(get_db)):
    """
    Returns the dependency graph for a specific business.
    The graph consists of entities (nodes) and routes (edges).
    """
    # Check if business exists
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business:
        raise HTTPException(status_code=404, detail="Business not found")

    # Fetch nodes (entities)
    entities = db.query(Entity).filter(Entity.business_id == business_id).all()
    
    # Fetch edges (routes)
    routes = db.query(Route).filter(Route.business_id == business_id).all()

    return {
        "business_id": business_id,
        "nodes": entities,
        "edges": routes
    }


from models.news import News
import schemas.news as news_schemas

@router.get("/{business_id}/news", response_model=List[news_schemas.NewsSchema])
def get_business_news(business_id: int, db: Session = Depends(get_db)):
    """
    Returns all news associated with a specific business.
    """
    news = db.query(News).filter(News.business_id == business_id).order_by(News.published_at.desc()).all()
    return news
