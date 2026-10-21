from fastapi import FastAPI
from routes.tracks import router 
from routes.playlists import play_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.include_router(router)
app.include_router(play_router)

@app.get("/")
def home():
    return {"message": "Welcome to LiveSet!"}

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"]
)