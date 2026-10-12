
"use strict";

/*
  STREAMING WEBSITE DEMO

  TMDB API token:
  Create one at https://www.themoviedb.org/settings/api

  For production, move API requests and authentication to a backend.
  This demo stores accounts locally and is not secure authentication.
*/

const TMDB_TOKEN = "PASTE_YOUR_TMDB_READ_ACCESS_TOKEN_HERE";
const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";
const PLACEHOLDER_IMAGE =
  "https://placehold.co/500x750/202020/ffffff?text=No+Poster";

const $ = id => document.getElementById(id);

const KEYS = {
  users: "streamflix_demo_users",
  session: "streamflix_demo_session",
  list: "streamflix_demo_list_"
};

const starterMovies = [
  {
    id: "starter-1",
    title: "Inception",
    year: "2010",
    genre: "Sci-Fi",
    rating: "8.8",
    image: "photo-1446776811953-b23d57bd21aa",
    description:
      "A skilled thief enters dreams to steal secrets in a world where reality is never quite what it seems.",
    trailer: "https://www.youtube.com/results?search_query=Inception+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-2",
    title: "Interstellar",
    year: "2014",
    genre: "Sci-Fi",
    rating: "8.7",
    image: "photo-1462331940025-496dfbfc7564",
    description:
      "Explorers travel beyond Earth in search of a future for humanity.",
    trailer: "https://www.youtube.com/results?search_query=Interstellar+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-3",
    title: "The Dark Knight",
    year: "2008",
    genre: "Action",
    rating: "9.0",
    image: "photo-1519608487953-e999c86e7455",
    description:
      "Batman faces a criminal mastermind threatening Gotham City.",
    trailer: "https://www.youtube.com/results?search_query=The+Dark+Knight+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-4",
    title: "Dune",
    year: "2021",
    genre: "Sci-Fi",
    rating: "8.0",
    image: "photo-1509316785289-025f5b846b35",
    description:
      "A young nobleman faces a dangerous struggle over a desert planet.",
    trailer: "https://www.youtube.com/results?search_query=Dune+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-5",
    title: "The Batman",
    year: "2022",
    genre: "Thriller",
    rating: "7.8",
    image: "photo-1511497584788-876760111969",
    description:
      "A detective uncovers corruption and a mystery in Gotham City.",
    trailer: "https://www.youtube.com/results?search_query=The+Batman+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-6",
    title: "Gladiator",
    year: "2000",
    genre: "Action",
    rating: "8.5",
    image: "photo-1464822759023-fed622ff2c3b",
    description:
      "A betrayed Roman general fights for justice and honour.",
    trailer: "https://www.youtube.com/results?search_query=Gladiator+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-7",
    title: "The Martian",
    year: "2015",
    genre: "Sci-Fi",
    rating: "8.0",
    image: "photo-1446776811953-b23d57bd21aa",
    description:
      "An astronaut stranded on Mars uses science to survive.",
    trailer: "https://www.youtube.com/results?search_query=The+Martian+official+trailer",
    mediaType: "movie"
  },
  {
    id: "starter-8",
    title: "Joker",
    year: "2019",
    genre: "Drama",
    rating: "8.3",
    image: "photo-1518709268805-4e9042af9f23",
    description:
      "A psychological drama following a troubled comedian.",
    trailer: "https://www.youtube.com/results?search_query=Joker+official+trailer",
    mediaType: "movie"
  }
];

let currentEmail = null;
let myList = [];
let activeCategory = "all";
let currentPage = 1;
let totalPages = 1;
let currentQuery = "";
let requestNumber = 0;
let searchTimer = null;
let currentMovie = null;
let currentView = "home";
let searchMode = false;
let lastFocusedElement = null;

let apiAvailable = false;
let apiStatus = "";

/* ---------------- STORAGE ---------------- */

function readJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getUsers() {
  const users = readJSON(KEYS.users, {});
  return users && typeof users === "object" && !Array.isArray(users)
    ? users
    : {};
}

function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function setMessage(element, message, type = "") {
  element.textContent = message;
  element.className = "message " + type;
}

function setSearchStatus(message) {
  $("searchStatus").textContent = message;
}

/* ---------------- AUTHENTICATION DEMO ---------------- */

function showAuth(page) {
  $("registerPage").hidden = page !== "register";
  $("loginPage").hidden = page !== "login";
  $("appPage").hidden = true;
}

