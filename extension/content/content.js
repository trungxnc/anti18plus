console.log("Anti18Plus: Content Script Execute Start");

// Global Variables
let model = null;
const INPUT_SIZE = 224; // MobileNet v2 input size
// Class mapping for NSFWJS model: 0:Drawing, 1:Hentai, 2:Neutral, 3:Porn, 4:Sexy
const NSFW_CLASSES = {
    0: 'Drawing',
    1: 'Hentai',
    2: 'Neutral',
    3: 'Porn',
    4: 'Sexy'
};

// Initialize AI Model
async function loadModel() {
    try {
        console.log("Anti18Plus: Setting up TensorFlow backend...");

        if (typeof tf === 'undefined') {
            throw new Error("TensorFlow.js not found!");
        }

        console.log("Anti18Plus: tf keys:", Object.keys(tf));
        console.log("Anti18Plus: tf.version:", tf.version);

        // Initialize backend (Switching to WASM for performance)
        // Set WASM paths to fetch from extension assets
        tf.wasm.setWasmPaths(chrome.runtime.getURL('lib/'));

        await tf.setBackend('wasm');
        await tf.ready();
        console.log("Anti18Plus: TensorFlow backend set to:", tf.getBackend());

        // Path to local model file in extension
        const modelUrl = chrome.runtime.getURL('models/quantized/model.json');
        console.log(`Anti18Plus: Loading Layers model from ${modelUrl}...`);

        // Load Layers Model (MobileNet v2 converted from Keras)
        model = await tf.loadLayersModel(modelUrl);
        console.log("Anti18Plus: AI Model Loaded successfully!");

        // Start observing images
        observeImages();
    } catch (err) {
        console.error("Anti18Plus: Failed to load AI Model:", err);
    }
}

// Image Observer
function observeImages() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (!img.dataset.scanned) {
                    //console.log("Anti18Plus: Scanning image:", img.src);
                    scanImage(img);
                    observer.unobserve(img);
                }
            }
        });
    });

    // Observe existing images
    document.querySelectorAll('img').forEach(img => observer.observe(img));

    // Observe new images via MutationObserver
    new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.tagName === 'IMG') {
                    observer.observe(node);
                } else if (node.querySelectorAll) {
                    node.querySelectorAll('img').forEach(img => observer.observe(img));
                }
            });
        });
    }).observe(document.body, { childList: true, subtree: true });
}

// Global State
let isShieldActive = true;
let blockedClasses = {
    'Drawing': false,
    'Hentai': true,
    'Neutral': false,
    'Porn': true,
    'Sexy': true
};
let blockingThreshold = 60;

// Load Settings
function loadSettings() {
    chrome.storage.local.get(['isShieldActive', 'checkPorn', 'checkHentai', 'checkSexy', 'checkDrawing', 'checkNeutral', 'blockingThreshold'], (result) => {
        if (result.isShieldActive !== undefined) isShieldActive = result.isShieldActive;

        if (result.checkPorn !== undefined) blockedClasses['Porn'] = result.checkPorn;
        if (result.checkHentai !== undefined) blockedClasses['Hentai'] = result.checkHentai;
        if (result.checkSexy !== undefined) blockedClasses['Sexy'] = result.checkSexy;
        if (result.checkDrawing !== undefined) blockedClasses['Drawing'] = result.checkDrawing;
        if (result.checkNeutral !== undefined) blockedClasses['Neutral'] = result.checkNeutral;

        if (result.blockingThreshold !== undefined) blockingThreshold = result.blockingThreshold;

        console.log("Anti18Plus: Loaded Settings:", { active: isShieldActive, classes: blockedClasses, threshold: blockingThreshold });

        // If inactive, maybe unblur everything? For now, just stop scanning.
        if (!isShieldActive) unblurAll();
    });
}

// Initial Load
loadSettings();

// Listen for settings changes
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.isShieldActive !== undefined) {
            isShieldActive = changes.isShieldActive.newValue;
            if (!isShieldActive) unblurAll();
            else rescanAll();
        }

        if (changes.checkPorn) blockedClasses['Porn'] = changes.checkPorn.newValue;
        if (changes.checkHentai) blockedClasses['Hentai'] = changes.checkHentai.newValue;
        if (changes.checkSexy) blockedClasses['Sexy'] = changes.checkSexy.newValue;
        if (changes.checkDrawing) blockedClasses['Drawing'] = changes.checkDrawing.newValue;
        if (changes.checkNeutral) blockedClasses['Neutral'] = changes.checkNeutral.newValue;

        if (changes.blockingThreshold) blockingThreshold = changes.blockingThreshold.newValue;

        console.log("Anti18Plus: Settings Updated. Triggering Rescan...");
        // Auto-rescan when settings change to apply new filters immediately
        rescanAll();
    }
});

// Message Listener from Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "RESCAN") {
        console.log("Anti18Plus: Manual Rescan Triggered");
        rescanAll();
        sendResponse({ status: "Rescan started" });
    }
});

