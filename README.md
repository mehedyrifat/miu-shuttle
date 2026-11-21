# MIU Shuttle

**A Smart University Shuttle Management & Seat Reservation System**

MIU Shuttle is a web-based shuttle management platform developed for **Manarat International University (MIU)**. It is designed to simplify university transportation by providing digital user verification, bus information, seat reservations, and centralized administrative management.

## Key Features

### User Panel
- User Registration and Login
- Firebase Authentication
- Student, Faculty, and Staff Registration
- Mandatory University ID Card Verification
- User Profile Management
- Bus and Route Information
- Seat Selection and Reservation
- Extra Bus Requests
- Notices and Announcements

### Admin Panel
- Admin Authentication
- Dashboard Management
- Bus Management
- Notice Management
- Extra Bus Request Management
- University ID Verification
- Approve or Reject Verification Requests

### Security & Storage
- Firebase Authentication
- Protected API Routes
- Role-based Access Management
- Cloudinary Image Storage
- MongoDB Database
- Environment-based Configuration

## Technology Stack

| Category | Technologies |
|---|---|
| Frontend | React.js, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Authentication | Firebase Authentication |
| Image Storage | Cloudinary |
| API Communication | Axios |
| Real-time Communication | Socket.IO |
| Icons | Lucide React |

## Project Structure

```text
MIU-Shuttle/
│
├── client/              # Student/User Frontend
│
├── admin-client/        # Admin Dashboard
│
├── server/              # Backend API
│
└── README.md
```

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/mehedyrifat/miu-shuttle.git
cd miu-shuttle
```

### 2. Backend Setup

```bash
cd server
npm install
```

Configure the required environment variables in the `server/.env` file.

### 3. Student Frontend Setup

```bash
cd client
npm install
```

### 4. Admin Frontend Setup

```bash
cd admin-client
npm install
```

Configure the environment variables for each application before running the project.

## Environment Configuration

Add the required environment variables for:

- MongoDB connection
- Firebase configuration
- Firebase Admin SDK
- Cloudinary configuration
- Backend API URL

**Important:** Never commit `.env` files, API secrets, database credentials, or private keys to GitHub.

## User Verification Workflow

```text
User Registration
       |
       v
University ID Card Upload
       |
       v
Admin Verification (Pending)
       |
       +-------------------+
       |                   |
       v                   v
    Approved            Rejected
       |                   |
       v                   v
Shuttle Features       Resubmission
     Access
```

## Project Information

**Project Name:** MIU Shuttle

**Institution:** Manarat International University

**Project Type:** Full-Stack Web Application

**Repository:** https://github.com/mehedyrifat/miu-shuttle

---

Developed as a university transportation management solution for Manarat International University.