function showApp() {
  $("registerPage").hidden = true;
  $("loginPage").hidden = true;
  $("appPage").hidden = false;

  $("welcomeUser").textContent =
    getUsers()[currentEmail]?.name || currentEmail;

  myList = readJSON(KEYS.list + currentEmail, []);
  if (!Array.isArray(myList)) myList = [];

  showPage("home");
}

$("registerForm").addEventListener("submit", event => {
  event.preventDefault();

  const name = $("fullName").value.trim();
  const email = $("registerEmail").value.trim().toLowerCase();
  const password = $("registerPassword").value;

  if (name.length < 2) {
    setMessage($("registerMessage"), "Enter your full name.", "error");
    return;
  }

  if (password.length < 8) {
    setMessage(
      $("registerMessage"),
      "Password must contain at least 8 characters.",
      "error"
    );
    return;
  }

  const users = getUsers();

  if (users[email]) {
    setMessage(
      $("registerMessage"),
      "This email is already registered. Please sign in.",
      "error"
    );
    return;
  }

  // Educational demo only. Plaintext passwords are NOT secure.
  users[email] = { name, password };

  if (!saveJSON(KEYS.users, users)) {
    setMessage(
      $("registerMessage"),
      "Browser storage is unavailable.",
      "error"
    );
    return;
  }

  $("registerForm").reset();
  $("loginEmail").value = email;

  showAuth("login");

  setMessage(
    $("loginMessage"),
    "Account created. Sign in to continue.",
    "success"
  );
});

$("loginForm").addEventListener("submit", event => {
  event.preventDefault();

  const email = $("loginEmail").value.trim().toLowerCase();
  const password = $("loginPassword").value;
  const user = getUsers()[email];

  if (!user || user.password !== password) {
    setMessage(
      $("loginMessage"),
      "Incorrect email or password.",
      "error"
    );
    return;
  }

  currentEmail = email;

  try {
    sessionStorage.setItem(KEYS.session, email);
  } catch {
    // Session still works until this page is closed.
  }

  $("loginForm").reset();
  showApp();
});

$("showLogin").addEventListener("click", event => {
  event.preventDefault();
  showAuth("login");
});

$("showRegister").addEventListener("click", event => {
  event.preventDefault();
  showAuth("register");
});

$("logoutButton").addEventListener("click", () => {
  closeModal();

  try {
    sessionStorage.removeItem(KEYS.session);
  } catch {}

  currentEmail = null;
  myList = [];
  showAuth("login");
});

/* ---------------- NAVIGATION ---------------- */

document.querySelectorAll("[data-page]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    showPage(link.dataset.page);
  });
});

function showPage(page) {
  currentView = page;
  searchMode = false;
  activeCategory = "all";
  currentQuery = "";
  currentPage = 1;
  totalPages = 1;
  requestNumber++;

  $("searchInput").value = "";
  $("homePage").hidden = page === "mylist";
  $("mylistPage").hidden = page !== "mylist";
  $("catalogSection").hidden = page === "mylist";
  $("hero").hidden = page !== "home";

  $("catalogTitle").textContent =
    page === "movies" ? "Movies & TV Shows" : "Trending Now";

  $("catalogSubtitle").textContent =
    page === "movies"
      ? "Explore the wider movie and TV catalog"
      : "Popular entertainment to discover";

  document.querySelectorAll(".filter").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.category === "all"
    );
  });

  if (page === "mylist") {
    renderMyList();
    return;
  }

  if (page === "movies") {
    $("catalogSection").scrollIntoView({ behavior: "smooth" });
  }

  loadHomeTitles();
}

/* ---------------- TMDB API ---------------- */

function hasToken() {
  return (
    TMDB_TOKEN.length > 20 &&
    !TMDB_TOKEN.includes("PASTE_YOUR")
  );
}

async function tmdb(path, params = {}) {
  if (!hasToken()) {
    throw new Error("TMDB_TOKEN_MISSING");
  }

  const url = new URL(TMDB_BASE + path);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TMDB_TOKEN}`,
      accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status})`);
  }

  return response.json();
}

function normalizeTitle(item, mediaType) {
  const isTV = mediaType === "tv";

  return {
    id: `${mediaType}-${item.id}`,
    tmdbId: item.id,
    mediaType,
    title: isTV ? item.name : item.title,
    year: (
      isTV ? item.first_air_date : item.release_date
    )?.slice(0, 4) || "N/A",
    genre: isTV ? "TV Series" : "Movie",
    rating: Number(item.vote_average || 0).toFixed(1),
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
    description: item.overview || "No description available.",
    trailer: ""
  };
}

