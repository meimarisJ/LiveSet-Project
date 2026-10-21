from fastapi import APIRouter ,HTTPException
from models.track import Track
from services.track_services import find_track, add_track, remove_track, edit_track , find_track ,get_tracks



router = APIRouter()

@router.get("/")
def home():
    return {"message": "Welcome to LiveSet"}

@router.get("/tracks")
def show_tracks():
    return get_tracks()

@router.get("/tracks/{track_id}")
def get_track(track_id: int):
    track = find_track(track_id)
    if track is None:
        raise HTTPException(status_code=404, detail= "Track Not Found.")
    return track
@router.post("/tracks",status_code=201)
def create_track(track: Track):
    return add_track(track)

@router.delete("/tracks/{track_id}")
def delete_track(track_id: int):
    return remove_track(track_id)

@router.put("/tracks/{track_id}")
def update_track(track_id:int  ,track: Track):
    return edit_track(track_id, track)
