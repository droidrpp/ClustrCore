# 🚀 ClustrCore

### A Full-Stack Club Management Portal for Students & Club Teams

<p align="center">
  <strong>Manage • Collaborate • Organize • Grow</strong>
</p>

<p align="center">
  ClustrCore is a centralized club-management platform that connects students,
  club teams, and administrators through a single web-based portal.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js">
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB">
  <img src="https://img.shields.io/badge/Mongoose-ODM-880000?style=for-the-badge&logo=mongoose&logoColor=white" alt="Mongoose">
  <img src="https://img.shields.io/badge/HTML5-Frontend-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-Styling-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
</p>

---

## 📖 About The Project

**ClustrCore** is a full-stack web application designed to simplify the management of student clubs and their activities.

Student clubs often manage events, registrations, teams, resources, certificates, announcements, and communication through multiple disconnected systems. ClustrCore brings these activities together into one centralized platform.

The platform provides separate experiences for:

- 👨‍🎓 Students
- 👥 Club Teams
- ⚙️ Administrators

The backend is built using **Node.js and Express.js**, while **MongoDB** is used for persistent data storage through **Mongoose**.

The frontend is implemented using **HTML, CSS, and JavaScript** and is served through the Express server.

---

## 🎯 Project Objectives

ClustrCore was developed with the following objectives:

- Create a centralized platform for student club management
- Simplify student registration and authentication
- Manage events and event registrations
- Provide dedicated dashboards for different club teams
- Allow administrators to monitor club activities
- Centralize learning resources
- Provide access to participation certificates
- Support email-based communication and OTP workflows
- Provide resume-generation functionality for students
- Maintain persistent application data using MongoDB
- Keep the backend modular and easy to extend

---

# ✨ Features

## 👨‍🎓 Student Portal

Students can use ClustrCore to manage their club-related activities through a dedicated portal.

### Student Features

- Student registration
- Student login
- Student dashboard
- Event browsing
- Event registration
- Competition information
- Certificate access
- Learning resources
- Resume builder
- Resume generation
- Student-specific information

---

## 👥 Team Portal

ClustrCore provides dedicated dashboards for different club teams.

### Available Team Dashboards

| Team | Purpose |
|---|---|
| 💻 Technical Team | Technical activities and resources |
| 🎪 Events Team | Event planning and management |
| 🎨 Digital Team | Digital and media-related activities |

Each team has a dedicated dashboard while sharing the same backend infrastructure and database.

---

## ⚙️ Admin Dashboard

The administrator can monitor and manage club activities from a centralized dashboard.

### Admin Features

- View club activity
- Manage events
- Monitor registrations
- Manage resources
- Manage team-related information
- Coordinate club activities

---

## 📅 Event Management

The event management module allows the club to organize and manage events through a centralized system.

### Event Features

- Event information
- Event timelines
- Event registration
- Competition information
- Participant registration
- Event-related management

---

## 📚 Resource Management

ClustrCore provides a centralized location for students and club teams to access useful resources.

Resources can be shared and managed through the relevant team and administrative workflows.

---

## 📜 Certificate Management

Students can access certificates associated with their participation in club activities and events.

---

## 📄 Resume Builder

ClustrCore includes a resume-building feature that allows students to generate a resume using information maintained through the platform.

This allows students to consolidate relevant academic and club-related information into a professional resume.

---

## 📧 Email & OTP Workflows

The application supports email-based workflows using an SMTP service.

These include:

- OTP workflows
- Email notifications
- Team communication
- Resource/report-related communication

Email credentials are stored through environment variables rather than directly in the source code.

---

## 🖼️ Image Upload Support

The application supports optional image uploads for supported:

- Team accounts
- Administrator accounts
- Profile/media areas

---

# 🏗️ System Architecture

The following diagram represents the high-level architecture of ClustrCore.

<p align="center">
  <img src="diagram (1).png" alt="ClustrCore System Architecture" width="900">
</p>

### Architecture Overview

```text
                         ┌─────────────────────┐
                         │       Browser       │
                         │                     │
                         │   HTML / CSS / JS   │
                         └──────────┬──────────┘
                                    │
                              HTTP Requests
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Express.js       │
                         │      Backend        │
                         │                     │
                         │  Routes             │
                         │  Controllers        │
                         │  Models             │
                         │  Utilities          │
                         └───────┬───────┬─────┘
                                 │       │
                          Read/Write      │
                                 │       │
                                 ▼       ▼
                       ┌────────────┐  ┌──────────────┐
                       │  MongoDB   │  │ SMTP Service │
                       │  Database  │  │ Email / OTP  │
                       └────────────┘  └──────────────┘
```

