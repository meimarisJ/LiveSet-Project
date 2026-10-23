
const API = "http://127.0.0.1:8000/tracks";
const PLAYLISTS_API = "http://127.0.0.1:8000/playlists";
const PLAYLIST_TRACKS_API = "http://127.0.0.1:8000/playlist_tracks";

let songs = [];
let editingId = null;
let sortKey = "id";
let sortDir = 1;
let currentPlaylistId = null;

const $rows = document.getElementById("rows");
const $msg = document.getElementById("msg");
const $count = document.getElementById("count");
const $search = document.getElementById("search");

const $playlists = document.getElementById("playlists");
const $playlistForm = document.getElementById("playlist-form");
const $playlistTracks = document.getElementById("playlist-tracks");

function showError(text) {
  $msg.textContent = text || "";
}

async function request(url, options) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(
        typeof detail.detail === "string"
          ? detail.detail
          : `Request failed (${res.status})`
      );
    }

    showError("");

    if (res.status === 204) return null;

    return res.json();
  } catch (err) {
    showError(err.message || "Could not reach the server.");
    throw err;
  }
}

async function load() {
  songs = await request(API);
  render();
}

function esc(s) {
  const d = document.createElement("div");
  d.textContent = s ?? "";
  return d.innerHTML;
}

// -------------------- SONGS --------------------

function render() {
  const q = $search.value.trim().toLowerCase();

  const list = songs
    .filter(s =>
      [s.title, s.artist, s.genre].some(v =>
        String(v ?? "").toLowerCase().includes(q)
      )
    )
    .sort((a, b) => {
      const x = a[sortKey];
      const y = b[sortKey];

      return (
        (typeof x === "number"
          ? x - y
          : String(x ?? "").localeCompare(String(y ?? ""))) * sortDir
      );
    });

  $count.textContent = `${songs.length} song${songs.length === 1 ? "" : "s"}`;

  if (!list.length) {
    $rows.innerHTML = `
      <tr>
        <td colspan="6" class="empty">
          ${songs.length
            ? "No songs match your filter."
            : "No songs yet. Add your first one above."}
        </td>
      </tr>`;
    return;
  }

  $rows.innerHTML = list.map(s => s.id === editingId ? `
    <tr data-id="${s.id}">
      <td class="num">${s.id}</td>
      <td><input name="title" value="${esc(s.title)}"></td>
      <td><input name="artist" value="${esc(s.artist)}"></td>
      <td><input name="genre" value="${esc(s.genre)}"></td>
      <td><input name="bpm" type="number" min="1" value="${s.bpm}"></td>
      <td class="actions">
        <button class="link" data-act="save">Save</button>
        <button class="link" data-act="cancel">Cancel</button>
      </td>
    </tr>` : `
    <tr data-id="${s.id}">
      <td class="num">${s.id}</td>
      <td>${esc(s.title)}</td>
      <td>${esc(s.artist)}</td>
      <td>${esc(s.genre ?? "-")}</td>
      <td class="bpm">${s.bpm ?? "-"}</td>
      <td class="actions">
        <button class="link" data-act="edit">Edit</button>
        <button class="link del" data-act="delete">Delete</button>
      </td>
    </tr>`
  ).join("");
}

// Add song to library
document.getElementById("add-form").addEventListener("submit", async e => {
  e.preventDefault();

  const f = e.target;

  const body = {
    title: f.title.value.trim(),
    artist: f.artist.value.trim(),
    genre: f.genre.value.trim() || null,
    bpm: f.bpm.value ? Number(f.bpm.value) : null,
  };

  try {
    await request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    f.reset();
    showView("list");
  } catch (error) {
    console.error("Could not add song:", error);
  }
});

