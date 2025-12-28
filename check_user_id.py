import requests
import json

SUPABASE_URL = "https://vkqeejqbyvcpxrqqshbu.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Check professor's member record
response = requests.get(
    f"{SUPABASE_URL}/rest/v1/members?email=eq.jaeho19@gmail.com&select=id,name,email,user_id,position",
    headers=headers
)

print(f"Status: {response.status_code}")
print(f"Response: {response.text}")

# Check auth user
response2 = requests.get(
    f"{SUPABASE_URL}/auth/v1/admin/users",
    headers=headers
)

users = response2.json().get('users', [])
for u in users:
    if u.get('email') == 'jaeho19@gmail.com':
        print(f"\nAuth user id: {u['id']}")
