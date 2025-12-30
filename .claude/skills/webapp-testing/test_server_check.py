"""Test script to check if server is working correctly."""
import subprocess
import time
import requests

def test_server():
    print("Starting Next.js dev server...")
    proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd="C:/dev/sdclab-dashboard",
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=True
    )

    # Wait for server to start and capture output
    output_lines = []
    server_ready = False
    start_time = time.time()

    while time.time() - start_time < 60:  # 60 second timeout
        line = proc.stdout.readline()
        if line:
            output_lines.append(line.strip())
            print(f"[SERVER] {line.strip()}")
            if "Ready" in line or "started" in line.lower() or ":3000" in line:
                server_ready = True
                time.sleep(2)  # Wait a bit after ready
                break

    if not server_ready:
        print("\nServer did not start in time. Last output:")
        for line in output_lines[-20:]:
            print(f"  {line}")
        proc.kill()
        return

    print("\n" + "=" * 60)
    print("Server ready. Testing endpoints...")
    print("=" * 60)

    # Test login page
    try:
        print("\nTesting /login...")
        resp = requests.get("http://localhost:3000/login", timeout=30)
        print(f"  Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"  Content (first 500 chars): {resp.text[:500]}")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Test root page
    try:
        print("\nTesting / (root)...")
        resp = requests.get("http://localhost:3000", timeout=30)
        print(f"  Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"  Content (first 500 chars): {resp.text[:500]}")
    except Exception as e:
        print(f"  ERROR: {e}")

    # Capture any additional server errors
    print("\n" + "=" * 60)
    print("Checking for server errors...")
    print("=" * 60)

    time.sleep(3)
    while True:
        line = proc.stdout.readline()
        if not line:
            break
        output_lines.append(line.strip())
        if "error" in line.lower() or "Error" in line:
            print(f"[ERROR] {line.strip()}")

    # Print last 30 lines of output
    print("\nLast 30 lines of server output:")
    for line in output_lines[-30:]:
        print(f"  {line}")

    proc.kill()

if __name__ == "__main__":
    test_server()