function posterURL(movie) {
  if (movie.posterPath) {
    return `${TMDB_IMAGE}${movie.posterPath}`;
  }

  if (movie.image) {
    return `https://images.unsplash.com/${movie.image}?auto=format&fit=crop&w=500&q=80`;
  }

  return PLACEHOLDER_IMAGE;
}

function backdropURL(movie) {
  if (movie.backdropPath) {
    return `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`;
  }

  return posterURL(movie);
}

/* ---------------- HOME / SEARCH ---------------- */

async function loadHomeTitles() {
  const thisRequest = ++requestNumber;
  searchMode = false;
  currentQuery = "";
  currentPage = 1;

  if (!hasToken()) {
    apiAvailable = false;
    apiStatus = "Add a TMDB API Read Access Token in script.js to enable online search.";
    renderTitles(starterMovies);
    setSearchStatus(apiStatus);
    $("loadMore").hidden = true;
    return;
  }

  setSearchStatus("Loading popular movies and shows...");
  $("movieGrid").replaceChildren();
  $("emptyMessage").hidden = true;

  try {
    const [movieData, tvData] = await Promise.all([
      tmdb("/trending/movie/week", { language: "en-US", page: 1 }),
      tmdb("/trending/tv/week", { language: "en-US", page: 1 })
    ]);

    if (thisRequest !== requestNumber) return;

    const movies = (movieData.results || [])
      .filter(item => item.poster_path)
      .map(item => normalizeTitle(item, "movie"));

    const shows = (tvData.results || [])
      .filter(item => item.poster_path)
      .map(item => normalizeTitle(item, "tv"));

    const combined = [];

    for (let i = 0; i < Math.max(movies.length, shows.length); i++) {
      if (movies[i]) combined.push(movies[i]);
      if (shows[i]) combined.push(shows[i]);
    }

    apiAvailable = true;
    apiStatus = "";
    renderTitles(combined);
    setSearchStatus("Trending movies and TV shows");
    $("loadMore").hidden = true;
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    apiAvailable = false;
    apiStatus = error.message === "TMDB_TOKEN_MISSING"
      ? "Add your TMDB token in script.js to enable online search."
      : "Could not connect to TMDB. Check your token and internet connection.";

    renderTitles(starterMovies);
    setSearchStatus(apiStatus);
    $("loadMore").hidden = true;
  }
}

async function searchTitles(query, page = 1, append = false) {
  const thisRequest = ++requestNumber;
  searchMode = true;
  currentQuery = query;
  currentPage = page;

  if (!hasToken()) {
    setSearchStatus("Add your TMDB API token in script.js to search online.");
    $("emptyMessage").hidden = true;
    $("loadMore").hidden = true;

    const local = starterMovies.filter(movie =>
      movie.title.toLowerCase().includes(query.toLowerCase()) ||
      movie.genre.toLowerCase().includes(query.toLowerCase()) ||
      movie.year.includes(query)
    );

    renderTitles(local);
    return;
  }

  setSearchStatus(`Searching for "${query}"...`);

  if (!append) {
    $("movieGrid").replaceChildren();
    $("emptyMessage").hidden = true;
  }

  $("loadMore").disabled = true;
  $("loadMore").textContent = "Loading...";

  try {
    const data = await tmdb("/search/multi", {
      query,
      include_adult: false,
      language: "en-US",
      page
    });

    if (thisRequest !== requestNumber) return;

    const results = (data.results || [])
      .filter(item =>
        (item.media_type === "movie" || item.media_type === "tv") &&
        item.poster_path
      )
      .map(item => normalizeTitle(item, item.media_type));

    totalPages = Math.min(data.total_pages || 1, 500);

    if (append) {
      appendTitles(results);
    } else {
      renderTitles(results);
    }

    applyCategoryFilter();

    setSearchStatus(
      `${data.total_results || 0} matching results in the database.`
    );

    $("emptyMessage").hidden =
      $("movieGrid").children.length > 0;

    if ($("movieGrid").children.length === 0) {
      $("emptyMessage").hidden = false;
    }

    $("loadMore").hidden = page >= totalPages;
  } catch (error) {
    if (thisRequest !== requestNumber) return;

    setSearchStatus(
      "Search failed. Check your TMDB token, connection, and API permissions."
    );

    if (!append) {
      $("movieGrid").replaceChildren();
      $("emptyMessage").hidden = false;
      $("emptyMessage").textContent =
        "Unable to search online. Verify your API configuration.";
    }

    $("loadMore").hidden = true;
    console.error(error);
  } finally {
    if (thisRequest === requestNumber) {
      $("loadMore").disabled = false;
      $("loadMore").textContent = "Load More";
    }
  }
}

