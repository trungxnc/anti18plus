import requests
import os
import json

# URLs
TFJS_URL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.17.0/dist/tf.min.js"
NSFWJS_URL = "https://cdn.jsdelivr.net/npm/nsfwjs@2.4.2/dist/nsfwjs.min.js"
MODEL_BASE_URL = "https://raw.githubusercontent.com/infinitered/nsfwjs/refs/heads/master/models/mobilenet_v2/"

# Paths
LIB_DIR = r"d:\Projects\anti18plus\extension\lib"
MODEL_DIR = r"d:\Projects\anti18plus\extension\models\quantized"

def download_file(url, dest_path):
    print(f"Downloading {url} to {dest_path}...")
    try:
        response = requests.get(url)
        response.raise_for_status()
        with open(dest_path, 'wb') as f:
            f.write(response.content)
        print("Success.")
    except Exception as e:
        print(f"Failed to download {url}: {e}")

def main():
    # 1. Download Libraries
    if not os.path.exists(LIB_DIR):
        os.makedirs(LIB_DIR)
        
    download_file(TFJS_URL, os.path.join(LIB_DIR, "tf.min.js"))
    download_file(NSFWJS_URL, os.path.join(LIB_DIR, "nsfwjs.min.js"))

    # 2. Download Model (model.json)
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)

    model_json_path = os.path.join(MODEL_DIR, "model.json")
    download_file(MODEL_BASE_URL + "model.json", model_json_path)

    # 3. Parse model.json to find shards
    try:
        with open(model_json_path, 'r') as f:
            model_data = json.load(f)
        
        if 'weightsManifest' in model_data:
            for manifest in model_data['weightsManifest']:
                for path in manifest['paths']:
                    shard_url = MODEL_BASE_URL + path
                    shard_dest = os.path.join(MODEL_DIR, path)
                    download_file(shard_url, shard_dest)
    except Exception as e:
        print(f"Error parsing model.json or downloading shards: {e}")

if __name__ == "__main__":
    main()
