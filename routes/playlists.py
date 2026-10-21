from fastapi import APIRouter ,HTTPException
from models.track import Playlist
from services.playlist_services import add_playlist, remove_playlist, get_playlists

play_router = APIRouter()

@play_router.get("/playlists")
def show_playlists():
    return get_playlists()

@play_router.post("/playlists",status_code=201)
def create_playlist(playlist: Playlist):
    return add_playlist(playlist)

@play_router.delete("/playlists/{playlist_id}")
def delete_playlist(playlist_id: int):
    return remove_playlist(playlist_id)