function scheduleSearch() {
  clearTimeout(searchTimer);

  const query = $("searchInput").value.trim();

  if (!query) {
    requestNumber++;
    currentQuery = "";
    searchMode = false;
    loadHomeTitles();
    return;
  }

  searchTimer = setTimeout(() => {
    searchTitles(query, 1, false);
  }, 400);
}

$("searchInput").addEventListener("input", scheduleSearch);

$("searchForm").addEventListener("submit", event => {
  event.preventDefault();
  clearTimeout(searchTimer);

  const query = $("searchInput").value.trim();

  if (query) {
    searchTitles(query, 1, false);
  } else {
    loadHomeTitles();
  }
});

$("loadMore").addEventListener("click", () => {
  if (currentQuery && currentPage < totalPages) {
    searchTitles(currentQuery, currentPage + 1, true);
  }
});

/* ---------------- RENDER MOVIES ---------------- */

function renderTitles(titles) {
  const filtered = filterTitles(titles);

  $("movieGrid").replaceChildren(
    ...filtered.map(createCard)
  );

  $("emptyMessage").hidden = filtered.length > 0;
}

function appendTitles(titles) {
  const existingIds = new Set(
    [...$("movieGrid").querySelectorAll("[data-title-id]")]
      .map(card => card.dataset.titleId)
  );

  const newCards = titles
    .filter(movie => !existingIds.has(String(movie.id)))
    .map(createCard);

  $("movieGrid").append(...newCards);
}

function filterTitles(titles) {
  if (activeCategory === "all") return titles;

  return titles.filter(movie =>
    movie.mediaType === activeCategory
  );
}

function applyCategoryFilter() {
  const cards = [...$("movieGrid").children];

  cards.forEach(card => {
    const type = card.dataset.mediaType;
    card.hidden =
      activeCategory !== "all" &&
      type !== activeCategory;
  });

  const visible = cards.some(card => !card.hidden);
  $("emptyMessage").hidden = visible;

  if (!visible) {
    $("emptyMessage").textContent =
      "No titles found in this category.";
  }
}

function createCard(movie) {
  const card = document.createElement("article");
  card.className = "movie-card";
  card.dataset.titleId = String(movie.id);
  card.dataset.mediaType = movie.mediaType || "movie";

  const poster = document.createElement("div");
  poster.className = "poster";
  poster.tabIndex = 0;
  poster.setAttribute("role", "button");
  poster.setAttribute("aria-label", `View ${movie.title}`);

  const img = document.createElement("img");
  img.src = posterURL(movie);
  img.alt = `${movie.title} poster`;
  img.loading = "lazy";
  img.onerror = () => {
    img.onerror = null;
    img.src = PLACEHOLDER_IMAGE;
  };

  poster.append(img);

  poster.addEventListener("click", () => openMovie(movie));
  poster.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openMovie(movie);
    }
  });

  const info = document.createElement("div");
  info.className = "movie-info";

  const title = document.createElement("h3");
  title.textContent = movie.title;

  const meta = document.createElement("div");
  meta.className = "movie-meta";

  const year = document.createElement("span");
  year.textContent = `${movie.year} · ${movie.genre}`;

  const rating = document.createElement("span");
  rating.className = "rating";
  rating.textContent = `★ ${movie.rating}`;

  meta.append(year, rating);

  const actions = document.createElement("div");
  actions.className = "card-actions";

  const detailsButton = document.createElement("button");
  detailsButton.textContent = "▶ Details";
  detailsButton.addEventListener("click", () => openMovie(movie));

  const saveButton = document.createElement("button");
  saveButton.textContent = myList.some(
    item => String(item.id) === String(movie.id)
  ) ? "✓ Saved" : "+ My List";

  saveButton.addEventListener("click", () => toggleSave(movie));

  actions.append(detailsButton, saveButton);
  info.append(title, meta, actions);
  card.append(poster, info);

  return card;
}

/* ---------------- CATEGORY FILTERS ---------------- */

$("filters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;

  activeCategory = button.dataset.category;

  document.querySelectorAll(".filter").forEach(filter => {
    filter.classList.toggle("active", filter === button);
  });

  applyCategoryFilter();
});

