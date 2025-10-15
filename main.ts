// -----------------------------
// main.ts
// -----------------------------

declare const mapboxgl: any;

const MAPBOX_TOKEN = 'pk.eyJ1IjoiaWxra2FtdGsiLCJhIjoiY20xZzNvMmJ5MXI4YzJrcXpjMWkzYnZlYSJ9.niDiGDLgFfvA2DMqxbB1QQ';
const API_BASE = 'https://media1.edu.metropolia.fi/restaurant/api/v1';

// -----------------------------
// Interfaces
// -----------------------------
interface Restaurant {
  _id: string;
  name: string;
  address?: string;
  city?: string;
  company: string;
  location?: { type: string; coordinates: [number, number] };
}

interface Course {
  name: string;
  price?: string;
  diets?: string;
}

interface DailyMenu {
  courses: Course[];
}

interface WeeklyMenuDay {
  date: string;
  courses: Course[];
}

interface WeeklyMenu {
  days: WeeklyMenuDay[];
}

interface User {
  _id: string;
  username: string;
  email: string;
  favouriteRestaurant?: string;
  avatar?: string;
}

// -----------------------------
// Globals
// -----------------------------
let token: string | null = localStorage.getItem('token');
let currentUser: User | null = null;

let map: any;
let markers: any[] = [];

// -----------------------------
// DOM Elements
// -----------------------------
const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
const registerBtn = document.getElementById('register-btn') as HTMLButtonElement;
const logoutBtn = document.getElementById('logout-btn') as HTMLButtonElement;
const userInfoEl = document.getElementById('user-info') as HTMLElement;

const restaurantListEl = document.getElementById('restaurant-list') as HTMLElement;
const mapEl = document.getElementById('map') as HTMLElement;

const menuTypeEl = document.getElementById('menu-type') as HTMLSelectElement;
const filterCityEl = document.getElementById('filter-city') as HTMLInputElement;
const filterCompanyEl = document.getElementById('filter-company') as HTMLSelectElement;

// -----------------------------
// Helper function for API calls
// -----------------------------
const fetchAPI = async (url: string, options: RequestInit = {}) => {
  if (token) {
    options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// -----------------------------
// Authentication
// -----------------------------
interface LoginResponse {
  token: string;
  data?: User;
  message?: string;
}

loginBtn?.addEventListener('click', async () => {
  const username = (document.getElementById('username') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;

  try {
    const data: LoginResponse = await fetchAPI(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!data.token) {
      alert('Login failed: no token received');
      return;
    }

    token = data.token;
    localStorage.setItem('token', token);

    await loadCurrentUser();
    renderUI();
    await loadRestaurants();

  } catch (err) {
    alert('Login failed');
    console.error(err);
  }
});

registerBtn?.addEventListener('click', async () => {
  const username = (document.getElementById('username') as HTMLInputElement).value;
  const password = (document.getElementById('password') as HTMLInputElement).value;
  const email = prompt('Enter your email') || '';

  try {
    await fetchAPI(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
    });
    alert('User created! Please log in.');

  } catch (err) {
    console.error(err);
    alert('Registration failed');
  }
});

logoutBtn?.addEventListener('click', () => {
  token = null;
  localStorage.removeItem('token');
  currentUser = null;
  renderUI();
});

// -----------------------------
// Load current user
// -----------------------------
async function loadCurrentUser() {
  if (!token) return;
  try {
    currentUser = await fetchAPI(`${API_BASE}/users/token`);
  } catch (err) {
    console.error('Failed to load current user:', err);
  }
}

// -----------------------------
// Render UI
// -----------------------------
function renderUI() {
  const authEl = document.getElementById('auth') as HTMLElement;
  const profileEl = document.getElementById('profile') as HTMLElement;

  if (currentUser) {
    authEl.style.display = 'none';
    profileEl.style.display = 'block';
    userInfoEl.innerText = `Logged in as ${currentUser.username}`;
  } else {
    authEl.style.display = 'block';
    profileEl.style.display = 'none';
    userInfoEl.innerText = '';
  }
}

// -----------------------------
// Load Restaurants and Map
// -----------------------------
async function loadRestaurants() {
  try {
    const data = await fetchAPI(`${API_BASE}/restaurants`);
    let restaurants: Restaurant[] = data.restaurants;

    // Apply filters
    const cityFilter = filterCityEl.value.toLowerCase();
    const companyFilter = filterCompanyEl.value;
    restaurants = restaurants.filter(
      (r) =>
        (!cityFilter || r.city?.toLowerCase().includes(cityFilter)) &&
        (!companyFilter || r.company === companyFilter)
    );

    // Render restaurant list
    restaurantListEl.innerHTML = restaurants
      .map(
        (r) => `
      <div class="restaurant-item" data-id="${r._id}">
        <strong>${r.name}</strong><br>
        ${r.address || ''}, ${r.city || ''} 
        ${currentUser?.favouriteRestaurant === r._id ? '⭐' : ''}
      </div>
    `
      )
      .join('');

    // Initialize map if needed
    if (!map) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.Map({
        container: mapEl,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [24.94, 60.17], // Helsinki
        zoom: 12,
      });
    }

    // Remove old markers
    markers.forEach((m) => m.remove());
    markers = [];

    // Add new markers
    restaurants.forEach((r) => {
      if (r.location?.coordinates) {
        const [lon, lat] = r.location.coordinates;
        const marker = new mapboxgl.Marker()
          .setLngLat([lon, lat])
          .setPopup(new mapboxgl.Popup().setText(r.name))
          .addTo(map);
        markers.push(marker);
      }
    });
  } catch (err) {
    console.error('Error loading restaurants', err);
    restaurantListEl.innerHTML = '<p>Error loading restaurants 😢</p>';
  }
}

// -----------------------------
// Load Menu
// -----------------------------
async function loadMenu(restaurantId: string) {
  const type = menuTypeEl.value;
  const lang = 'fi';
  try {
    if (type === 'day') {
      const daily: DailyMenu = await fetchAPI(`${API_BASE}/restaurants/daily/${restaurantId}/${lang}`);
      alert(JSON.stringify(daily.courses, null, 2));
    } else {
      const weekly: WeeklyMenu = await fetchAPI(`${API_BASE}/restaurants/weekly/${restaurantId}/${lang}`);
      alert(JSON.stringify(weekly.days, null, 2));
    }
  } catch (err) {
    console.error('Failed to load menu', err);
    alert('No menu available');
  }
}

// -----------------------------
// Event listener for restaurant click
// -----------------------------
restaurantListEl.addEventListener('click', (e) => {
  const item = (e.target as HTMLElement).closest('.restaurant-item');
  if (!item) return;
  const id = item.getAttribute('data-id');
  if (id) loadMenu(id);
});

// -----------------------------
// Event listeners for filters
// -----------------------------
filterCityEl?.addEventListener('input', loadRestaurants);
filterCompanyEl?.addEventListener('change', loadRestaurants);

// -----------------------------
// Init
// -----------------------------
(async () => {
  await loadCurrentUser();
  renderUI();
  await loadRestaurants();
})();
