from models.track import Playlist
from fastapi import HTTPException
from data.database import add_playlist_to_db, remove_playlist_from_db, get_playlists_from_db, add_track_to_playlist_in_db,get_tracks_from_playlist_from_db
from data.database import remove_track_from_playlist_in_db

def get_playlists():
    return get_playlists_from_db()

def add_playlist(playlist: Playlist):
    playlist_id = add_playlist_to_db(playlist)
    return {"message:":"Playlist created succesfully."}

def remove_playlist(playlist_id: int):
    if not remove_playlist_from_db(playlist_id):
        return HTTPException(status_code=404, detail="Playlist not found.")
    return {"message":"Playlist deleted."}

def add_track_to_playlist(playlist_id : int, track_id: int):
    result = add_track_to_playlist_in_db(playlist_id,track_id)
    if result == "Playlist not found.":
        raise HTTPException(status_code=404,detail="Playlist not found.")
    
    elif result == "Track not found.":
        raise HTTPException(status_code=404, detail="Track not found.")
    
    return result

def get_tracks_from_playlist(playlist_id : int):
    songs = get_tracks_from_playlist_from_db(playlist_id)
    if not songs:
        return []
    return songs

def remove_track_from_playlist(playlist_id:int,track_id: int):
    result = remove_track_from_playlist_in_db(playlist_id,track_id)
    if not result:
        return HTTPException(status_code=404,detail="Track not found in playlist.")
    return {"message":"Track removed."}
