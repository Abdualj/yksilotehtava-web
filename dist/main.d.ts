declare const mapboxgl: any;
declare const MAPBOX_TOKEN = "pk.eyJ1IjoiaWxra2FtdGsiLCJhIjoiY20xZzNvMmJ5MXI4YzJrcXpjMWkzYnZlYSJ9.niDiGDLgFfvA2DMqxbB1QQ";
declare const API_BASE = "https://media1.edu.metropolia.fi/restaurant/api/v1";
interface Restaurant {
    _id: string;
    name: string;
    address?: string;
    city?: string;
    company: string;
    location?: {
        type: string;
        coordinates: [number, number];
    };
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
declare let token: string | null;
declare let currentUser: User | null;
declare let map: any;
declare let markers: any[];
declare const loginBtn: HTMLButtonElement;
declare const registerBtn: HTMLButtonElement;
declare const logoutBtn: HTMLButtonElement;
declare const userInfoEl: HTMLElement;
declare const restaurantListEl: HTMLElement;
declare const mapEl: HTMLElement;
declare const menuTypeEl: HTMLSelectElement;
declare const filterCityEl: HTMLInputElement;
declare const filterCompanyEl: HTMLSelectElement;
declare const fetchAPI: (url: string, options?: RequestInit) => Promise<any>;
interface LoginResponse {
    token: string;
    data?: User;
    message?: string;
}
declare function loadCurrentUser(): Promise<void>;
declare function renderUI(): void;
declare function loadRestaurants(): Promise<void>;
declare function loadMenu(restaurantId: string): Promise<void>;
//# sourceMappingURL=main.d.ts.map