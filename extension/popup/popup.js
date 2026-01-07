document.addEventListener('DOMContentLoaded', () => {
    // Open Settings
    document.getElementById('settingsLink').addEventListener('click', (e) => {
        e.preventDefault();
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options/options.html'));
        }
    });

    const toggleShield = document.getElementById('toggleShield');
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');

    // Load initial state
    chrome.storage.local.get(['isShieldActive', 'statsBlocked', 'statsScanned'], (result) => {
        const isActive = result.isShieldActive ?? true; // Default to true
        updateUI(isActive);

        // Update Stats
        document.getElementById('blockedCount').textContent = result.statsBlocked || 0;
        document.getElementById('scannedCount').textContent = result.statsScanned || 0;
    });

    // Listen for real-time stat updates
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (namespace === 'local') {
            if (changes.statsBlocked) {
                document.getElementById('blockedCount').textContent = changes.statsBlocked.newValue;
            }
            if (changes.statsScanned) {
                document.getElementById('scannedCount').textContent = changes.statsScanned.newValue;
            }
        }
    });

    // Handle toggle change
    toggleShield.addEventListener('change', (e) => {
        const isActive = e.target.checked;
        chrome.storage.local.set({ isShieldActive: isActive }, () => {
            updateUI(isActive);
        });
    });

    // Filter Checkboxes
    const filterIds = ['checkPorn', 'checkHentai', 'checkSexy', 'checkDrawing', 'checkNeutral'];

    // Default settings: Block Porn and Hentai and Sexy by default
    const defaultFilters = {
        checkPorn: true,
        checkHentai: true,
        checkSexy: true,
        checkDrawing: false,
        checkNeutral: false
    };

    // Load filter settings
    chrome.storage.local.get(filterIds, (result) => {
        filterIds.forEach(id => {
            const isChecked = result[id] ?? defaultFilters[id];
            const checkbox = document.getElementById(id);
            checkbox.checked = isChecked;

            // Add listener
            checkbox.addEventListener('change', (e) => {
                const setting = {};
                setting[id] = e.target.checked;
                chrome.storage.local.set(setting, () => {
                    console.log(`Saved ${id}: ${e.target.checked}`);
                });
            });
        });
    });

    // Sensitivity Threshold
    const thresholdRange = document.getElementById('thresholdRange');
    const thresholdValue = document.getElementById('thresholdValue');

    if (thresholdRange && thresholdValue) {
        // Load saved value
        chrome.storage.local.get(['blockingThreshold'], (result) => {
            const val = result.blockingThreshold ?? 60;
            thresholdRange.value = val;
            thresholdValue.textContent = val;
        });

        // Save on change
        thresholdRange.addEventListener('input', (e) => {
            const val = e.target.value;
            thresholdValue.textContent = val;
            chrome.storage.local.set({ blockingThreshold: parseInt(val) });
        });
    }

    // Rescan Button
    const btnRescan = document.getElementById('btnRescan');
    if (btnRescan) {
        btnRescan.addEventListener('click', () => {
            // Send message to active tab
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "RESCAN" }, (response) => {
                        console.log("Rescan sent");
                    });
                }
            });
            // Visual feedback
            btnRescan.textContent = "Đang soi...";
            setTimeout(() => btnRescan.textContent = "⟳ Lưu & Soi Lại Ngay", 1000);
        });
    }

    function updateUI(isActive) {
        toggleShield.checked = isActive;
        if (isActive) {
            statusIndicator.classList.remove('inactive');
            statusText.textContent = 'Đang Gác';
        } else {
            statusIndicator.classList.add('inactive');
            statusText.textContent = 'Đang Ngủ';
        }
    }
});
