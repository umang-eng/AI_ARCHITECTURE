from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.session import Base


class Blueprint(Base):
    __tablename__ = "blueprints"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    building_type = Column(String, nullable=False)
    style = Column(String, nullable=False)
    plot_width = Column(Integer, nullable=False)
    plot_height = Column(Integer, nullable=False)
    current_version = Column(Integer, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    versions = relationship("BlueprintVersion", back_populates="blueprint", cascade="all, delete-orphan")


class BlueprintVersion(Base):
    __tablename__ = "blueprint_versions"

    id = Column(Integer, primary_key=True, index=True)
    blueprint_id = Column(Integer, ForeignKey("blueprints.id", ondelete="CASCADE"), nullable=False)
    version = Column(Integer, nullable=False)
    seed = Column(Integer, nullable=False)
    blueprint_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    blueprint = relationship("Blueprint", back_populates="versions")
