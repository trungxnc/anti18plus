document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation
    const tabs = document.querySelectorAll('.nav-item');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });

    // Rule Management
    const blacklistInput = document.getElementById('blacklistInput');
    const addBlacklistBtn = document.getElementById('addBlacklistBtn');
    const blacklistList = document.getElementById('blacklistList');

    // Sync Management
    const forceSyncBtn = document.getElementById('forceSyncBtn');
    if (forceSyncBtn) {
        forceSyncBtn.addEventListener('click', () => {
            forceSyncBtn.textContent = 'Syncing...';
            chrome.runtime.sendMessage({ action: "forceSync" }, (response) => {
                forceSyncBtn.textContent = 'Sync Completed';
                setTimeout(() => forceSyncBtn.textContent = 'Sync Now', 2000);
            });
        });
    }

    let customRules = [];

    // Initialize: Fetch current dynamic rules
    chrome.declarativeNetRequest.getDynamicRules(rules => {
        customRules = rules;
        renderRules();
    });

    addBlacklistBtn.addEventListener('click', () => {
        const domain = blacklistInput.value.trim();
        if (domain) {
            addRule(domain, 'block');
            blacklistInput.value = '';
        }
    });

    // Whitelist Logic
    const whitelistInput = document.getElementById('whitelistInput');
    const addWhitelistBtn = document.getElementById('addWhitelistBtn');
    const whitelistList = document.getElementById('whitelistList');

    addWhitelistBtn.addEventListener('click', () => {
        const domain = whitelistInput.value.trim();
        if (domain) {
            addRule(domain, 'allow');
            whitelistInput.value = '';
        }
    });

    function addRule(domain, type) {
        const id = Math.floor(Math.random() * 100000) + 1000;
        let action = {};
        let priority = 1;

        if (type === 'block') {
            action = {
                type: "redirect",
                redirect: { extensionPath: "/pages/blocked.html" }
            };
            priority = 2;
        } else {
            action = { type: "allow" };
            priority = 3; // Allow takes precedence
        }

        const newRule = {
            id: id,
            priority: priority,
            action: action,
            condition: {
                urlFilter: domain,
                resourceTypes: ["main_frame"]
            }
        };

        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [newRule]
        }, () => {
            customRules.push(newRule);
            renderRules();
        });
    }

    function removeRule(id) {
        chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [id]
        }, () => {
            customRules = customRules.filter(r => r.id !== id);
            renderRules();
        });
    }

    function renderRules() {
        blacklistList.innerHTML = '';
        whitelistList.innerHTML = '';
        document.getElementById('customRulesCount').textContent = customRules.length;

        customRules.forEach(rule => {
            if (rule.condition.urlFilter) {
                const li = document.createElement('li');
                const isAllow = rule.action.type === 'allow';

                li.innerHTML = `
                    <span>${rule.condition.urlFilter}</span>
                    <button class="delete-btn" data-id="${rule.id}">Remove</button>
                `;

                li.querySelector('.delete-btn').addEventListener('click', () => {
                    removeRule(rule.id);
                });

                if (isAllow) {
                    whitelistList.appendChild(li);
                } else {
                    blacklistList.appendChild(li);
                }
            }
        });
    }
});
