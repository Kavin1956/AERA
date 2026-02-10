# AERA - Quick Start Guide

## 🚀 Get Running in 3 Steps

### Step 1: Install Dependencies
Open PowerShell in `c:\Users\Kavin S\Desktop\AERA` and run:
```bash
npm install
npm run install:all
```

### Step 2: Start Development Servers
```bash
npm run dev
```

You should see:
- ✅ Backend running on http://localhost:5000
- ✅ Frontend running on http://localhost:3002

### Step 3: Open Browser
Go to **http://localhost:3002**

You'll see the **Signup Page** first.

---

## 📋 What Changed

✅ Frontend now connects to **Backend API** (not localStorage)  
✅ **MongoDB database** stores all user & issue data  
✅ **Signup/Login** pages updated to use real backend

---

## 🔧 Backend API Status

Your backend has these endpoints ready:

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login with credentials |
| POST | `/api/issues` | Submit new issue |
| GET | `/api/issues` | View all issues |
| PUT | `/api/issues/:id/assign` | Assign technician |
| PUT | `/api/technician/tasks` | Update task status |

---

## 🗄️ Database

Your project uses **MongoDB Atlas** (Cloud database)

**Connection URL** is already in `backend/.env`:
```
mongodb+srv://kavinselvan1956_db_user:ktiQo51aTDeULmZk@cluster0.b0ll7kz.mongodb.net/aera_db
```

All user accounts & issues are stored in MongoDB (not localStorage anymore!)

---

## ⚠️ If You See Issues

### Frontend goes straight to Manager page?
- Clear browser data: Press F12 → Application → Local Storage → Clear All
- Refresh page

### Backend crashes?
- Make sure MongoDB is reachable (check internet)
- If port 5000 is busy, restart: `cd backend && npm run dev`

### CORS errors?
- Already fixed, but if you change ports, update `backend/server.js`

---

## 🧪 Test the Flow

1. **Signup**: http://localhost:3002/signup
   - Fill form and create account
   - Data saves to MongoDB

2. **Login**: http://localhost:3002/login
   - Login with credentials you just created
   - System assigns you based on role

3. **Submit Issue** (as Data Collector):
   - Multi-step form to report facility issues
   - Saves to MongoDB

4. **Manage Issues** (as Manager):
   - View all submitted issues
   - Assign to technicians

5. **Update Tasks** (as Technician):
   - See assigned tasks
   - Mark as completed

---

## 📁 File Changes Made

**Created:**
- ✅ `frontend/src/services/api.js` - API service layer
- ✅ `frontend/.env` - Frontend config
- ✅ `SETUP_INSTRUCTIONS.md` - Full docs

**Updated:**
- ✅ `frontend/src/pages/Login.js` - Uses backend API
- ✅ `frontend/src/pages/SignUp.js` - Uses backend API
- ✅ `backend/controllers/authController.js` - Error handling
- ✅ `backend/controllers/issueController.js` - Fixed paths
- ✅ `package.json` (root) - Added npm run dev

---

## 🎯 Next Steps

1. Run: `npm run dev`
2. Open: http://localhost:3002
3. Create account → Login → Test workflows
4. Check MongoDB Atlas console to see data being stored

---

**Everything is connected now! 🎉**
