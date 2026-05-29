from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSONB
from app.database.session import Base

class BuildingDesign(Base):
    __tablename__ = "building_designs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    design_name = Column(String, index=True, nullable=False)
    design_type = Column(String, index=True, nullable=False)  # e.g., "blueprint", "interior", "3d_mesh"
    design_data = Column(JSONB, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    # Relationship
    project = relationship("Project", back_populates="building_designs")
