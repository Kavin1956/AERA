# Fix "Access Denied" Error - Debugging Guide

## Problem
Getting "❌ Access denied" error when submitting issue as Data Collector

## Solution Steps

### Step 1: Restart Backend with New Logging
```bash
# Stop the backend if running (Ctrl+C)

# In backend folder, restart with dev mode:
cd backend
npm run dev
```

**Expected Output in Terminal:**
```
✅ Backend running on port 5000
✅ MongoDB Connected
```

---

### Step 2: Clear Browser & Login Fresh
1. Open browser (Chrome/Edge)
2. Press **F12** to open DevTools
3. Go to **Application** tab
4. Click **Local Storage**
5. Right-click → **Clear All**
6. Refresh the page (F5)
7. Navigate to http://localhost:3002/login

---

### Step 3: Create/Login with Test Account
Follow the steps in [DEMO_ACCOUNTS.md](DEMO_ACCOUNTS.md) to create:
- **Username**: data_collector_1
- **Password**: demo123456
- **Role**: Data Collector

Login with these credentials

---

### Step 4: Submit an Issue & Check Logs
1. Once logged in as Data Collector
2. Fill out the 4-step form
3. Click "Submit Report"
4. **Watch the Backend Terminal** - look for detailed logging

### Expected Backend Logs (Success):
```
📝 Create Issue Request:
User ID: [some ObjectId]
User Role: data_collector
Issue Data: {userType: 'student', locationCategory: 'classroom', ...}
✅ Issue created: [MongoDB ObjectId]
```

### Actual Logs (If Error):
```
🔐 Role check: User role = 'data_collector', Required role = 'data_collector'
✅ Role authorized: data_collector
📝 Create Issue Request:
User Role: data_collector
...
```

---

### Step 5: Check Browser DevTools for Error Details
1. Open Browser DevTools (F12)
2. Go to **Network** tab
3. Try to submit issue again
4. Look for RED request to `http://localhost:3000/api/issues`
5. Click on it
6. Go to **Response** tab
7. Copy the exact error message

---

## Common Error Messages & Fixes

### Error 1: "No token provided. Please login first."
**Cause**: Token not being sent from frontend  
**Fix**:
1. Verify you're logged in (check top navbar shows username)
2. Open DevTools → Application → Local Storage
3. Check if `token` key exists
4. If missing, logout and login again

### Error 2: "Your role 'data_collector' is not authorized..."
**Cause**: Wrong role or role mismatch  
**Fix**:
1. In **Local Storage**, verify `userRole` = `data_collector`
2. Re-login with correct role selected in dropdown
3. When you see "You are logged in as: data_collector" - then submit

### Error 3: "Invalid or expired token"
**Cause**: Token has expired or is corrupted  
**Fix**:
1. Clear Local Storage (F12 → Application → Local Storage → Clear All)
2. Logout (if possible)
3. Login again
4. Try submitting immediately

### Error 4: Response 500 "Error creating issue"
**Cause**: Backend error (check backend terminal for details)  
**Fix**:
1. Check backend logs
2. Verify MongoDB connection is active
3. Check schema for typos

---

## Complete Testing Checklist

- [ ] Backend running: `npm run dev` in backend folder
- [ ] Frontend running: Browser at http://localhost:3002
- [ ] Local Storage cleared
- [ ] Logged in as `data_collector_1` with role `data_collector`
- [ ] Form filled with valid data (all required fields)
- [ ] Token exists in Local Storage
- [ ] Backend terminal shows "✅ Token verified"
- [ ] Backend terminal shows "✅ Role authorized: data_collector"
- [ ] Browser DevTools Network tab shows `POST /api/issues` with status 201
- [ ] Issue appears in "Submitted Reports" panel

---

## Advanced Debugging

### Check if Token is Being Sent
1. Open DevTools → Network tab
2. Submit issue
3. Click the `issues` POST request
4. Go to **Request Headers**
5. Look for: `Authorization: Bearer eyJhbGc...`
6. If missing → token not being sent by frontend

### Check JWT Token Content
1. Go to https://jwt.io
2. Paste your token (from Local Storage) into "Encoded" section
3. Check the **Payload** section
4. Should show: `"role": "data_collector"`
5. If role is different → issue is role mismatch

### Check MongoDB Connection
1. Go to https://cloud.mongodb.com
2. Your cluster → Collections
3. Look for `users` and `issues` collections
4. At least one user should exist in `users` collection

---

## When All Else Fails

### Full Reset:
```bash
# Terminal 1 - Backend reset
cd backend
npm install
npm run dev

# Terminal 2 - Frontend reset (in new terminal)
cd frontend
npm start

# Browser:
# - Clear Local Storage
# - Logout
# - Go to Signup, create fresh account
# - Login
# - Try submit
```

### Enable Full Logging
Add this to `frontend/src/pages/DataCollector.js` before the form submission:
```javascript
const handleSubmit = async () => {
  // ... validation code ...
  
  console.log('\n🔍 DEBUG: About to submit issue');
  console.log('Token:', localStorage.getItem('token')?.substring(0, 20) + '...');
  console.log('User Role:', localStorage.getItem('userRole'));
  console.log('Issue Data:', issueData);
  
  // ... rest of code ...
}
```

Then check browser console when you submit.

---

## Need More Help?

Check these files:
- Backend logs → Terminal running `npm run dev`
- Browser Network tab → F12 → Network → POST /api/issues
- Browser Console → F12 → Console (any red errors?)
- MongoDB Atlas → Check collections for data
- Local Storage → F12 → Application → Local Storage

---

**Start with Step 1 and work through each step. The logs will tell you exactly where the problem is!**
