from pydantic import BaseModel , Field
from typing import Optional
class Track(BaseModel):
    title: str = Field(min_length=1)
    artist: Optional[str] = None 
    genre: Optional[str] = None
    bpm: Optional[int] = Field(default= None, gt = 0 , le = 300)
class Playlist(BaseModel):
    name: str = Field(min_length=1)