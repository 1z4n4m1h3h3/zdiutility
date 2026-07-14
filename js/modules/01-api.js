// ============================================================
// DATABASE SYSTEM (Firebase Firestore)
// ============================================================

const isFile = window.location.protocol === 'file:';
const defaultHost = "10.62.38.204"; // Fallback IP
const host = window.location.hostname || defaultHost;

// Jika user testing di Live Server (port 5500) atau GitHub Pages, arahkan ke backend lokal
const isGithub = window.location.hostname.includes('github.io');
const currentHost = window.location.hostname;

let API_URL = "";

if (isGithub) {
    API_URL = "http://localhost:3000";
} else if (isFile) {
    API_URL = `http://${defaultHost}:3000`;
} else if (window.location.port !== '3000' && window.location.port !== '') {
    API_URL = `http://${currentHost}:3000`;
} else {
    API_URL = window.location.origin;
}

function initDB() {
    return Promise.resolve(); // json-server endpoint sudah diatur di API_URL
}

function getAuthHeaders() {
    const token = sessionStorage.getItem('arf_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function getAllFromStore(storeName) {
    try {
        const res = await fetch(`${API_URL}/${storeName}?_t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...getAuthHeaders()
            }
        });
        if (!res.ok) return [];
        return await res.json();
    } catch (e) {
        console.error(`Gagal mengambil data dari ${storeName}:`, e);
        return [];
    }
}

async function saveToStore(storeName, item) {
    try {
        let queryKey = '';
        let queryValue = '';
        if (storeName === 'users') { queryKey = 'username'; queryValue = item.username; }
        else if (storeName === 'inventory') { queryKey = 'id'; queryValue = item.id; }
        else if (storeName === 'activity_log') { queryKey = 'id'; queryValue = item.id; }
        else if (storeName === 'auth_codes') { queryKey = 'code'; queryValue = item.code; }
        else if (storeName === 'services') { queryKey = 'id'; queryValue = item.id; }
        else if (storeName === 'borrowings') { queryKey = 'id'; queryValue = item.id; }

        const searchRes = await fetch(`${API_URL}/${storeName}?${queryKey}=${queryValue}&_t=${Date.now()}`, { cache: 'no-store', headers: getAuthHeaders() });
        const searchData = await searchRes.json();

        if (searchData.length > 0) {
            // Update
            const realId = searchData[0].id;
            await fetch(`${API_URL}/${storeName}/${realId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(item)
            });
        } else {
            // Create
            await fetch(`${API_URL}/${storeName}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(item)
            });
        }
    } catch (e) {
        console.error(`Gagal menyimpan data ke ${storeName}:`, e);
    }
}

async function deleteFromStore(storeName, key) {
    try {
        let queryKey = '';
        if (storeName === 'users') queryKey = 'username';
        else if (storeName === 'inventory') queryKey = 'id';
        else if (storeName === 'activity_log') queryKey = 'id';
        else if (storeName === 'auth_codes') queryKey = 'code';
        else if (storeName === 'services') queryKey = 'id';
        else if (storeName === 'borrowings') queryKey = 'id';

        const searchRes = await fetch(`${API_URL}/${storeName}?${queryKey}=${key}&_t=${Date.now()}`, { cache: 'no-store', headers: getAuthHeaders() });
        const searchData = await searchRes.json();

        if (searchData.length > 0) {
            const realId = searchData[0].id;
            await fetch(`${API_URL}/${storeName}/${realId}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
        }
    } catch (e) {
        console.error(`Gagal menghapus data dari ${storeName}:`, e);
    }
}

async function deleteBulkFromStore(storeName, ids) {
    try {
        await fetch(`${API_URL}/api/bulk_delete/${storeName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
            body: JSON.stringify({ ids })
        });
    } catch (e) {
        console.error(`Gagal menghapus data massal dari ${storeName}:`, e);
    }
}

// In-memory application state
let inventory = [];
let activityLog = [];
let userList = [];
let authCodes = [];
let maintenanceList = [];
let borrowingsList = [];
let stockChartInstance = null;
let isSyncing = false;
