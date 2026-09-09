# ClustrCore

ClustrCore is a club-management portal for students and club teams. It combines a
static web interface with an Express API and MongoDB persistence.

## Features

- Public landing page with events, announcements, gallery highlights, collaborators,
  and team/faculty information
- Student signup, login, dashboard, event registration, competitions, certificates,
  resources, and resume generation
- Team portal with separate Technical, Events, and Digital dashboards
- Admin dashboard for viewing club activity
- Event timelines and event registration
- Email-based team workflows and resource/report management
- Optional image uploads for team and admin accounts

## Project structure

```text
ClustrCore/
└── Backend/
    ├── config/          MongoDB connection
    ├── controllers/     Request/controller logic
    ├── models/          Mongoose models
    ├── public/          HTML, CSS, and browser JavaScript
    ├── routes/          Express API routes
    ├── utils/           Shared utilities
    ├── package.json
    └── server.js        Application entry point
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally on the default port (`27017`)

## Getting started

From the `Backend` directory:

```powershell
npm install
npm run dev
```

For a normal start without automatic restarts:

```powershell
npm start
```

The server listens on [http://localhost:5000](http://localhost:5000). Open the
landing page at [http://localhost:5000/](http://localhost:5000/).

## Configuration

The application loads environment variables from `Backend/.env`. The MongoDB
connection currently defaults to:

```text
mongodb://localhost:27017/clustrcore
```

Supported variables include:

| Variable | Purpose |
| --- | --- |
| `PORT` | HTTP port; defaults to `5000` |
| `NODE_ENV` | Enables development error details when set to `development` |
| `EMAIL_USER` | SMTP account used for email workflows |
| `EMAIL_PASS` | SMTP password or app password |

Do not commit `.env` or credentials to source control.

## Main pages

| Page | URL |
| --- | --- |
| Landing page | `/` |
| Sign up | `/signup.html` |
| Login | `/login.html` |
| Team portal | `/portal.html` |
| Events | `/events.html` |
| Resources | `/resources.html` |
| Resume builder | `/resume.html` |
| Student dashboard | `/student-dashboard.html` |
| Technical dashboard | `/tech-dashboard.html` |
| Events dashboard | `/events-dashboard.html` |
| Digital dashboard | `/digital-dashboard.html` |
| Admin dashboard | `/admin-dashboard.html` |

## API areas

The Express API is grouped under these prefixes:

`/api/auth`, `/api/students`, `/api/resume`, `/api/team`, `/api/otp`,
`/api/events`, `/api/tech`, `/api/registrations`, `/api/digital`, and
`/api/studentresources`.

## Development notes

- Static files are served from `Backend/public`.
- The server can start when MongoDB is unavailable, but database-backed features
  will not work until MongoDB is running.
- A sample OTP is printed to the server console during startup for development
  testing.
