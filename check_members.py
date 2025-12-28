import requests
import json

SUPABASE_URL = "https://vkqeejqbyvcpxrqqshbu.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Get all members
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/members?select=id,name,email,position",
    headers=headers
)

members = response.json()
print("Members in database:")
for m in members:
    print(f"  - {m['name']} ({m['email']}) - {m['position']}")
