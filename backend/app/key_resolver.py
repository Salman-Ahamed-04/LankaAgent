import os

def load_gemini_key() -> str | None:
    """
    Resolves the Gemini API Key from:
    1. Dedicated `keys/` directory (e.g. keys/gemini_api_key.txt, keys/api_key.txt, or any .txt/.key in keys/)
    2. Process environment variables GEMINI_API_KEY / GOOGLE_API_KEY
    3. Root or backend .env
    """
    # 1. Check dedicated keys folder in project root
    backend_dir = os.path.dirname(os.path.dirname(__file__))
    root_dir = os.path.dirname(backend_dir)
    keys_dir = os.path.join(root_dir, "keys")

    if os.path.isdir(keys_dir):
        # Preferred file names
        for preferred in ["gemini_api_key.txt", "api_key.txt", "gemini.txt", "key.txt"]:
            cand = os.path.join(keys_dir, preferred)
            if os.path.isfile(cand):
                try:
                    with open(cand, "r", encoding="utf-8") as f:
                        val = f.read().strip()
                        # Handle potential KEY=VALUE format
                        if "=" in val and "\n" not in val and ("GEMINI" in val or "API_KEY" in val):
                            val = val.split("=", 1)[1].strip()
                        if val and not val.startswith("#") and len(val) > 6:
                            return val
                except Exception as e:
                    print(f"Error reading {cand}: {e}")

        # Scan any other .txt or .key file in keys/
        try:
            for fname in os.listdir(keys_dir):
                if fname.lower().endswith((".txt", ".key")) and not fname.lower().startswith("readme"):
                    cand = os.path.join(keys_dir, fname)
                    if os.path.isfile(cand):
                        with open(cand, "r", encoding="utf-8") as f:
                            val = f.read().strip()
                            if "=" in val and "\n" not in val and ("GEMINI" in val or "API_KEY" in val):
                                val = val.split("=", 1)[1].strip()
                            if val and not val.startswith("#") and len(val) > 6:
                                return val
        except Exception as e:
            print(f"Error scanning keys directory: {e}")

    # 2. Check environment variables
    env_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if env_key and len(env_key.strip()) > 6:
        return env_key.strip()

    return None
