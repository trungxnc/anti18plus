import requests
import re
from tqdm import tqdm
import concurrent.futures

# Configuration
SOURCE_URL = "https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn/hosts"
API_URL = "http://localhost:8080/api/v1/domains"
MAX_WORKERS = 10  # Parallel requests

def fetch_hosts():
    print(f"Downloading hosts file from {SOURCE_URL}...")
    response = requests.get(SOURCE_URL)
    response.raise_for_status()
    return response.text

def parse_domains(content):
    domains = set()
    print("Parsing domains...")
    # Regex to capture domains mapped to 0.0.0.0 or 127.0.0.1
    # Format: 0.0.0.0 domain.com
    regex = r"^(?:0\.0\.0\.0|127\.0\.0\.1)\s+([a-zA-Z0-9.-]+)"
    
    for line in content.splitlines():
        line = line.strip()
        if line.startswith("#") or not line:
            continue
        
        match = re.match(regex, line)
        if match:
            domain = match.group(1)
            if domain != "0.0.0.0" and domain != "127.0.0.1" and domain != "localhost":
                domains.add(domain)
    
    print(f"Found {len(domains)} unique domains.")
    return list(domains)

def import_domain(domain):
    payload = {
        "domainName": domain,
        "category": "ADULT", # Defaulting to ADULT for this specific list
        "source": "StevenBlack-Hosts",
        "isActive": True
    }
    
    try:
        response = requests.post(API_URL, json=payload)
        if response.status_code == 200:
            return "success"
        elif response.status_code == 500: # Likely "Domain already exists"
            return "duplicate"
        else:
            return "error"
    except Exception as e:
        return "error"

def main():
    try:
        content = fetch_hosts()
        domains = parse_domains(content)
        
        # Taking a subset for testing if list is huge, or full list
        # domains = domains[:1000] # Uncomment to limit for testing
        
        print(f"Starting import of {len(domains)} domains...")
        
        stats = {"success": 0, "duplicate": 0, "error": 0}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
            # Using list(tqdm(...)) to show progress bar
            results = list(tqdm(executor.map(import_domain, domains), total=len(domains)))
            
            for res in results:
                stats[res] += 1
                
        print("\nImport Completed!")
        print(f"Successfully Added: {stats['success']}")
        print(f"Duplicates Skipped: {stats['duplicate']}")
        print(f"Errors: {stats['error']}")

    except Exception as e:
        print(f"Fatal Error: {e}")

if __name__ == "__main__":
    main()
