# Demo Accounts - Setup Instructions

## Important: Email Restrictions
⚠️ **Manager must signup with email**: `manager@aera.edu`  
(This is enforced in backend - see `backend/.env` MANAGER_EMAIL)

---

## Demo Accounts to Create

### Account 1: Data Collector
**To Create This Account:**
1. Go to http://localhost:3002/signup
2. Fill in:
   - **Full Name**: John Data
   - **Email**: john.data@example.com
   - **Username**: data_collector_1
   - **Password**: demo123456
   - **Confirm Password**: demo123456
   - **Role**: Data Collector (from dropdown)
3. Click "Sign Up"
4. You'll be redirected to Login page
5. Login with username & password above

---

### Account 2: Manager
**To Create This Account:**
1. Go to http://localhost:3002/signup
2. Fill in:
   - **Full Name**: Alice Manager
   - **Email**: manager@aera.edu ← ⚠️ **MUST USE THIS EMAIL**
   - **Username**: manager_alice
   - **Password**: managerpass123
   - **Confirm Password**: managerpass123
   - **Role**: Manager (from dropdown)
3. Click "Sign Up"
4. Go to Login page
5. Login with:
   - **Username**: manager_alice
   - **Password**: managerpass123
   - **Role**: Manager (from dropdown)

---

### Account 3: Technician
**To Create This Account:**
1. Go to http://localhost:3002/signup
2. Fill in:
   - **Full Name**: Bob Technician
   - **Email**: bob.tech@example.com
   - **Username**: tech_bob
   - **Password**: techpass123
   - **Confirm Password**: techpass123
   - **Role**: Technician (from dropdown)
3. Click "Sign Up"
4. Go to Login page
5. Login with:
   - **Username**: tech_bob
   - **Password**: techpass123
   - **Role**: Technician (from dropdown)

---

## Quick Reference Table

| Role | Username | Password | Email | 
|------|----------|----------|-------|
| Data Collector | data_collector_1 | demo123456 | john.data@example.com |
| Manager | manager_alice | managerpass123 | **manager@aera.edu** ⚠️ |
| Technician | tech_bob | techpass123 | bob.tech@example.com |

---

## Testing Workflow

### Step 1: Create Accounts
Follow the signup steps above for all 3 roles

### Step 2: Data Collector - Submit Issue
1. Login as **data_collector_1** / **demo123456**
2. Fill out the 4-step form
3. Submit an issue
4. **Expected**: Issue appears in "Submitted Reports" panel on the same page
5. **Verify**: Issue saved in Manager dashboard

### Step 3: Manager - View & Assign
1. **Logout** from Data Collector
2. Login as **manager_alice** / **managerpass123** (Role: Manager)
3. Should see dashboard with stats
4. Go to "Current Issues" tab
5. Should see the issue submitted by Data Collector
6. Click "View" button
7. Select a technician type (e.g., "Electricity")
8. Click "Assign to Technician"
9. **Expected**: Issue moves to "Assigned" status

### Step 4: Technician - View Tasks
1. **Logout** from Manager
2. Login as **tech_bob** / **techpass123** (Role: Technician)
3. Should see assigned tasks
4. Click "View Details"
5. Update task status to "Completed"
6. Add update notes
7. Click "Update Task"

---

## Troubleshooting

### Issue: "Unauthorized manager email" error during signup
**Solution**: You must signup with email `manager@aera.edu` for Manager role. Other emails will be rejected.

### Issue: Manager page not opening / blank page
**Solution**: 
1. Clear browser cache: F12 → Application → Clear All
2. Refresh the page
3. Make sure backend is running: `npm run dev` in backend folder
4. Check browser console for errors

### Issue: Submitted issues not showing in Data Collector page
**Solution**:
1. Refresh the page (F5)
2. Make sure you're logged in as the Data Collector who submitted the issue
3. Check browser DevTools (F12) → Network tab → see if GET /api/issues is returning data
4. Check MongoDB Atlas to confirm issues exist in database

### Issue: Login fails with wrong backend
**Solution**: Make sure `frontend/.env` has correct API URL:
```
REACT_APP_API_URL=http://localhost:5000/api
```
And restart frontend: `npm start` in frontend folder

---

## Database Verification

To confirm accounts & issues are saved in MongoDB:

1. Go to https://cloud.mongodb.com
2. Login with your MongoDB Atlas account
3. Go to your cluster → Database
4. Browse Collections:
   - **users** → Should show 3 documents (Data Collector, Manager, Technician)
   - **issues** → Should show submitted issues with timestamps

---

## Create Accounts Now!

✅ Follow the three signup steps above  
✅ Then test the workflow  
✅ All data saves to MongoDB automatically

**Start here**: http://localhost:3002/signup
