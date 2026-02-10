# Academic Environmental Risk Analyzer - Frontend

A comprehensive React-based frontend for the Academic Environmental Risk Analyzer (AERA) system.

## Project Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── pages/
│   │   ├── Login.js
│   │   ├── DataCollector.js
│   │   ├── Manager.js
│   │   └── Technician.js
│   ├── components/
│   │   └── Navbar.js
│   ├── styles/
│   │   ├── index.css
│   │   ├── App.css
│   │   ├── Login.css
│   │   ├── Navbar.css
│   │   ├── DataCollector.css
│   │   ├── Manager.css
│   │   └── Technician.css
│   ├── App.js
│   └── index.js
├── package.json
└── README.md
```

## Features

### 1. Login Page
- Username and password authentication
- Role-based login (Data Collector, Manager, Technician)
- Demo credentials for testing
- Responsive design with gradient background

### 2. Data Collector Page
- Three-step form for environmental data collection
- User type selection (Student, Faculty, Data Collector)
- Location type selection (Classroom, Lab, Seminar Hall)
- Dynamic form fields based on selections
- Detailed environmental condition tracking
- Real-time issue submission tracking

### 3. Manager Dashboard
- View all submitted environmental issues
- Filter by status (Submitted, Analyzed, Assigned)
- Dashboard statistics
- Analyze and prioritize issues
- Assign issues to technicians
- Modal view for detailed issue analysis

### 4. Technician Dashboard
- View assigned tasks
- Filter by status (Assigned, In Progress, Completed)
- Update task progress with detailed notes
- Mark tasks as completed
- Track task timeline and history

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The application will open at `http://localhost:3000`

## Available Scripts

- `npm start` - Run the development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from create-react-app

## Technologies Used

- **React 18.2.0** - UI framework
- **React Router DOM 6.8.0** - Client-side routing
- **Axios 1.3.0** - HTTP client
- **React Icons 4.7.1** - Icon library

## Demo Credentials

- **Username:** demo
- **Password:** demo123
- **Role:** Select from dropdown (Data Collector, Manager, Technician)

## Color Scheme

- **Primary:** #2c3e50 (Dark Blue)
- **Secondary:** #3498db (Light Blue)
- **Accent:** #e74c3c (Red)
- **Success:** #27ae60 (Green)
- **Warning:** #f39c12 (Orange)

## Form Fields by Location Type

### Classroom
- AC Status
- Whiteboard Condition
- Temperature
- Projector Availability & Status
- PC System Availability & Status
- Issues/Notes

### Laboratory
- AC Status
- Water Supply Status
- Projector Availability & Status
- Temperature
- Systems/PC Availability & Status
- Seats Availability
- Issues/Notes

### Seminar Hall
- AC Status
- Seating Capacity
- Current Occupancy
- Temperature
- Sound System Status
- Projector Availability & Status
- Issues/Notes

## Data Flow

1. **Data Collector** submits environmental issues through the multi-step form
2. **Manager** reviews submitted issues and analyzes them
3. **Manager** assigns analyzed issues to **Technician**
4. **Technician** updates task status and provides progress notes
5. Issues are tracked through the workflow

## Responsive Design

The application is fully responsive and optimized for:
- Desktop (1200px and above)
- Tablet (768px - 1199px)
- Mobile (480px - 767px)
- Small Mobile (below 480px)

## Notes

- Local storage is used for authentication state (in development)
- Backend integration ready for API calls
- All form data is currently stored in component state
- Modal-based detailed views for better UX

## Future Enhancements

- Real backend API integration
- Advanced filtering and search
- Report generation and export
- Email notifications
- File attachments for issues
- User management dashboard
- Analytics and insights dashboard

---

**AERA - Academic Environmental Risk Analyzer**
Version 1.0.0
