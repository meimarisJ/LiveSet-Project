// Change this if your FastAPI app runs elsewhere or uses a different prefix.
const API = "http://127.0.0.1:8000/songs";
const PLAYLISTS_API = "http://127.0.0.1:8000/playlists";

let songs = [];
let editingId = null;
let sortKey = "id";
let sortDir = 1;

const $rows = document.getElementById("rows");
const $msg = document.getElementById("msg");
const $count = document.getElementById("count");
const $search = document.getElementById("search");

function showError(text) { $msg.textContent = text || ""; }

async function request(url, options) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      throw new Error(typeof detail.detail === "string" ? detail.detail : `Request failed (${res.status})`);
    }
    showError("");
    return res.status === 204 ? null : res.json();
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
  d.textContent = s;
  return d.innerHTML;
}

function render() {
  const q = $search.value.trim().toLowerCase();
  const list = songs
    .filter(s => [s.title, s.artist, s.genre].some(v => String(v).toLowerCase().includes(q)))
    .sort((a, b) => {
      const x = a[sortKey], y = b[sortKey];
      return (typeof x === "number" ? x - y : String(x).localeCompare(String(y))) * sortDir;
    });

  $count.textContent = `${songs.length} song${songs.length === 1 ? "" : "s"}`;

  if (!list.length) {
    $rows.innerHTML = `<tr><td colspan="6" class="empty">${songs.length ? "No songs match your filter." : "No songs yet. Add your first one above."}</td></tr>`;
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
      <td>${esc(s.genre)}</td>
      <td class="bpm">${s.bpm}</td>
      <td class="actions">
        <button class="link" data-act="edit">Edit</button>
        <button class="link del" data-act="delete">Delete</button>
      </td>
    </tr>`).join("");
}

// Add
document.getElementById("add-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  const body = {
    title: f.title.value.trim(),
    artist: f.artist.value.trim(),
    genre: f.genre.value.trim(),
    bpm: Number(f.bpm.value),
  };
  await request(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  f.reset();
  showView("list");
});

// Edit / save / cancel / delete
$rows.addEventListener("click", async e => {
  const btn = e.target.closest("button[data-act]");
  if (!btn) return;
  const tr = btn.closest("tr");
  const id = Number(tr.dataset.id);

  switch (btn.dataset.act) {
    case "edit":
      editingId = id; render(); break;
    case "cancel":
      editingId = null; render(); break;
    case "save": {
      const get = n => tr.querySelector(`[name=${n}]`).value.trim();
      await request(`${API}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: get("title"), artist: get("artist"), genre: get("genre"), bpm: Number(get("bpm")) }),
      });
      editingId = null;
      load();
      break;
    }
    case "delete":
      if (!confirm("Delete this song?")) return;
      await request(`${API}/${id}`, { method: "DELETE" });
      load();
      break;
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

// ---- Playlists ----
const $playlists = document.getElementById("playlists");
const $playlistForm = document.getElementById("playlist-form");

async function loadPlaylists() {
  const playlists = await request(PLAYLISTS_API);
  renderPlaylists(playlists);
}

function renderPlaylists(playlists) {
  if (!playlists.length) {
    $playlists.innerHTML = '<li class="empty">No playlists yet. Click "Add Playlist" to create one.</li>';
    return;
  }
  $playlists.innerHTML = playlists.map(p => `
    <li data-id="${p.id}">
      <span class="name">${esc(p.name)}</span>
      <button class="link del" data-act="delete-playlist">Delete</button>
    </li>`).join("");
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
  await request(PLAYLISTS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: $playlistForm.name.value.trim() }),
  });
  closePlaylistForm();
  loadPlaylists();
});

$playlists.addEventListener("click", async e => {
  const btn = e.target.closest('button[data-act="delete-playlist"]');
  if (!btn) return;
  if (!confirm("Delete this playlist?")) return;
  await request(`${PLAYLISTS_API}/${btn.closest("li").dataset.id}`, { method: "DELETE" });
  loadPlaylists();
});

// Switch between "View songs" (all songs) and "Add song"
function showView(name) {
  document.getElementById("view-list").hidden = name !== "list";
  document.getElementById("view-add").hidden = name !== "add";
  document.getElementById("view-playlists").hidden = name !== "playlists";
  document.querySelectorAll("nav button").forEach(b =>
    b.toggleAttribute("aria-current", b.dataset.view === name));
  document.querySelectorAll("nav button[aria-current]").forEach(b => b.setAttribute("aria-current", "page"));
  if (name === "list") {
    $search.value = "";   // show every song
    editingId = null;
    load().catch(() => {});
  } else if (name === "add") {
    document.querySelector("#add-form [name=title]").focus();
  } else {
    closePlaylistForm();
    loadPlaylists().catch(() => {});
  }
}
document.querySelector("nav").addEventListener("click", e => {
  const b = e.target.closest("button[data-view]");
  if (b) showView(b.dataset.view);
});

showView("list");