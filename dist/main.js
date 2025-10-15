"use strict";
// -----------------------------
// main.ts
// -----------------------------
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const MAPBOX_TOKEN = 'pk.eyJ1IjoiaWxra2FtdGsiLCJhIjoiY20xZzNvMmJ5MXI4YzJrcXpjMWkzYnZlYSJ9.niDiGDLgFfvA2DMqxbB1QQ';
const API_BASE = 'https://media1.edu.metropolia.fi/restaurant/api/v1';
// -----------------------------
// Globals
// -----------------------------
let token = localStorage.getItem('token');
let currentUser = null;
let map;
let markers = [];
// -----------------------------
// DOM Elements
// -----------------------------
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfoEl = document.getElementById('user-info');
const restaurantListEl = document.getElementById('restaurant-list');
const mapEl = document.getElementById('map');
const menuTypeEl = document.getElementById('menu-type');
const filterCityEl = document.getElementById('filter-city');
const filterCompanyEl = document.getElementById('filter-company');
// -----------------------------
// Helper function for API calls
// -----------------------------
const fetchAPI = (url_1, ...args_1) => __awaiter(void 0, [url_1, ...args_1], void 0, function* (url, options = {}) {
    if (token) {
        options.headers = Object.assign(Object.assign({}, options.headers), { Authorization: `Bearer ${token}` });
    }
    const res = yield fetch(url, options);
    if (!res.ok)
        throw new Error(yield res.text());
    return res.json();
});
loginBtn === null || loginBtn === void 0 ? void 0 : loginBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    try {
        const data = yield fetchAPI(`${API_BASE}/auth/login`, {
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
        yield loadCurrentUser();
        renderUI();
        yield loadRestaurants();
    }
    catch (err) {
        alert('Login failed');
        console.error(err);
    }
}));
registerBtn === null || registerBtn === void 0 ? void 0 : registerBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const email = prompt('Enter your email') || '';
    try {
        yield fetchAPI(`${API_BASE}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, email }),
        });
        alert('User created! Please log in.');
    }
    catch (err) {
        console.error(err);
        alert('Registration failed');
    }
}));
logoutBtn === null || logoutBtn === void 0 ? void 0 : logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('token');
    currentUser = null;
    renderUI();
});
// -----------------------------
// Load current user
// -----------------------------
function loadCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!token)
            return;
        try {
            currentUser = yield fetchAPI(`${API_BASE}/users/token`);
        }
        catch (err) {
            console.error('Failed to load current user:', err);
        }
    });
}
// -----------------------------
// Render UI
// -----------------------------
function renderUI() {
    const authEl = document.getElementById('auth');
    const profileEl = document.getElementById('profile');
    if (currentUser) {
        authEl.style.display = 'none';
        profileEl.style.display = 'block';
        userInfoEl.innerText = `Logged in as ${currentUser.username}`;
    }
    else {
        authEl.style.display = 'block';
        profileEl.style.display = 'none';
        userInfoEl.innerText = '';
    }
}
// -----------------------------
// Load Restaurants and Map
// -----------------------------
function loadRestaurants() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const data = yield fetchAPI(`${API_BASE}/restaurants`);
            let restaurants = data.restaurants;
            // Apply filters
            const cityFilter = filterCityEl.value.toLowerCase();
            const companyFilter = filterCompanyEl.value;
            restaurants = restaurants.filter((r) => {
                var _a;
                return (!cityFilter || ((_a = r.city) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(cityFilter))) &&
                    (!companyFilter || r.company === companyFilter);
            });
            // Render restaurant list
            restaurantListEl.innerHTML = restaurants
                .map((r) => `
      <div class="restaurant-item" data-id="${r._id}">
        <strong>${r.name}</strong><br>
        ${r.address || ''}, ${r.city || ''} 
        ${(currentUser === null || currentUser === void 0 ? void 0 : currentUser.favouriteRestaurant) === r._id ? '⭐' : ''}
      </div>
    `)
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
                var _a;
                if ((_a = r.location) === null || _a === void 0 ? void 0 : _a.coordinates) {
                    const [lon, lat] = r.location.coordinates;
                    const marker = new mapboxgl.Marker()
                        .setLngLat([lon, lat])
                        .setPopup(new mapboxgl.Popup().setText(r.name))
                        .addTo(map);
                    markers.push(marker);
                }
            });
        }
        catch (err) {
            console.error('Error loading restaurants', err);
            restaurantListEl.innerHTML = '<p>Error loading restaurants 😢</p>';
        }
    });
}
// -----------------------------
// Load Menu
// -----------------------------
function loadMenu(restaurantId) {
    return __awaiter(this, void 0, void 0, function* () {
        const type = menuTypeEl.value;
        const lang = 'fi';
        try {
            if (type === 'day') {
                const daily = yield fetchAPI(`${API_BASE}/restaurants/daily/${restaurantId}/${lang}`);
                alert(JSON.stringify(daily.courses, null, 2));
            }
            else {
                const weekly = yield fetchAPI(`${API_BASE}/restaurants/weekly/${restaurantId}/${lang}`);
                alert(JSON.stringify(weekly.days, null, 2));
            }
        }
        catch (err) {
            console.error('Failed to load menu', err);
            alert('No menu available');
        }
    });
}
// -----------------------------
// Event listener for restaurant click
// -----------------------------
restaurantListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.restaurant-item');
    if (!item)
        return;
    const id = item.getAttribute('data-id');
    if (id)
        loadMenu(id);
});
// -----------------------------
// Event listeners for filters
// -----------------------------
filterCityEl === null || filterCityEl === void 0 ? void 0 : filterCityEl.addEventListener('input', loadRestaurants);
filterCompanyEl === null || filterCompanyEl === void 0 ? void 0 : filterCompanyEl.addEventListener('change', loadRestaurants);
// -----------------------------
// Init
// -----------------------------
(() => __awaiter(void 0, void 0, void 0, function* () {
    yield loadCurrentUser();
    renderUI();
    yield loadRestaurants();
}))();
//# sourceMappingURL=main.js.map