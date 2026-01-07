# Phase 3: AI & Dynamic Analysis Implementation Plan

## Goal
Integrate client-side AI analysis to detect and block explicit content (images) that slips through the domain blocklist.

## User Review Required
> [!IMPORTANT]
> **Performance Impact**: AI analysis interacts with the GPU. We will use **IntersectionObserver** to only scan images as they scroll into view to minimize lag.
> **Model Storage**: We will download the **NSFWJS (MobileNet v2)** model (~4MB) and bundle it with the extension to ensure **Offline Privacy**. No images are sent to any server.

## Proposed Changes

### 1. Library & Model Setup
*   **Location**: `extension/lib/tf.min.js`, `extension/lib/nsfwjs.min.js`.
*   **Model**: `extension/models/quantized/*`.
*   **Method**: Download pre-trained models and scripts manually (simulated via script) into the extension folder.

### 2. Content Script Upgrades (`content.js`)
*   **Initialization**: Load TFJS engine and NSFW Model on startup.
*   **Scanning Strategy**:
    1.  Observe DOM for new `<img>` elements.
    2.  Use `IntersectionObserver` to trigger scan when image enters viewport.
    3.  Check image against model.
*   **Action**:
    *   If `probability.Porn > 0.6` OR `probability.Hentai > 0.6`:
        *   Apply CSS `filter: blur(30px)`.
        *   Overlay a specific warning icon.

### 3. Text/DOM Analysis
*   Scan `<title>`, `<meta name="description">`, and `<h1>` tags for keywords (e.g., "xxx", "porn", "betting").
*   If keyword density is high -> Redirect to Blocked Page immediately.

## Verification Plan

### Manual Testing
1.  Visit a safe site (Google Images) -> Ensure no lag/false positives.
2.  Visit a test site -> Ensure explicit images are blurred.
3.  Check Console logs for "Model Loaded" and "Image Scanned".

### 4. Performance Optimization
*   **WASM Backend**: Switch from CPU to `tf-backend-wasm` for substantial speedup (10x-20x) on image inference.
*   **Web Workers**: (Optional) Move inference to a background thread to prevent UI freezing.

## Verification Plan

### Manual Testing
1.  Visit a safe site (Google Images) -> Ensure no lag/false positives.
2.  Visit a test site -> Ensure explicit images are blurred.
3.  Check Console logs for "Model Loaded" and "Image Scanned".

### Resources
*   TF.js Graph Model (MobileNet V2)
*   [NSFWJS GitHub](https://github.com/infinitered/nsfwjs) - Original model source and training data.
