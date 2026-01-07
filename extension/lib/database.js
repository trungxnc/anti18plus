// IndexedDB Wrapper for Web Shield 18+
const DB_NAME = 'WebShieldDB';
const DB_VERSION = 1;
const STORE_NAME = 'domains';

export const dbRequest = indexedDB.open(DB_NAME, DB_VERSION);

dbRequest.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'domainName' });
        store.createIndex('addedAt', 'addedAt', { unique: false });
    }
};

export function saveDomains(domains) {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            domains.forEach(domain => {
                store.put(domain);
            });

            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };
    });
}

export function getAllDomains() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onsuccess = (e) => {
            const db = e.target.result;
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        };
    });
}

export function getLastSyncTime() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['lastSyncTime'], (result) => {
            resolve(result.lastSyncTime || null);
        });
    });
}

export function setLastSyncTime(isoString) {
    chrome.storage.local.set({ lastSyncTime: isoString });
}
