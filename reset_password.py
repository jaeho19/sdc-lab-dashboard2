import requests

SUPABASE_URL = "https://vkqeejqbyvcpxrqqshbu.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json"
}

# Update password for professor
user_id = "43796ddc-a2fc-44d3-bb9b-b8d40ccd9538"
response = requests.put(
    f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
    headers=headers,
    json={"password": "Cory0012"}
)

if response.status_code == 200:
    print("비밀번호가 Cory0012로 변경되었습니다.")
else:
    print(f"오류: {response.status_code} - {response.text}")
