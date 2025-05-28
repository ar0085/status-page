# Status Page Application

A multi-tenant status page application inspired by GitHub's status page design. Built with FastAPI, React, and real-time WebSocket updates.

![Status Page Preview](https://via.placeholder.com/800x400?text=Status+Page+Preview)

## 🌟 Features

- **Multi-tenant Architecture**: Complete data isolation by organization
- **GitHub-inspired Design**: Clean, minimal UI matching GitHub's status page
- **Real-time Updates**: WebSocket-powered live status changes
- **Admin Dashboard**: Manage services, incidents, and organization settings
- **Public Status Pages**: Accessible via unique URLs (`/status/{org-slug}`)
- **Authentication**: Clerk integration for user management
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Type Safety**: End-to-end TypeScript coverage

## 🏗️ Architecture

### Backend (FastAPI)

- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: Clerk JWT verification
- **Real-time**: Socket.IO for WebSocket communication
- **API**: RESTful endpoints with automatic OpenAPI docs
- **Multi-tenancy**: Organization-scoped data access

### Frontend (React + TypeScript)

- **Framework**: React 18 with TypeScript
- **Styling**: TailwindCSS + ShadcnUI components
- **State Management**: TanStack Query for server state
- **Real-time**: Socket.IO client for live updates
- **Authentication**: Clerk React components

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL database

### 1. Clone and Setup

```bash
git clone <repository-url>
cd status-page
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload
```

The backend will be available at:

- **API**: http://localhost:8000
- **Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your Clerk credentials

# Start the development server
npm run dev
```

The frontend will be available at:

- **App**: http://localhost:5173
- **Dashboard**: http://localhost:5173/dashboard/services

### 4. Create Demo Data

To quickly test the application with sample data like the GitHub example:

```bash
# Install demo dependencies
pip install aiohttp

# Run the demo setup script
python demo_setup.py
```

This creates:

- **GitHub Inc** organization with services like "Git Operations", "API Requests", etc.
- **Acme Corp** organization with typical business services
- Sample status data for testing

## 📱 Usage

### Public Status Pages

Visit status pages using organization slugs:

- http://localhost:5173/status/github
- http://localhost:5173/status/acme

### Admin Dashboard

Manage your organization's services:

1. Visit http://localhost:5173/dashboard/services
2. Create, update, and delete services
3. Change service statuses in real-time
4. View all services in a clean table interface

### API Endpoints

#### Public Endpoints (No Auth)

```bash
# Get complete status page for an organization
GET /api/status/{org_slug}

# Get services for an organization
GET /api/status/{org_slug}/services

# Get incidents for an organization
GET /api/status/{org_slug}/incidents
```

#### Protected Endpoints (Auth Required)

```bash
# Service management
GET    /api/services
POST   /api/services
PUT    /api/services/{id}
DELETE /api/services/{id}

# Incident management
GET    /api/incidents
POST   /api/incidents
PUT    /api/incidents/{id}

# Organization management
GET    /api/organizations/current
POST   /api/organizations
```

## 🎨 Design System

The application uses a design system inspired by GitHub's status page:

### Colors

- **Operational**: Green (`#22c55e`)
- **Degraded**: Yellow (`#eab308`)
- **Partial Outage**: Orange (`#f97316`)
- **Major Outage**: Red (`#ef4444`)

### Components

- Clean header with navigation links
- Prominent status banner (green when all operational)
- Grid layout for service status cards
- Responsive design with proper spacing
- Subtle hover effects and transitions

### Typography

- Clear hierarchy with proper font weights
- Consistent spacing and alignment
- Good contrast ratios for accessibility

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost/statuspage
# or individual components:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=statuspage

# Authentication
JWT_SECRET=your-secret-key
CLERK_SECRET_KEY=your-clerk-secret
```

#### Frontend (.env)

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key

# API Configuration
VITE_API_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:8000
```

## 🚀 Deployment

### Backend Deployment (Heroku/Render)

1. Set environment variables
2. Configure PostgreSQL database
3. Run migrations: `alembic upgrade head`
4. Deploy with: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment (Vercel/Netlify)

1. Set environment variables
2. Build: `npm run build`
3. Deploy the `dist` folder

## 🧪 Testing

### API Testing

```bash
# Test backend health
curl http://localhost:8000/health

# Test public status page
curl http://localhost:8000/api/status/github
```

### Load Testing

```bash
# Install dependencies
pip install locust

# Run load tests (create load_test.py)
locust -f load_test.py
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if needed
5. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🐛 Troubleshooting

### Common Issues

1. **Backend won't start**: Check PostgreSQL connection and database exists
2. **Frontend auth errors**: Verify Clerk credentials in .env
3. **WebSocket connection fails**: Ensure backend is running and ports are correct
4. **Database migration errors**: Run `alembic upgrade head` manually

### Debug Mode

Enable debug logging:

```bash
# Backend
export LOG_LEVEL=DEBUG

# Frontend
export VITE_DEBUG=true
```

## 📚 Documentation

- [API Documentation](http://localhost:8000/docs) - Interactive OpenAPI docs
- [Frontend Components](./frontend/src/components/) - React component library
- [Database Schema](./backend/app/models/) - SQLAlchemy models
- [Authentication Guide](./docs/auth.md) - Clerk integration guide

---

Built with ❤️ using FastAPI, React, and modern web technologies.
