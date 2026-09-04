from pydantic import BaseModel
from typing import List

class DatabaseStatusResponse(BaseModel):
    database: str
    status: str
    host: str
    port: int

class DatabaseTableResponse(BaseModel):
    name: str
    rowCount: str
    lastUpdated: str
    status: str
