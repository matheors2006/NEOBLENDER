from pydantic import BaseModel, Field


class ExportRingSpec(BaseModel):
    radius: float = Field(gt=0)
    thickness: float = Field(gt=0)
