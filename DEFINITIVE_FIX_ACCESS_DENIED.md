# Fix: "Access Denied" When Submitting Issue

## Root Cause
The backend is rejecting issue submission because:
1. Token is missing OR
2. Role in token is wrong (doesn't match 'data_collector')

---

## 🔧 COMPLETE FIX (Follow in Order)

### Step 1: Verify Backend is Running
**Terminal 1** should show:
```
✅ Backend running on port 5000
✅ MongoDB Connected
```

If not:
```bash
cd backend
npm run dev
```

### Step 2: Verify Frontend is Running
**Terminal 2** or browser should show http://localhost:3002

If not:
```bash
cd frontend
npm start
```

### Step 3: FULL BROWSER RESET
This is CRITICAL - do not skip!

1. Open browser DevTools: Press **F12**
2. Go to **Application** tab (or **Storage** in Firefox)
3. Left sidebar → **Local Storage**
4. Right-click on "http://localhost:3002" → **Clear All**
5. Left sidebar → **Cookies**
6. Right-click → **Clear All**
7. Left sidebar → **Session Storage**
8. Right-click → **Clear All**
9. Left sidebar → **Indexed DB**
10. If anything is there → Right-click → **Delete**
11. Close DevTools (Press F12 again)
12. Do a HARD refresh: **Ctrl+Shift+R** (Windows) or **Cmd+Shift+R** (Mac)
13. Wait for page to fully load

---

### Step 4: Create BRAND NEW Account
Go to **http://localhost:3002/signup**

**IMPORTANT**: Use EXACTLY these values:
```
Full Name:        Test User
Email:            test@example.com
Username:         testuser
Password:         testpass123
Confirm Password: testpass123
Role:             Data Collector (from dropdown)
```

Click **Sign Up**

You'll see message: "Sign-up successful! Redirecting to login..."

### Step 5: Login with Exact Credentials
You're now on **http://localhost:3002/login**

Enter:
```
Username: testuser
Password: testpass123
Role:     Data Collector (IMPORTANT: Must match dropdown)
```

Click **Login**

**Expected**: Page shows "Data Collector" form with "Step 1: Select User Type"

---

### Step 6: Check Browser Console
Press **F12** → **Console** tab

Look for these logs (scroll down):
```
📤 Submitting Issue:
Token: eyJhbGc...
User Role: data_collector
User Name: testuser
```

If you DON'T see these logs, you're not logged in properly. Go back to Step 3.

---

### Step 7: Fill & Submit Issue
Complete the 4-step form:
1. **Step 1**: Select "Student" as user type
2. **Step 2**: Enter name "John" and any other required fields
3. **Step 3**: Select Block "A", Floor "1", Room "101", Location type "Classroom"
4. **Step 4**: Select Condition "Good" and check some checkboxes

Click **Submit Report**

---

### Step 8: Watch Backend Terminal
Look at **Terminal 1** (backend) - you should see:

```
🔐 Role check: User role = 'data_collector', Required role = 'data_collector'
✅ Role authorized: data_collector
📝 Create Issue Request:
User ID: [a long ID starting with 6...]
User Role: data_collector
✅ Issue created: [MongoDB ID]
```

If you see ✅ - SUCCESS!

---

### Step 9: Check Frontend
After successful submission:
1. You should see an **alert** saying "Issue submitted successfully!"
2. Click OK
3. Scroll down on the page
4. Look for "Submitted Reports" section
5. You should see your issue listed

**If you see it** ✅ Everything works!

---

## ❌ If Still Getting "Access Denied"

### Check Backend Terminal
What does it show?

**Option A**: Shows "❌ No token provided"
```
→ Token is NOT being sent from frontend
→ Clear browser cache again (Step 3)
→ Logout completely and login fresh
```

**Option B**: Shows "❌ Access denied: data_collector !== data_collector"
```
→ Role name mismatch (very unlikely)
→ Check if there's a typo in .env file
→ Verify backend `.env` has: JWT_SECRET=AERA_SECRET_KEY
```

**Option C**: Shows "❌ Invalid or expired token"
```
→ Token is corrupted
→ Clear browser (Step 3)
→ Login fresh
```

### Check Frontend Console (F12 → Console)
Look for any red error messages and copy them

### Check Network Tab (F12 → Network)
1. Click on the red **issues** POST request
2. Go to **Response** tab
3. Copy the error message
4. Share with me

---

## ✅ FINAL VERIFICATION

After successful submission:

**Firefox/Chrome DevTools (F12)**:
- **Network** tab → `POST localhost:5000/api/issues` → Status **201** ✅
- **Response** shows: MongoDB ObjectId

**Backend Terminal**:
- Shows: `✅ Issue created: [ID]`

**Frontend**:
- Issue appears in "Submitted Reports" section

---

## Troubleshooting Checklist

- [ ] Backend running (npm run dev in backend folder)
- [ ] Frontend running (http://localhost:3002 in browser)
- [ ] Local Storage FULLY cleared (all 4 categories)
- [ ] Hard refresh done (Ctrl+Shift+R)
- [ ] New account created with EXACT values
- [ ] Username = testuser
- [ ] Password = testpass123
- [ ] Role = Data Collector (from dropdown, not typed)
- [ ] Logged in successfully (see form)
- [ ] Form filled completely
- [ ] Click "Submit Report" button
- [ ] Watch backend terminal for "✅ Issue created"
- [ ] Look for "Submitted Reports" section on page

---

## If Nothing Works

Run this diagnostic:

**In browser F12 Console**, paste and run:
```javascript
console.log('Token:', localStorage.getItem('token'));
console.log('Role:', localStorage.getItem('userRole'));
console.log('User:', localStorage.getItem('userName'));
```

Copy the output and share with me, along with:
1. What error shows on form submission?
2. What does backend terminal show?
3. What does browser console show (F12 → Console)?

---

**DON'T SKIP STEP 3 - The full browser reset solves 95% of issues!**