---

# 🔄 Application Request Flow

A typical request in ClustrCore follows this flow:

```text
User
 │
 ▼
Browser
 │
 │ HTTP Request
 ▼
Express Server
 │
 ▼
Router
 │
 ▼
Controller
 │
 ▼
Mongoose Model
 │
 ▼
MongoDB
 │
 ▼
Controller
 │
 ▼
HTTP Response
 │
 ▼
Browser
```

This structure separates routing, business logic, database operations, and frontend presentation.

---

# 🧩 Backend Architecture

## `server.js`

`server.js` is the main entry point of the application.

It is responsible for:

- Creating the Express application
- Loading environment variables
- Configuring middleware
- Serving static files
- Registering API routes
- Starting the HTTP server
- Connecting application components

---

## `routes/`

The `routes` directory defines the API endpoints exposed by the backend.

Routes determine which controller should handle an incoming request.

```text
Client Request
      │
      ▼
    Route
      │
      ▼
 Controller
```

---

## `controllers/`

Controllers contain the request-handling and business logic.

They process incoming requests, communicate with models, and return appropriate responses.

```text
Route
  │
  ▼
Controller
  │
  ▼
Model
  │
  ▼
MongoDB
```

---

## `models/`

The `models` directory contains Mongoose models.

Models define the structure of application data and provide the interface through which the backend communicates with MongoDB.

---

## `config/`

The `config` directory contains configuration-related code, including the MongoDB database connection.

---

## `utils/`

The `utils` directory contains reusable helper functions shared across different parts of the backend.

---

## `public/`

The `public` directory contains the frontend files served by Express.

```text
public/
│
├── HTML Pages
├── CSS Files
├── JavaScript Files
└── Images / Static Assets
```

---

# 📂 Project Structure

```text
ClustrCore/
│
├── Backend/
│   │
│   ├── config/
│   │   └── MongoDB connection
│   │
│   ├── controllers/
│   │   └── Request & business logic
│   │
│   ├── models/
│   │   └── Mongoose database models
│   │
│   ├── public/
│   │   ├── HTML pages
│   │   ├── CSS files
│   │   ├── JavaScript files
│   │   └── Images / static assets
│   │
│   ├── routes/
│   │   └── Express API routes
│   │
│   ├── utils/
│   │   └── Shared utility functions
│   │
│   ├── .env
│   ├── package.json
│   └── server.js
│
├── diagram1.png
├── README.md
└── .gitignore
```

---

# 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **HTML5** | Frontend page structure |
| **CSS3** | Styling and layout |
| **JavaScript** | Client-side functionality |
| **Node.js** | Server-side JavaScript runtime |
| **Express.js** | Backend framework and API server |
| **MongoDB** | Persistent data storage |
| **Mongoose** | MongoDB Object Data Modeling |
| **SMTP** | Email and OTP workflows |
| **npm** | Dependency management |
| **Nodemon** | Automatic development server restart |
| **Git** | Version control |
| **GitHub** | Source-code hosting |

---

# 🔌 API Structure

The Express backend organizes APIs according to application functionality.

```text
/api/auth
/api/students
/api/resume
/api/team
/api/otp
/api/events
/api/tech
/api/registrations
/api/digital
/api/studentresources
```

## API Responsibilities

| API Prefix | Responsibility |
|---|---|
| `/api/auth` | Authentication-related operations |
| `/api/students` | Student-related operations |
| `/api/resume` | Resume functionality |
| `/api/team` | Team-related operations |
| `/api/otp` | OTP workflows |
| `/api/events` | Event management |
| `/api/tech` | Technical team functionality |
| `/api/registrations` | Registration management |
| `/api/digital` | Digital team functionality |
| `/api/studentresources` | Student resource management |

---

# 🌐 Main Pages

