# Quick Fix: "Access Denied" Error

## 1️⃣ Stop Everything
Press `Ctrl+C` in all terminal windows

---

## 2️⃣ Restart Backend Fresh
```bash
cd backend
npm run dev
```

**Wait for this output:**
```
✅ Backend running on port 5000
✅ MongoDB Connected
```

---

## 3️⃣ Restart Frontend Fresh (New Terminal)
```bash
cd frontend
npm start
```

**Wait until browser opens at http://localhost:3002**

---

## 4️⃣ Clear Browser Completely
1. Press `F12` (DevTools)
2. Go to **Application** tab (or **Storage**)
3. **Local Storage** → right-click → **Clear All**
4. **Cookies** → right-click → **Clear All**
5. Close DevTools
6. Refresh page (`Ctrl+R` or `Cmd+R`)

---

## 5️⃣ Create Fresh Account
Go to **http://localhost:3002/signup**

Fill in:
- **Full Name**: John Demo
- **Email**: john@demo.com
- **Username**: demo_user
- **Password**: demo123456
- **Confirm Password**: demo123456
- **Role**: Data Collector

Click **Sign Up** → You'll go to Login page

---

## 6️⃣ Login
**http://localhost:3002/login**

Login with:
- **Username**: demo_user
- **Password**: demo123456
- **Role**: Data Collector (from dropdown)

Click **Login**

---

## 7️⃣ Submit Issue
You should now see the Data Collector form

1. Complete all 4 steps of the form
2. Click **Submit Report**
3. **Watch the backend terminal** - you should see:

```
🔐 Role check: User role = 'data_collector', Required role = 'data_collector'
✅ Role authorized: data_collector
📝 Create Issue Request:
User ID: [something]
User Role: data_collector
✅ Issue created: [Database ID]
```

4. **Issue should appear** in "Submitted Reports" section below the form

---

## 8️⃣ If Still Getting Error
Check the **Backend Terminal** and tell me what you see:
- Is it showing "❌ No token"? 
- Is it showing "❌ Access denied"?
- Is it showing something else?

Copy the exact error from the backend and share it.

---

## ✅ If It Works
Congratulations! All data is now saving to MongoDB. Try:
1. Logout (click Logout button)
2. Login as Manager (use email `manager@aera.edu`)
3. You should see submitted issues in Manager Dashboard

---

**Don't skip the "Clear Browser" step - that's often the issue!**
