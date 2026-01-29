import requests
import sys
import json
import os

BASE_URL = "http://localhost:8000"
FRONTEND_URL = "http://localhost:8083"

session_map = {}

def get_session(user):
    if user not in session_map:
        s = requests.Session()
        # Get CSRF cookie
        s.get(f"{BASE_URL}/api/auth/user/") # Assuming this sets cookie, or login
        session_map[user] = s
    return session_map[user]

def login(user, password):
    s = get_session(user)
    # Get CSRF token first
    s.get(f"{BASE_URL}/api/auth/user/")
    csrftoken = s.cookies.get('csrftoken')

    # Actually use the API login
    headers = {'X-CSRFToken': csrftoken} if csrftoken else {}
    resp = s.post(f"{BASE_URL}/api/auth/login/",
                  json={'username': user, 'password': password},
                  headers=headers)

    if resp.status_code == 200:
        print(f"✅ Login successful for {user}")
        return True
    else:
        print(f"❌ Login failed for {user}: {resp.status_code} {resp.text}")
        return False

def check_routing():
    print("--- 1.1 Caddy Routing Sanity (Simulated) ---")
    try:
        r = requests.get(FRONTEND_URL)
        if r.status_code == 200 and "<html" in r.text.lower():
             print("✅ Frontend accessible")
        else:
             print(f"❌ Frontend check failed: {r.status_code}")
    except Exception as e:
        print(f"❌ Frontend check error: {e}")

    try:
        r = requests.get(f"{BASE_URL}/admin/")
        if r.status_code == 200:
             print("✅ Backend Admin accessible")
        else:
             print(f"❌ Backend Admin check failed: {r.status_code}")
    except Exception as e:
        print(f"❌ Backend Admin check error: {e}")

def check_rbac():
    print("\n--- 3. RBAC Verification ---")
    users = ['admin', 'contrib1', 'review1', 'public']

    endpoints = [
        ('GET', '/api/indicators/', [200, 200, 200, 200]), # Public read allowed
        ('GET', '/api/compliance/', [200, 200, 200, 403]), # Auth only
        ('GET', '/api/evidence/', [200, 200, 200, 403]), # Auth only
        ('GET', '/api/audit/logs/', [200, 403, 200, 403]), # Admin+Reviewer
    ]

    for method, path, expected_codes in endpoints:
        for i, user in enumerate(users):
            if user == 'public':
                s = requests.Session()
            else:
                s = get_session(user)

            try:
                if method == 'GET':
                    r = s.get(f"{BASE_URL}{path}")
                else:
                    print(f"⚠️ Unsupported method {method} for {path}. Skipping.")
                    continue


                code = r.status_code
                expected = expected_codes[i]

                if path == '/api/audit/logs/' and code == 404:
                     print(f"⚠️ {user} {method} {path} -> 404 (Audit Logs likely missing)")
                     continue

                if code == expected:
                    print(f"✅ {user} {method} {path} -> {code}")
                elif code == 404:
                    print(f"❓ {user} {method} {path} -> 404 (Endpoint might be missing)")
                elif code == 403 and expected == 200:
                    print(f"❌ {user} {method} {path} -> {code} (Permission Denied but Expected OK)")
                elif code == 200 and expected == 403:
                    print(f"❌ {user} {method} {path} -> {code} (Allowed but Expected Forbidden)")
                else:
                    print(f"❌ {user} {method} {path} -> {code} (Expected {expected})")
            except Exception as e:
                print(f"❌ Error {user} {method} {path}: {e}")

def check_audit_logs():
    print("\n--- 6. Audit Trail Completeness ---")
    s = get_session('admin')
    try:
        r = s.get(f"{BASE_URL}/api/audit/logs/")
        if r.status_code == 404:
            print("❌ Audit Logs endpoint not found (404). Feature likely missing.")
        elif r.status_code == 200:
            data = r.json()
            print(f"✅ Audit Logs found. Count: {len(data) if isinstance(data, list) else '?'}")
        else:
            print(f"❌ Audit Logs access failed: {r.status_code}")
    except Exception as e:
        print(f"❌ Audit Logs check error: {e}")

def run_all():
    check_routing()

    # Login users
    admin_ok = login('admin', 'password123')
    contrib_ok = login('contrib1', 'password123')
    review_ok = login('review1', 'password123')

    if not (admin_ok and contrib_ok and review_ok):
        print("❌ One or more user logins failed. Skipping RBAC and audit log checks.")
        return
    check_rbac()
    check_audit_logs()

if __name__ == "__main__":
    run_all()
