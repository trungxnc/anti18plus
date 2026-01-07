import os
import requests

# URLs for modular TensorFlow.js (Version 4.16.0)
# We use separate files to avoid loading WebGL backend which violates CSP in Manifest V3
LIBS = {
    "tf-core.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4.16.0/dist/tf-core.min.js",
    "tf-backend-cpu.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-cpu@4.16.0/dist/tf-backend-cpu.min.js",
    "tf-layers.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-layers@4.16.0/dist/tf-layers.min.js",
    "tf-converter.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4.16.0/dist/tf-converter.min.js",
    "tf-backend-wasm.min.js": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.16.0/dist/tf-backend-wasm.min.js",
    "tfjs-backend-wasm.wasm": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.16.0/dist/tfjs-backend-wasm.wasm",
    "tfjs-backend-wasm-simd.wasm": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.16.0/dist/tfjs-backend-wasm-simd.wasm",
    "tfjs-backend-wasm-threaded-simd.wasm": "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@4.16.0/dist/tfjs-backend-wasm-threaded-simd.wasm"
}

# Directory to save files
LIB_DIR = "extension/lib"

def download_file(filename, url):
    path = os.path.join(LIB_DIR, filename)
    print(f"Downloading {filename}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(path, "wb") as f:
            f.write(response.content)
        print(f"Success: {filename}")
    except Exception as e:
        print(f"Error downloading {filename}: {e}")

if __name__ == "__main__":
    if not os.path.exists(LIB_DIR):
        os.makedirs(LIB_DIR)
        print(f"Created directory: {LIB_DIR}")
    
    print("Starting download of modular TensorFlow.js libraries...")
    for name, url in LIBS.items():
        download_file(name, url)
    print("All downloads completed.")
