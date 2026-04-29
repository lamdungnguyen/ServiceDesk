from pydantic import BaseModel, Field
from typing import List, Literal, Optional


class MessagePayload(BaseModel):
    senderType: Literal["employee", "customer"]
    text: str = Field(min_length=1)
    responseTimeSec: Optional[float] = None


class AnalyzePayload(BaseModel):
    messages: List[MessagePayload] = Field(min_items=1)
    language: Literal["vi", "en", "mix"] = "en"


class EmployeePredictionPayload(BaseModel):
    employeeId: int
    kpiScore: float
    sentimentScore: float
    resolutionScore: float
    communicationScore: float
