import { saveDomains, getAllDomains, getLastSyncTime, setLastSyncTime } from './lib/database.js';

const API_URL = 'http://localhost:8080/api/v1/domains/sync';
const ALARM_NAME = 'sync_domains';

// Setup Alarm on Install
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        console.log("Web Shield 18+ installed!");
        chrome.storage.local.set({
            isShieldActive: true,
            filterLevel: 'strict'
        });

        // Initial Sync
        performSync();

        // Schedule periodic sync (every 60 minutes)
        chrome.alarms.create(ALARM_NAME, { periodInMinutes: 60 });
    }
});

// Check Storage Quota
function checkStorageQuota() {
    chrome.storage.local.getBytesInUse(null, (bytesInUse) => {
        // Default quota is 5,242,880 bytes (5MB)
        const QUOTA_LIMIT = chrome.storage.local.QUOTA_BYTES || 5242880;
        const USAGE_THRESHOLD = QUOTA_LIMIT * 0.9; // 90%

        console.log(`Storage Usage: ${bytesInUse} / ${QUOTA_LIMIT} bytes`);

        if (bytesInUse > USAGE_THRESHOLD) {
            console.warn("Storage quota exceeded! Resetting storage...");
            chrome.storage.local.clear(() => {
                // Re-initialize default values
                chrome.storage.local.set({
                    isShieldActive: true,
                    filterLevel: 'strict',
                    statsBlocked: 0,
                    statsScanned: 0
                });
                console.log("Storage has been reset to defaults.");
            });
        }
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) {
        performSync();
        checkStorageQuota(); // Check quota periodically
    }
});

// Listener for storage changes (Toggle Shield)
chrome.storage.onChanged.addListener(async (changes, namespace) => {
    if (namespace === 'local' && changes.isShieldActive) {
        const isActive = changes.isShieldActive.newValue;
        console.log(`Shield status changed: ${isActive ? 'Active' : 'Inactive'}`);

        if (isActive) {
            // Active: Re-apply rules
            // 1. Enable Static Rules
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                enableRulesetIds: ['ruleset_1']
            });

            // 2. Restore Dynamic Rules (from DB)
            const allDomains = await getAllDomains();
            await updateDynamicRules(allDomains);

        } else {
            // Inactive: Remove rules
            // 1. Disable Static Rules
            await chrome.declarativeNetRequest.updateEnabledRulesets({
                disableRulesetIds: ['ruleset_1']
            });

            // 2. Clear Dynamic Rules
            const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
            const ruleIds = currentRules.map(r => r.id);
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: ruleIds
            });
            console.log("Shield deactivated: All blocking rules disabled.");
        }
    }
});

async function performSync() {
    console.log("Starting domain sync...");
    try {
        const lastSync = await getLastSyncTime();
        let url = API_URL;
        if (lastSync) {
            url += `?lastSync=${encodeURIComponent(lastSync)}`;
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');

        const newDomains = await response.json();

        if (newDomains.length > 0) {
            console.log(`Fetched ${newDomains.length} new domains.`);

            // 1. Save to IndexedDB
            await saveDomains(newDomains);

            // 2. Update Rules (Only if Shield is Active)
            const { isShieldActive } = await chrome.storage.local.get('isShieldActive');

            if (isShieldActive !== false) { // Default to true
                await updateDynamicRules(newDomains);
                console.log("Rules applied immediately.");
            } else {
                console.log("Shield is inactive. Rules saved but not applied.");
            }

            // 3. Update Sync Time
            const now = new Date().toISOString();
            setLastSyncTime(now);
        } else {
            console.log("No new updates found.");
        }

    } catch (error) {
        console.error("Sync failed:", error);
    }
}

async function updateDynamicRules(domains) {
    // Transform domains to DNR Rules
    // NOTE: Chrome limits dynamic rules (approx 5000-30000 depending on version).
    // We strictly limit to the latest 5000 for stability in this demo.
    const limitedDomains = domains.slice(0, 5000);

    // Get existing rules to append correctly or we just clear and rewrite?
    // For sync, we might be appending.
    // BUT for toggle (restore), we might be overwriting.
    // Safe approach for 'update': Append if IDs don't conflict.

    // Simple Strategy for this project: 
    // Always use IDs based on some hash or simple increment.

    const currentRules = await chrome.declarativeNetRequest.getDynamicRules();
    let nextId = 10000;
    if (currentRules.length > 0) {
        nextId = Math.max(...currentRules.map(r => r.id)) + 1;
    }

    const newRules = limitedDomains.map((d, index) => ({
        id: nextId + index,
        priority: 1,
        action: {
            type: "redirect",
            redirect: { extensionPath: "/pages/blocked.html" }
        },
        condition: {
            urlFilter: d.domainName,
            resourceTypes: ["main_frame"]
        }
    }));

    if (newRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
            addRules: newRules
        });
        console.log(`Applied ${newRules.length} dynamic rules.`);
    }
}

// Listener for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getStatus") {
        chrome.storage.local.get(['isShieldActive'], (result) => {
            sendResponse({ isActive: result.isShieldActive });
        });
        return true;
    }
    if (request.action === "forceSync") {
        performSync().then(() => sendResponse({ status: 'done' }));
        return true;
    }

    // Stats Handling
    if (request.action === "INCREMENT_STATS") {
        const type = request.type; // 'scanned' or 'blocked'
        if (type === 'scanned') {
            chrome.storage.local.get(['statsScanned'], (res) => {
                const current = res.statsScanned || 0;
                chrome.storage.local.set({ statsScanned: current + 1 });
            });
        }
        if (type === 'blocked') {
            chrome.storage.local.get(['statsBlocked'], (res) => {
                const current = res.statsBlocked || 0;
                chrome.storage.local.set({ statsBlocked: current + 1 });
            });
        }
    }
});
