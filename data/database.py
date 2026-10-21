import sqlite3
connection = sqlite3.connect("data/liveset.db" ,check_same_thread=False)
cursor = connection.cursor()


cursor.execute("""
CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT ,
    genre TEXT,
    bpm INTEGER CHECK (bpm IS NULL or bpm > 0)
    )
    """)
connection.commit()

cursor.execute("""
CREATE TABLE IF NOT EXISTS playlists(
id INTEGER PRIMARY KEY AUTOINCREMENT,
name TEXT NOT NULL)
""")
connection.commit()

cursor.execute("""
CREATE TABLE IF NOT EXISTS playlist_tracks(
playlist_id INTEGER NOT NULL ,
track_id INTEGER NOT NULL,
PRIMARY KEY (playlist_id, track_id),
FOREIGN KEY (playlist_id) REFERENCES playlists(id),
FOREIGN KEY (track_id) REFERENCES tracks(id)
);
""")
connection.commit()


def get_tracks_from_db():
    cursor.execute("SELECT * FROM tracks")
    rows = cursor.fetchall()
    
    tracks =[]

    for row in rows:
        track = {
            "id":row[0],
            "title":row[1],
            "artist":row[2],
            "genre":row[3],
            "bpm":row[4]
        }
        tracks.append(track)

    return tracks
    
def find_track_from_db(track_id):
    cursor.execute(
    "SELECT * FROM tracks WHERE id = ?", (track_id,)
    )
    row = cursor.fetchone()
    return row




def add_track_to_db(track):
    print("Adding track:", track)

    cursor.execute("""
        INSERT INTO tracks (title, artist, genre, bpm)
        VALUES (?, ?, ?, ?)
    """, (track.title, track.artist, track.genre, track.bpm))

    connection.commit()


def remove_track_from_db(track_id):
    cursor.execute(""" 
    DELETE FROM tracks 
    WHERE id = ?
    """, (track_id,))
    connection.commit()
    if cursor.rowcount == 0:
        return False
    return True

def update_track_from_db(track_id , track):
    cursor.execute("""
    UPDATE tracks
    set title = ? , artist = ? , genre = ? , bpm = ?
    WHERE id = ?
    """ , (track.title, track.artist, track.genre, track.bpm, track_id))
    connection.commit()
    if cursor.rowcount == 0:
        return False
    return True

def get_playlists_from_db():
    cursor.execute("SELECT * FROM playlists")
    rows = cursor.fetchall()
    
    playlists =[]

    for row in rows:
        playlist = {
            "id":row[0],
            "name":row[1],
        }
        playlists.append(playlist)

    return playlists
        
def find_track_from_db(track_id):
    cursor.execute(
    "SELECT * FROM tracks WHERE id = ?", (track_id,)
    )
    row = cursor.fetchone()
    return row

def add_playlist_to_db(playlist):
    cursor.execute("""
    INSERT INTO playlists (name) VALUES (?)
    """, (playlist.name,))
    connection.commit()
    return cursor.lastrowid

def remove_playlist_from_db(playlist_id):
    cursor.execute("""
    DELETE FROM playlists
    WHERE id = ?
    """, (playlist_id,))
    connection.commit()
    if cursor.rowcount ==0:
        return False
    return True

def add_track_to_playlist_in_db(playlist_id,track_id):
    cursor.execute("""
    INSERT INTO playlist_tracks (playlist_id, track_id)
    VALUES(?,?) """,(playlist_id,track_id))
    connection.commit()