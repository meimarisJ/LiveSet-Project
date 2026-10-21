from models.track import Playlist
from fastapi import HTTPException
from data.database import add_playlist_to_db, remove_playlist_from_db, get_playlists_from_db

def get_playlists():
    return get_playlists_from_db()

def add_playlist(playlist: Playlist):
    playlist_id = add_playlist_to_db(playlist)
    return {"message:":"Playlist created succesfully."}

def remove_playlist(playlist_id: int):
    if not remove_playlist_from_db(playlist_id):
        return HTTPException(status_code=404, detail="Playlist not found.")
    return {"message":"Playlist deleted."}