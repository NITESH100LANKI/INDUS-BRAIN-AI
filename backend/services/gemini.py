import os
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any

class GeminiClient:
    """
    Production-ready Google Gemini API Client wrapper.
    Supports key rotation across 3 API keys (GEMINI_API_KEY, GEMINI_API_KEY_2, GEMINI_API_KEY_3),
    automatic retry logic, and graceful fallback to the local simulation engine
    on network timeouts or quota exhaustion.
    """
    def __init__(self):
        # Read keys from environment
        self.keys = [
            os.environ.get("GEMINI_API_KEY"),
            os.environ.get("GEMINI_API_KEY_2"),
            os.environ.get("GEMINI_API_KEY_3")
        ]
        # Clean out empty values
        self.keys = [k for k in self.keys if k and k.strip()]
        self.current_key_idx = 0
        print(f"Gemini client initialized. Loaded {len(self.keys)} API keys.")

    def generate_content(self, prompt: str, system_instruction: str = "") -> str:
        if not self.keys:
            print("No Gemini API keys found. Defaulting to local simulator.")
            return ""

        # Attempt call rotating keys if needed
        attempts = len(self.keys) * 2 # 2 attempts per key
        for _ in range(attempts):
            api_key = self.keys[self.current_key_idx]
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            
            # Format payload
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            if system_instruction:
                payload["systemInstruction"] = {"parts": [{"text": system_instruction}]}

            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                url, 
                data=data, 
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            try:
                # 8 second timeout for snappy RAG responses
                with urllib.request.urlopen(req, timeout=8) as response:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    
                    # Parse response text
                    text = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    return text
            except urllib.error.HTTPError as e:
                print(f"[Gemini Warning] HTTP Error {e.code} on key index {self.current_key_idx}. Rotating key...")
                # Rotate key index
                self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)
            except Exception as e:
                print(f"[Gemini Warning] Connection error on key index {self.current_key_idx}: {str(e)}. Rotating key...")
                self.current_key_idx = (self.current_key_idx + 1) % len(self.keys)

        print("[Gemini Error] All Gemini API keys exhausted or network offline. Falling back to local simulator.")
        return ""

gemini_client = GeminiClient()