/* ---------------- MY LIST ---------------- */

function saveMyList() {
  return saveJSON(KEYS.list + currentEmail, myList);
}

function toggleSave(movie) {
  if (!currentEmail) return;

  const index = myList.findIndex(
    item => String(item.id) === String(movie.id)
  );

  if (index >= 0) {
    myList.splice(index, 1);
  } else {
    myList.push({
      id: movie.id,
      tmdbId: movie.tmdbId || null,
      title: movie.title,
      year: movie.year,
      genre: movie.genre,
      rating: movie.rating,
      posterPath: movie.posterPath || null,
      image: movie.image || null,
      description: movie.description,
      mediaType: movie.mediaType,
      trailer: movie.trailer || ""
    });
  }

  if (!saveMyList()) {
    alert("Unable to save My List in this browser.");
  }

  renderMyList();

  // Update visible card buttons without reloading the entire grid.
  document.querySelectorAll("[data-title-id]").forEach(card => {
    if (card.dataset.titleId !== String(movie.id)) return;

    const button = card.querySelector(".card-actions button:last-child");
    if (button) {
      button.textContent = myList.some(
        item => String(item.id) === String(movie.id)
      ) ? "✓ Saved" : "+ My List";
    }
  });

  if (currentMovie &&
      String(currentMovie.id) === String(movie.id)) {
    $("modalSave").textContent = myList.some(
      item => String(item.id) === String(movie.id)
    ) ? "✓ Saved" : "+ My List";
  }
}

function renderMyList() {
  const saved = myList.map(item => ({
    ...item,
    posterPath: item.posterPath || null
  }));

  $("myListGrid").replaceChildren(...saved.map(createCard));
  $("listEmpty").hidden = saved.length > 0;
}

/* ---------------- DETAILS MODAL ---------------- */

function openMovie(movie) {
  currentMovie = movie;
  lastFocusedElement = document.activeElement;

  $("modalTitle").textContent = movie.title;
  $("modalMeta").textContent =
    `${movie.year} · ${movie.genre} · ★ ${movie.rating}`;

  $("modalDescription").textContent =
    movie.description || "No description available.";

  $("modalPoster").style.backgroundImage =
    `linear-gradient(0deg, #181818, transparent), url("${backdropURL(movie)}")`;

  $("modalSave").textContent = myList.some(
    item => String(item.id) === String(movie.id)
  ) ? "✓ Saved" : "+ My List";

  $("trailerLink").textContent =
    movie.mediaType === "movie" || movie.mediaType === "tv"
      ? "View on TMDB ↗"
      : "Find Trailer ↗";

  $("trailerLink").href = movie.tmdbId
    ? `https://www.themoviedb.org/${movie.mediaType}/${movie.tmdbId}`
    : movie.trailer ||
      `https://www.youtube.com/results?search_query=${encodeURIComponent(movie.title + " official trailer")}`;

  $("movieModal").hidden = false;
  document.body.style.overflow = "hidden";
  $("closeModal").focus();
}

function closeModal() {
  $("movieModal").hidden = true;
  document.body.style.overflow = "";
  currentMovie = null;

  if (lastFocusedElement?.focus) {
    lastFocusedElement.focus();
  }
}

$("closeModal").addEventListener("click", closeModal);

$("movieModal").addEventListener("click", event => {
  if (event.target === $("movieModal")) closeModal();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !$("movieModal").hidden) {
    closeModal();
  }
});

$("modalSave").addEventListener("click", () => {
  if (currentMovie) toggleSave(currentMovie);
});

/* ---------------- HERO ---------------- */

$("heroPlay").addEventListener("click", () => {
  const first = starterMovies[0];
  openMovie(first);
});

$("heroInfo").addEventListener("click", () => {
  if (!hasToken()) {
    openMovie(starterMovies[0]);
    return;
  }

  // Look up the featured series in TMDB.
  searchTitles("Stranger Things", 1, false);
  $("catalogSection").scrollIntoView({ behavior: "smooth" });
});

/* ---------------- INITIALIZATION ---------------- */

async function initialize() {
  let savedEmail = null;

  try {
    savedEmail = sessionStorage.getItem(KEYS.session);
  } catch {}

  if (savedEmail && getUsers()[savedEmail]) {
    currentEmail = savedEmail;
    showApp();
  } else {
    showAuth("register");
  }
}

initialize();
