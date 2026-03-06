from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.action import Action
from app.schemas.action import ActionSchema, ActionUpdate

router = APIRouter(prefix="/api/action", tags=["Action"])

@router.patch("/{action_id}", response_model=ActionSchema)
def update_action_status(action_id: int, action_update: ActionUpdate, db: Session = Depends(get_db)):
    db_action = db.query(Action).filter(Action.id == action_id).first()
    if not db_action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    update_data = action_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_action, key, value)
    
    db.commit()
    db.refresh(db_action)
    return db_action
