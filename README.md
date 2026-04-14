# GigShield - AI-Powered Parametric Insurance Platform

GigShield is a full-stack parametric insurance platform designed for gig workers. It uses real-time weather and air quality data to automatically trigger insurance claims and provide risk assessments.

## Project Structure

```text
guidewire_insurance/
├── frontend/           # React + Vite application
│    ├── src/
│    ├── public/
│    └── package.json
└── backend/            # Node.js + Express backend
     ├── routes/        # API Endpoints (Risk & Claims)
     ├── ml/            # Weighted Risk Model logic
     ├── server.js      # Express server entry point
     └── package.json
```

## Features

- **Full-Stack Architecture**: Clean separation between React frontend and Express backend.
- **AI Risk Calculation**: Backend-powered risk score based on Rainfall, AQI, and Temperature.
- **Automated Claims Trigger**: Server-side logic to approve/reject claims based on environmental thresholds.
- **Real-Time Dashboards**: Interactive UI for workers and admins with backend integration.

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```
   The backend will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on the default Vite port (usually `http://localhost:5173`).

## Environment Variables

Check `.env.example` in the root directory for required environment variables.

- `PORT`: Backend server port (defaults to 5000).
- `OPENWEATHER_API_KEY`: Key for weather data (optional, mock fallback exists).
- `MONGO_URI`: MongoDB connection string (future persistence).

## API Documentation

### 1. Risk Calculation
- **POST** `/calculate-risk`
- **Input**: `{ rain, aqi, temp }`
- **Logic**: `0.4*rain + 0.3*aqi + 0.3*temp`

### 2. Claim Trigger
- **POST** `/create-claim`
- **Input**: `{ rain, aqi, temp }`
- **Logic**: Approved if `rain > 50` OR `aqi > 200` OR `temp > 40`.
