from fastapi import APIRouter ,HTTPException
from models.track import Playlist
from services.playlist_services import add_playlist, remove_playlist, get_playlists, add_track_to_playlist,get_tracks_from_playlist, remove_track_from_playlist

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

@play_router.post("/playlists/{playlist_id}/tracks/{track_id}",status_code=201)
def move_track_to_playlist(playlist_id:int,track_id:int):
    return add_track_to_playlist(playlist_id,track_id)

@play_router.get("/playlist_tracks/{playlist_id}")
def show_songs_in_playlist(playlist_id: int):
    return get_tracks_from_playlist(playlist_id)

@play_router.delete("/playlist_tracks/{playlist_id}/{track_id}")
def delete_song_from_playlist(playlist_id:int,track_id:int):
    return remove_track_from_playlist(playlist_id,track_id)