| Page | URL |
|---|---|
| 🏠 Landing Page | `/` |
| 📝 Sign Up | `/signup.html` |
| 🔐 Login | `/login.html` |
| 👥 Team Portal | `/portal.html` |
| 📅 Events | `/events.html` |
| 📚 Resources | `/resources.html` |
| 📄 Resume Builder | `/resume.html` |
| 🎓 Student Dashboard | `/student-dashboard.html` |
| 💻 Technical Dashboard | `/tech-dashboard.html` |
| 🎪 Events Dashboard | `/events-dashboard.html` |
| 🎨 Digital Dashboard | `/digital-dashboard.html` |
| ⚙️ Admin Dashboard | `/admin-dashboard.html` |

---

# 🗄️ Database

ClustrCore uses **MongoDB** for persistent application data.

**Mongoose** is used as the Object Data Modeling layer between the Express backend and MongoDB.

### Default MongoDB Connection

```text
mongodb://localhost:27017/clustrcore
```

### Database Name

```text
clustrcore
```

### Database Flow

```text
Express Server
      │
      ▼
Controller
      │
      ▼
Mongoose Model
      │
      ▼
MongoDB
```

The application can start even when MongoDB is unavailable, but database-backed functionality will not work until MongoDB is running.

---

# 📧 Email Configuration

Email-based workflows use an SMTP account.

Create a `.env` file inside the `Backend` directory:

```env
PORT=5000
NODE_ENV=development

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password
```

### Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `5000` |
| `NODE_ENV` | Application environment | — |
| `EMAIL_USER` | SMTP account | — |
| `EMAIL_PASS` | SMTP password or app password | — |

> ⚠️ **Never commit `.env` files, passwords, API keys, or other credentials to GitHub.**

---

# ⚙️ Requirements

Before running ClustrCore, make sure the following are installed:

- **Node.js 18 or newer**
- **npm**
- **MongoDB**
- **Git**

MongoDB should be running locally on:

```text
localhost:27017
```

---

# 🚀 Installation & Setup

## 1. Clone the Repository

```bash
git clone https://github.com/droidrpp/clustrcore.git
```

---

## 2. Navigate to the Project

```bash
cd clustrcore
```

Then navigate to the backend:

```bash
cd Backend
```

---

## 3. Install Dependencies

```bash
npm install
```

---

## 4. Configure Environment Variables

Create the following file:

```text
Backend/.env
```

Add:

```env
PORT=5000
NODE_ENV=development

EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password_or_app_password
```

---

## 5. Start MongoDB

Make sure MongoDB is running locally.

The application expects the following default connection:

```text
mongodb://localhost:27017/clustrcore
```

---

## 6. Start the Development Server

```bash
npm run dev
```

Nodemon will automatically restart the server when changes are detected.

---

## 7. Start Without Nodemon

For a normal server start:

```bash
npm start
```

---

## 8. Open the Application

Once the server is running, open:

```text
http://localhost:5000/
```

---

# 🔄 Core User Flows

## Student Flow

```text
Student
   │
   ▼
Sign Up / Login
   │
   ▼
Student Dashboard
   │
   ├── Events
   ├── Registrations
   ├── Competitions
   ├── Certificates
   ├── Resources
   └── Resume
```

---

## Team Flow

```text
Team Member
     │
     ▼
Team Portal
     │
     ├── Technical Dashboard
     │
     ├── Events Dashboard
     │
     └── Digital Dashboard
```

---

## Admin Flow

```text
Admin
  │
  ▼
Admin Dashboard
  │
  ├── Club Activity
  ├── Events
  ├── Teams
  ├── Registrations
  └── Resources
```

---

# 📊 Data Flow

The overall data flow of the application can be represented as:

```text
                    ┌──────────────┐
                    │     User     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Browser    │
                    │ HTML/CSS/JS  │
                    └──────┬───────┘
                           │
                        HTTP/API
                           │
                           ▼
                    ┌──────────────┐
                    │   Express    │
                    │    Server    │
                    └──────┬───────┘
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
           ┌──────────────┐  ┌──────────────┐
           │  Controllers │  │   Utilities  │
           └──────┬───────┘  └──────────────┘
                  │
                  ▼
           ┌──────────────┐
           │   Mongoose   │
           │    Models    │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │   MongoDB    │
           └──────────────┘
```

---

# 📁 Directory Responsibilities