// Edit / save / cancel / delete song
$rows.addEventListener("click", async e => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;

  const tr = btn.closest("tr");
  const id = Number(tr.dataset.id);

  try {
    switch (btn.dataset.act) {
      case "edit":
        editingId = id;
        render();
        break;

      case "cancel":
        editingId = null;
        render();
        break;

      case "save": {
        const get = n =>
          tr.querySelector(`[name=${n}]`).value.trim();

        await request(`${API}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: get("title"),
            artist: get("artist"),
            genre: get("genre"),
            bpm: Number(get("bpm")),
          }),
        });

        editingId = null;
        await load();
        break;
      }

      case "delete":
        if (!confirm("Delete this song?")) return;

        await request(`${API}/${id}`, { method: "DELETE" });
        await load();
        break;
    }
  } catch (error) {
    console.error("Song operation failed:", error);
  }
});

// Sort + filter
document.querySelector("thead").addEventListener("click", e => {
  const key = e.target.dataset.key;
  if (!key) return;

  sortDir = key === sortKey ? -sortDir : 1;
  sortKey = key;
  render();
});

$search.addEventListener("input", render);

// -------------------- PLAYLISTS --------------------

async function loadPlaylists() {
  const playlists = await request(PLAYLISTS_API);
  renderPlaylists(playlists);
}

function renderPlaylists(playlists) {
  if (!playlists.length) {
    $playlists.innerHTML =
      '<li class="empty">No playlists yet. Click "Add Playlist" to create one.</li>';
    return;
  }

  $playlists.innerHTML = playlists.map(p => `
    <li data-id="${p.id}">
      <button class="link" data-act="open-playlist" type="button">
        ${esc(p.name)}
      </button>
      <button class="link del" data-act="delete-playlist" type="button">
        Delete
      </button>
    </li>`
  ).join("");
}

function closePlaylistForm() {
  $playlistForm.hidden = true;
  $playlistForm.reset();
}

document.getElementById("add-playlist-btn").addEventListener("click", () => {
  $playlistForm.hidden = false;
  $playlistForm.name.focus();
});

document.getElementById("cancel-playlist").addEventListener("click", closePlaylistForm);

$playlistForm.addEventListener("submit", async e => {
  e.preventDefault();

  try {
    await request(PLAYLISTS_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: $playlistForm.name.value.trim(),
      }),
    });

    closePlaylistForm();
    await loadPlaylists();
  } catch (error) {
    console.error("Could not create playlist:", error);
  }
});

$playlists.addEventListener("click", async e => {
  const deleteButton = e.target.closest(
    'button[data-act="delete-playlist"]'
  );

  if (deleteButton) {
    if (!confirm("Delete this playlist?")) return;

    const playlistId = Number(
      deleteButton.closest("li").dataset.id
    );

    try {
      await request(`${PLAYLISTS_API}/${playlistId}`, {
        method: "DELETE",
      });

      await loadPlaylists();
    } catch (error) {
      console.error("Could not delete playlist:", error);
    }

    return;
  }

  const openButton = e.target.closest(
    'button[data-act="open-playlist"]'
  );

  if (openButton) {
    const playlist = openButton.closest("li");

    await openPlaylist(
      Number(playlist.dataset.id),
      openButton.textContent.trim()
    );
  }
});

async function openPlaylist(playlistId, playlistName) {
  currentPlaylistId = playlistId;

  try {
    const tracks = await request(
      `${PLAYLIST_TRACKS_API}/${playlistId}`
    );

    displayPlaylistTracks(tracks, playlistName);
  } catch (error) {
    console.error("Could not open playlist:", error);
  }
}

function displayPlaylistTracks(tracks, playlistName) {
  const title = document.getElementById("playlist-title");

  title.textContent = playlistName;
  $playlistTracks.innerHTML = "";

  if (tracks.length === 0) {
    $playlistTracks.textContent = "This playlist is empty.";
  } else {
    tracks.forEach(track => {
      const item = document.createElement("li");

      // The backend currently returns each track as an array:
      // [id, title, artist, genre, bpm]
      const songInfo = document.createElement("span");

      songInfo.textContent =
        `${track[1]} - ${track[2]} (${track[4]} BPM)`;

      const removeButton = document.createElement("button");

      removeButton.textContent = "Remove";
      removeButton.type = "button";
      removeButton.dataset.trackId = track[0];
      removeButton.dataset.act = "remove-from-playlist";

      item.appendChild(songInfo);
      item.appendChild(document.createTextNode(" "));
      item.appendChild(removeButton);

      $playlistTracks.appendChild(item);
    });
  }

  document.getElementById("add-song-picker").hidden = true;
  showView("playlist-details");
}

// -------------------- ADD SONG TO PLAYLIST --------------------

document.getElementById("add-song-to-playlist").addEventListener("click", async () => {
  const picker = document.getElementById("add-song-picker");
  const select = document.getElementById("available-songs");

  try {
    songs = await request(API);

    select.innerHTML = '<option value="">Choose a song...</option>';

    songs.forEach(song => {
      const option = document.createElement("option");

      option.value = song.id;
      option.textContent = `${song.title} - ${song.artist}`;

      select.appendChild(option);
    });

    picker.hidden = false;
  } catch (error) {
    console.error("Could not load available songs:", error);
  }
});

document.getElementById("cancel-add-song").addEventListener("click", () => {
  document.getElementById("add-song-picker").hidden = true;
});

document.getElementById("confirm-add-song").addEventListener("click", async () => {
  const trackId = document.getElementById("available-songs").value;

  if (!trackId || currentPlaylistId === null) {
    showError("Choose a song first.");
    return;
  }

  try {
    await request(
      `${PLAYLISTS_API}/${currentPlaylistId}/tracks/${trackId}`,
      { method: "POST" }
    );

    const playlistName =
      document.getElementById("playlist-title").textContent;

    await openPlaylist(currentPlaylistId, playlistName);
  } catch (error) {
    console.error("Could not add song to playlist:", error);
  }
});

// -------------------- REMOVE SONG FROM PLAYLIST --------------------

$playlistTracks.addEventListener("click", async e => {
  const button = e.target.closest(
    'button[data-act="remove-from-playlist"]'
  );

  if (!button) return;

  const trackId = Number(button.dataset.trackId);

  if (!confirm("Remove this song from the playlist?")) return;

  try {
    await request(
      `${PLAYLISTS_API}/${currentPlaylistId}/tracks/${trackId}`,
      { method: "DELETE" }
    );

    const playlistName =
      document.getElementById("playlist-title").textContent;

    await openPlaylist(currentPlaylistId, playlistName);
  } catch (error) {
    console.error("Could not remove song from playlist:", error);
  }
});

// -------------------- NAVIGATION --------------------

function showView(name) {
  document.getElementById("view-list").hidden = name !== "list";
  document.getElementById("view-add").hidden = name !== "add";
  document.getElementById("view-playlists").hidden = name !== "playlists";
  document.getElementById("view-playlist-details").hidden =
    name !== "playlist-details";

  document.querySelectorAll("nav button").forEach(button => {
    button.toggleAttribute("aria-current", button.dataset.view === name);
  });

  document.querySelectorAll("nav button[aria-current]").forEach(button => {
    button.setAttribute("aria-current", "page");
  });

  if (name === "list") {
    $search.value = "";
    editingId = null;
    load().catch(() => {});
  } else if (name === "add") {
    document.querySelector("#add-form [name=title]").focus();
  } else if (name === "playlists") {
    closePlaylistForm();
    loadPlaylists().catch(() => {});
  }
}

document.querySelector("nav").addEventListener("click", e => {
  const button = e.target.closest("button[data-view]");
  if (button) showView(button.dataset.view);
});

document.getElementById("back-to-playlists").addEventListener("click", () => {
  showView("playlists");
});

showView("list");
