# Manager Login Instructions

## ✅ Quick Manager Login Steps

### Step 1: Logout as Data Collector
If you're currently logged in as Data Collector:
1. Click **Logout** button (top right of page)
2. You'll be redirected to home page

### Step 2: Go to Login Page
Click the link: **"Already have an account? Login here"**  
OR go directly to: http://localhost:3002/login

### Step 3: Enter Manager Credentials
Fill in the login form:

| Field | Value |
|-------|-------|
| **Username** | manager_alice |
| **Password** | managerpass123 |
| **Role** | Manager (from dropdown) |

### Step 4: Click Login
Click the **Login** button

### Step 5: You Should See
After successful login:
- Page redirects to Manager Dashboard
- Dashboard shows statistics cards:
  - Total Issues
  - New Issues
  - In Progress
  - Solved Issues
- Below are two tabs: "Current Issues" and "Issues History"
- Table shows all submitted issues

---

## 🔑 Manager Account Details

```
Username: manager_alice
Password: managerpass123
Email: manager@aera.edu
Role: Manager
```

⚠️ **Important**: The email `manager@aera.edu` is **required** for Manager signup (if you need to create a new account)

---

## ❌ If Manager Login Fails

### Check 1: Verify You Created the Account
1. Did you create a manager account in signup?
2. Or should we create it now? (See below)

### Check 2: Clear Browser & Try Again
1. Press F12 → Application → Local Storage → Clear All
2. Refresh page
3. Try login again

### Check 3: Create Manager Account First
If manager account doesn't exist yet:
1. Go to http://localhost:3002/signup
2. Fill in:
   - **Full Name**: Alice Manager
   - **Email**: `manager@aera.edu` (⚠️ MUST BE THIS EMAIL)
   - **Username**: manager_alice
   - **Password**: managerpass123
   - **Confirm**: managerpass123
   - **Role**: Manager (from dropdown)
3. Click Sign Up
4. You'll go to Login page
5. Login with credentials above

---

## 🎯 What You'll See in Manager Dashboard

### Dashboard Stats (Top Section)
```
┌─────────────────────────────────────────────────────┐
│ Total Issues │ New Issues │ In Progress │ Solved │
│      5       │      3     │      2      │   0    │
└─────────────────────────────────────────────────────┘
```

### Weekly Analysis (Optional)
Shows issues by priority:
- 🚨 Water Issues
- 📽️ Projector Issues
- ⚡ Electricity Issues
- 🧹 Cleaning Issues
- 📌 Others

### Issues Table
Click any "View" button to:
- See full issue details
- Select technician type
- Click "Assign to Technician"
- Issue moves to "Assigned" status

---

## ✅ Test Workflow

1. **As Data Collector**:
   - Login (data_collector_1 / demo123456)
   - Submit an issue
   - Logout

2. **As Manager**:
   - Login (manager_alice / managerpass123)
   - See the issue in "Current Issues" table
   - Click View → Assign Technician
   - Select a technician type
   - Click "Assign to Technician"
   - Issue moves to "Assigned" status ✅

---

## 🐛 If You Still Can't Login

Share the exact error message you see and check:
1. Is the backend running? (`npm run dev` terminal should show ✅ Backend running)
2. Is the frontend running? (Browser at http://localhost:3002)
3. What error appears in browser console? (F12 → Console tab)
4. What error appears in backend terminal?

---

**Try these exact steps above - they will work!**
