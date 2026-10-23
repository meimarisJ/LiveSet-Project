from models.track import Track
from fastapi import HTTPException
from data.database import add_track_to_db, remove_track_from_db, update_track_from_db
from data.database import find_track_from_db, get_tracks_from_db
def get_tracks():
    return get_tracks_from_db()

def find_track(track_id: int):
    return find_track_from_db(track_id)


def add_track(track: Track):
    add_track_to_db(track)
    return  {"message" : "Track added succesfully."} 


def remove_track(track_id: int):
    if not remove_track_from_db(track_id):
        return HTTPException( status_code=404 , detail= "Track not found")
    return{"message": "Track deleted."}

def edit_track(track_id: int , track: Track):
    if not update_track_from_db(track_id, track):
        return HTTPException( status_code=404 , detail= "Track not found")
    return {"message": "Track updated."}

