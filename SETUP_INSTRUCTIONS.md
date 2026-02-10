# AERA (Academic Environmental Risk Analyzer) - Setup & Run Instructions

## Overview
- **Backend**: Node.js + Express + MongoDB
- **Frontend**: React with React Router
- **Database**: MongoDB Atlas (Cloud)
- **Port**: Backend runs on 5000, Frontend runs on 3002

---

## Prerequisites

Ensure you have installed:
1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **MongoDB Atlas Account** - [Sign up free](https://www.mongodb.com/cloud/atlas)
3. **Git** (optional)

---

## Step 1: MongoDB Setup (Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up / Login
3. Create a **New Project** named `AERA`
4. Create a **Cluster** (free tier is fine)
5. Go to **Connect** and copy the connection string
6. Replace `<password>` with your database password
7. Update `backend/.env` with your connection string:

```env
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/aera_db?retryWrites=true&w=majority
```

**Current .env already has a configured MongoDB Atlas URL** - verify it's working or replace with your own.

---

## Step 2: Install All Dependencies

From the **workspace root** (`c:\Users\Kavin S\Desktop\AERA`), run:

```bash
npm install
npm run install:all
```

This installs:
- Root dependencies (concurrently)
- Backend dependencies (Express, Mongoose, JWT, bcrypt, CORS)
- Frontend dependencies (React, React Router, Axios)

---

## Step 3: Start Both Servers (Development Mode)

From the **workspace root**, run:

```bash
npm run dev
```

This starts BOTH backend and frontend concurrently:
- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3002

### Alternative: Run Separately (if needed)

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

---

## Step 4: Access the Application

1. Open browser → **http://localhost:3002**
2. You should see the **Signup Page** first
3. If not, clear browser localStorage: Press F12 → Application → Local Storage → Clear All

### Demo Credentials (if added to backend):
- **Username**: demo
- **Password**: demo123
- **Role**: Choose from Dropdown

---

## User Roles & Workflows

### 1. **Data Collector**
- Submits facility condition reports
- Select user type (Student/Faculty/Data Collector)
- Enter location & condition details
- System calculates priority & assigns technician type

### 2. **Manager**
- Reviews all submitted issues
- Assigns technicians based on issue type
- Monitors progress with analytics
- Marks issues as complete

### 3. **Technician**
- Views assigned tasks
- Updates task status (In Progress → Completed)
- Adds notes on work completed

---

## Project Structure

```
AERA/
├── backend/
│   ├── config/db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js        # Login/Register logic
│   │   ├── issueController.js       # Issue management
│   │   └── technicianController.js  # Task assignment
│   ├── middleware/
│   │   ├── authMiddleware.js        # JWT validation
│   │   └── roleMiddleware.js        # Role-based access
│   ├── models/
│   │   ├── User.js                  # User schema
│   │   └── issue.js                 # Issue schema
│   ├── routes/
│   │   ├── authRoutes.js            # POST /auth/register, /auth/login
│   │   ├── issueRoutes.js           # Issue endpoints
│   │   └── technicianRoutes.js      # Task endpoints
│   ├── .env                         # Database & JWT config
│   ├── server.js                    # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js             # User login
│   │   │   ├── SignUp.js            # User registration
│   │   │   ├── DataCollector.js     # Issue submission form
│   │   │   ├── Manager.js           # Issue management dashboard
│   │   │   └── Technician.js        # Task assignment dashboard
│   │   ├── components/
│   │   │   └── Navbar.js            # Navigation bar
│   │   ├── services/
│   │   │   └── api.js               # Axios API calls
│   │   ├── styles/                  # CSS files
│   │   ├── App.js                   # Main router
│   │   └── index.js                 # React entry
│   ├── .env                         # Frontend config (PORT, API_URL)
│   ├── package.json
│   └── public/index.html
│
├── package.json                     # Root scripts (npm run dev, install:all)
└── README.md                        # This file
```

---

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new user
- `POST /api/auth/login` - Login user (returns JWT token)

### Issues (Protected)
- `POST /api/issues` - Submit new issue (Data Collector)
- `GET /api/issues` - Get all issues (Manager)
- `PUT /api/issues/:id/assign` - Assign technician (Manager)
- `PUT /api/issues/:id/complete` - Mark complete (Technician)

### Technician Tasks (Protected)
- `GET /api/technician/tasks` - Get assigned tasks
- `PUT /api/technician/tasks/:id` - Update task status

---

## Common Issues & Solutions

### Issue 1: nodemon crash / Backend won't start
**Solution:**
```bash
# Check if port 5000 is already in use
netstat -ano | findstr :5000

# Kill the process if needed
taskkill /PID <PID> /F

# Restart backend
cd backend && npm run dev
```

### Issue 2: Frontend shows Manager page instead of Signup
**Solution:**
- Clear browser localStorage: F12 → Application → Local Storage → Clear All
- Refresh the page

### Issue 3: MongoDB connection fails
**Verify:**
- Check internet connection
- Confirm `MONGO_URI` in `backend/.env`
- Ensure your IP is whitelisted in MongoDB Atlas (Network Access)
- Test connection: Try connecting from MongoDB Compass with the URI

**DNS SRV / SSL (common in restricted networks):**
- If you see an error like `querySrv ECONNREFUSED _mongodb._tcp...` then DNS SRV lookups are blocked on your network (this is required for `mongodb+srv://` URIs).
- Solutions:
  - Switch system DNS to 8.8.8.8 (Google) or 1.1.1.1 (Cloudflare)
  - Obtain the **Standard connection string** from Atlas (non-`+srv`) and set it as `MONGO_FALLBACK_URI` in `backend/.env`.
  - For local development, you can use a local MongoDB URI: `mongodb://localhost:27017/aera`

### Issue 4: CORS errors when frontend calls backend
**Already fixed:** Backend has CORS enabled for `http://localhost:3002`

If you move frontend port, update `backend/server.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:YOUR_PORT',  // Change port here
  credentials: true
}));
```

---

## Running Tests

### Backend Test:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"demo","password":"demo123","role":"data_collector"}'
```

### Frontend Test:
Open http://localhost:3002 → Try signing up with new user → Login

---

## Environment Variables

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/aera_db
JWT_SECRET=AERA_SECRET_KEY
MANAGER_EMAIL=manager@aera.edu
```

### Frontend (`frontend/.env`)
```env
PORT=3002
REACT_APP_API_URL=http://localhost:5000/api
```

---

## Deployment

### For Production:
1. Build frontend: `cd frontend && npm run build`
2. Deploy backend to Heroku/AWS/DigitalOcean
3. Update `REACT_APP_API_URL` to production backend URL
4. Deploy frontend to Netlify/Vercel

---

## Troubleshooting Commands

```bash
# Check Node version
node --version

# Check npm version
npm --version

# Reinstall dependencies (if issues)
rm -r node_modules package-lock.json
npm install
npm run install:all

# Check if ports are free
netstat -ano | findstr :5000
netstat -ano | findstr :3002

# Clear npm cache
npm cache clean --force
```

---

## Support

For issues:
1. Check terminal error messages
2. Verify all `.env` files are set correctly
3. Ensure MongoDB Atlas is accessible
4. Check that ports 5000 and 3002 are not in use

---

**Last Updated:** February 6, 2026