function rescanAll() {
    // Clear scanned status and re-scan all images
    document.querySelectorAll('img').forEach(img => {
        // Don't delete dataset.scanned immediately if we want to optimize, 
        // but for re-evaluating logic we must re-scan.
        // We can skip re-inference if we cached the prediction, but for now re-infer is safer.
        delete img.dataset.scanned;
        scanImage(img);
    });
}

function unblurAll() {
    document.querySelectorAll('img').forEach(img => unblurImage(img));
}

function unblurImage(img) {
    // Remove inline style
    if (img.style.filter.includes("blur")) {
        img.style.filter = "";
        img.style.removeProperty("filter");
        // Also remove transition if needed, but keeping it is fine
    }
    delete img.dataset.blocked;

    // Remove Wrapper & Icon
    if (img.parentNode.classList.contains('anti18plus-wrapper')) {
        const wrapper = img.parentNode;
        const parent = wrapper.parentNode;
        // Move img back to parent
        parent.insertBefore(img, wrapper);
        // Remove wrapper (which contains the icon)
        parent.removeChild(wrapper);
    }
}


async function scanImage(img) {
    if (!model) return;
    if (!isShieldActive) return; // Stop if inactive settings

    // Mark as scanned
    img.dataset.scanned = "true";

    // Skip small icons or hidden images
    if (img.width < 50 || img.height < 50) return;

    // Set CORS to anonymous to allow scanning external images
    if (!img.crossOrigin) img.crossOrigin = "anonymous";

    try {
        // Run inference in TF.js tidy to clean up tensors
        // IMPORTANT: tf.tidy is synchronous. Do NOT use await inside it.
        const values = tf.tidy(() => {
            try {
                // 1. From pixels
                if (!(img instanceof HTMLImageElement)) return null;
                const tensor = tf.browser.fromPixels(img);

                // 2. Resize and Preprocess
                // MobileNetV2 expects: [1, 224, 224, 3], Float32
                const resized = tf.image.resizeBilinear(tensor, [INPUT_SIZE, INPUT_SIZE], true);

                // Use functional API instead of chaining (safe for modular builds)
                const normalized = tf.div(resized, 255.0);
                const batched = tf.expandDims(normalized, 0);

                // 3. Make Prediction
                const prediction = model.predict(batched);

                // Handle potential multi-output models
                const resultTensor = Array.isArray(prediction) ? prediction[0] : prediction;

                // Return data synchronously inside tidy to avoid tensor disposal issues
                return resultTensor.dataSync();
            } catch (innerErr) {
                // console.error("Anti18Plus: Error inside tidy:", innerErr);
                return null;
            }
        });

        if (!values) return;

        // 5. Check Classes and threshold
        let maxProb = 0;
        let maxClass = '';
        for (let i = 0; i < 5; i++) {
            if (values[i] > maxProb) {
                maxProb = values[i];
                maxClass = NSFW_CLASSES[i];
            }
        }

        console.log(`Anti18Plus: Scanned ${img.src.substring(0, 30)}... | Top: ${maxClass} (${(maxProb * 100).toFixed(1)}%)`);

        // Send Stats (Paused for performance)
        // chrome.runtime.sendMessage({ action: "INCREMENT_STATS", type: "scanned" });

        // Check Blocking Rule
        const shouldBlock = blockedClasses[maxClass] && (maxProb * 100) > blockingThreshold;

        if (shouldBlock) {
            if (img.dataset.blocked !== "true") {
                console.log(`Anti18Plus: BLOCKING (${maxClass} ${Math.round(maxProb * 100)}%)`, img.src);
                blurImage(img);
            }
        } else {
            // Check if previously blocked but now allowed (e.g. user changed settings)
            if (img.dataset.blocked === "true") {
                console.log(`Anti18Plus: UNBLOCKING (${maxClass} allowed)`, img.src);
                unblurImage(img);
            }
        }

    } catch (err) {
        // console.warn("Anti18Plus: Scan failed:", err.message);
    }
}

function blurImage(img) {
    // Avoid double wrapping
    if (img.parentNode.classList.contains('anti18plus-wrapper')) return;

    // Apply blur to the image itself
    img.style.setProperty("filter", "blur(30px) grayscale(100%)", "important");
    img.style.transition = "filter 0.5s";
    img.dataset.blocked = "true";

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('anti18plus-wrapper');
    wrapper.style.position = 'relative';
    wrapper.style.display = 'inline-block'; // Or copy from img computed style
    wrapper.style.width = img.clientWidth ? img.clientWidth + 'px' : 'auto';
    wrapper.style.height = img.clientHeight ? img.clientHeight + 'px' : 'auto';

    // Insert wrapper
    img.parentNode.insertBefore(wrapper, img);
    wrapper.appendChild(img);

    // Create Icon Overlay
    const icon = document.createElement('img');
    icon.src = chrome.runtime.getURL('icons/icon128.png');
    icon.style.position = 'absolute';
    icon.style.top = '50%';
    icon.style.left = '50%';
    icon.style.transform = 'translate(-50%, -50%)';
    icon.style.width = '48px'; // Adjust size
    icon.style.height = '48px';
    icon.style.zIndex = '1000';
    icon.style.pointerEvents = 'none'; // Click through to image/link

    wrapper.appendChild(icon);
}

// Start
loadModel();
