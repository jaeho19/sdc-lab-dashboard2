import requests

SUPABASE_URL = "https://vkqeejqbyvcpxrqqshbu.supabase.co"
SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrcWVlanFieXZjcHhycXFzaGJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjgxMzkyMSwiZXhwIjoyMDgyMzg5OTIxfQ.t3ks4W4XtlVzHfzPwN5rNixD3FaG8kwT-NP0x4-ESUM"

headers = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

# Add columns using Supabase SQL endpoint
sql_commands = [
    "ALTER TABLE members ADD COLUMN IF NOT EXISTS admission_date DATE;",
    "ALTER TABLE members ADD COLUMN IF NOT EXISTS graduation_date DATE;",
    "ALTER TABLE members ADD COLUMN IF NOT EXISTS interests TEXT;"
]

for sql in sql_commands:
    response = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/",
        headers=headers,
        json={"query": sql}
    )
    print(f"Executed: {sql[:50]}... - Status: {response.status_code}")

print("\nNote: If status is 404, columns may need to be added via Supabase Dashboard.")
print("Go to: https://supabase.com/dashboard/project/vkqeejqbyvcpxrqqshbu/editor")
print("Add columns: admission_date (date), graduation_date (date), interests (text)")