| Directory / File | Responsibility |
|---|---|
| `server.js` | Main application entry point |
| `config/` | Database and application configuration |
| `controllers/` | Request handling and business logic |
| `models/` | Mongoose schemas and database models |
| `routes/` | API endpoint definitions |
| `utils/` | Shared helper functions |
| `public/` | Frontend HTML, CSS, JavaScript and static assets |
| `.env` | Environment-specific configuration |
| `package.json` | Dependencies and npm scripts |

---

# 🔐 Security & Configuration

Sensitive information should not be hard-coded into the application.

Environment variables should be used for:

- Email credentials
- Database credentials
- API keys
- Passwords
- Private configuration

A recommended `.gitignore` should contain:

```gitignore
node_modules/
.env
*.log
```

> **Never upload `.env` or credentials to a public repository.**

---

# 🧪 Development Notes

- Static files are served from `Backend/public`.
- The default Express port is `5000`.
- MongoDB uses port `27017` by default.
- The default database is `clustrcore`.
- The application can start even when MongoDB is unavailable.
- Database-backed features require MongoDB to be running.
- Environment variables are loaded from `Backend/.env`.
- A sample OTP may be printed to the server console during development testing.
- SMTP credentials should be stored only in environment variables.
- Credentials should never be committed to GitHub.

---

# 🐛 Troubleshooting

## MongoDB Connection Error

If database operations are failing, make sure MongoDB is running.

Check the default connection:

```text
mongodb://localhost:27017/clustrcore
```

---

## Port Already in Use

If port `5000` is already occupied, change the port in `.env`:

```env
PORT=5001
```

Then restart the application.

---

## Dependencies Not Found

Run:

```bash
npm install
```

Then restart the server.

---

## Email / OTP Not Working

Check the `.env` configuration:

```env
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_app_password
```

Make sure the SMTP account and credentials are valid.

---

# 📈 Scalability

The current modular architecture makes it possible to extend ClustrCore with additional functionality.

The separation between:

```text
Routes
   ↓
Controllers
   ↓
Models
   ↓
Database
```

allows individual parts of the application to be modified without restructuring the entire system.

The platform can also be extended with additional dashboards, APIs, database models, and integrations as requirements grow.

---

# 🔮 Future Improvements

The following features can be considered for future versions of ClustrCore:

### 🔐 Authentication & Authorization

- JWT-based authentication
- Role-based authorization middleware
- Password reset functionality
- Stronger authentication policies
- Improved input validation

### ☁️ Deployment

- Cloud MongoDB deployment
- Cloud-based image storage
- Production email provider
- HTTPS
- Production environment configuration

### 🧪 Testing

- Unit testing
- Integration testing
- API testing
- Automated test pipelines

### 🚀 DevOps

- Docker containerization
- CI/CD pipeline
- Automated deployment
- Production monitoring

### 📊 Platform Enhancements

- Advanced club analytics
- Attendance management
- Notification system
- Improved event filtering
- Search functionality
- Team performance tracking
- Mobile-friendly improvements

---

# 📸 Architecture Diagram

<p align="center">
  <img src="diagram1.png" alt="ClustrCore Architecture Diagram" width="950">
</p>

---

# 🌐 Repository

The complete source code for ClustrCore is available on GitHub:

**GitHub Repository**

https://github.com/droidrpp/clustrcore

---

# 👩‍💻 Author

## Rajshree Purohit

**B.Tech — Banasthali Vidyapith, Rajasthan**

ClustrCore was developed as a full-stack web development project focused on creating a centralized platform for student club management.

### Contributions

- Full-stack application development
- Express.js backend development
- MongoDB database integration
- Mongoose model integration
- REST API development
- Frontend development using HTML, CSS and JavaScript
- Student portal development
- Team dashboard development
- Admin dashboard development
- Event management workflows
- Registration workflows
- Resource and certificate workflows
- Resume-generation functionality
- Email and OTP integration
- Application architecture and project organization

---

# 📜 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for more information.

---

# ⭐ Support ClustrCore

If you found **ClustrCore** useful, interesting, or helpful, consider giving the repository a **⭐ Star** on GitHub.

Your support helps the project gain visibility and allows others to discover it.

<p align="center">

### ⭐ Star the repository if you like ClustrCore!

<a href="https://github.com/droidrpp/clustrcore">
  <img src="https://img.shields.io/github/stars/droidrpp/clustrcore?style=for-the-badge&logo=github" alt="GitHub Stars">
</a>

</p>

<p align="center">
  <strong>Built with ❤️ for better club management.</strong>
</p>
