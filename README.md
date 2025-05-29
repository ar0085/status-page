# 🚀 Multi-Tenant Status Page Application

A production-ready, multi-tenant status page application inspired by GitHub's status page design. Built with modern technologies and deployed on Render with real-time WebSocket updates, comprehensive admin dashboard, and public status pages.

## 🌐 **Live Demo & Production Links**

| Service                       | URL                                                                                                          | Description                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------- |
| **🎯 Production Frontend**    | [https://status-page-frontend.onrender.com](https://status-page-frontend.onrender.com)                       | Main application interface |
| **🔗 Production Backend API** | [https://status-page-backend-cx26.onrender.com](https://status-page-backend-cx26.onrender.com)               | RESTful API server         |
| **📚 API Documentation**      | [https://status-page-backend-cx26.onrender.com/docs](https://status-page-backend-cx26.onrender.com/docs)     | Interactive OpenAPI docs   |
| **💚 Health Check**           | [https://status-page-backend-cx26.onrender.com/health](https://status-page-backend-cx26.onrender.com/health) | Service health status      |

### 📖 **Example Status Pages**

- **Demo Organization**: [https://status-page-frontend.onrender.com/status/demo-org](https://status-page-frontend.onrender.com/status/demo-org)
- **Admin Dashboard**: [https://status-page-frontend.onrender.com/dashboard/services](https://status-page-frontend.onrender.com/dashboard/services)

---

## 🏗️ **Architecture Overview**

### **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │◄──►│  FastAPI Backend │◄──►│  PostgreSQL DB   │
│                 │    │                 │    │                 │
│  • React 18     │    │  • FastAPI      │    │  • Multi-tenant │
│  • TypeScript   │    │  • SQLAlchemy   │    │  • Organizations │
│  • TailwindCSS  │    │  • Socket.IO    │    │  • Services      │
│  • TanStack     │    │  • Clerk Auth   │    │  • Incidents     │
│  • Socket.IO    │    │  • WebSockets   │    │  • Team Members  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └──────────────►│  Render Cloud   │◄─────────────┘
                        │                 │
                        │  • Auto Deploy  │
                        │  • SSL/HTTPS    │
                        │  • Custom Domains│
                        │  • Environment   │
                        └─────────────────┘
```

### **Multi-Tenant Data Flow**

```
User Login (Clerk) → Organization Detection → Scoped Database Access → Real-time Updates
     │                       │                        │                      │
     │                       │                        │                      │
   JWT Token            Organization ID         Filtered Queries       WebSocket Events
     │                       │                        │                      │
     └─── Authentication ────┴──── Data Isolation ───┴──── Live Updates ────┘
```

---

## 💻 **Technology Stack**

### **Frontend Technologies**

| Technology           | Version | Purpose                                |
| -------------------- | ------- | -------------------------------------- |
| **React**            | 18.2+   | User interface library                 |
| **TypeScript**       | 5.0+    | Type safety and development experience |
| **Vite**             | 4.4+    | Build tool and development server      |
| **TailwindCSS**      | 3.3+    | Utility-first CSS framework            |
| **Shadcn/UI**        | Latest  | Pre-built component library            |
| **TanStack Query**   | 4.0+    | Server state management                |
| **React Router**     | 6.0+    | Client-side routing                    |
| **Socket.IO Client** | 4.7+    | Real-time WebSocket communication      |
| **Clerk**            | Latest  | Authentication and user management     |
| **Lucide React**     | Latest  | Icon library                           |

### **Backend Technologies**

| Technology      | Version | Purpose                           |
| --------------- | ------- | --------------------------------- |
| **FastAPI**     | 0.100+  | Modern Python web framework       |
| **SQLAlchemy**  | 2.0+    | ORM and database toolkit          |
| **Alembic**     | 1.11+   | Database migration tool           |
| **PostgreSQL**  | 14+     | Primary database                  |
| **Socket.IO**   | 5.8+    | Real-time WebSocket server        |
| **Pydantic**    | 2.0+    | Data validation and serialization |
| **Python-Jose** | 3.3+    | JWT token handling                |
| **Clerk SDK**   | Latest  | Authentication verification       |
| **Uvicorn**     | 0.23+   | ASGI server                       |

### **Infrastructure & Deployment**

| Service              | Provider          | Purpose                                 |
| -------------------- | ----------------- | --------------------------------------- |
| **Frontend Hosting** | Render            | Static site deployment with auto-deploy |
| **Backend Hosting**  | Render            | Web service with auto-scaling           |
| **Database**         | Render PostgreSQL | Managed database with backups           |
| **Authentication**   | Clerk             | User authentication and management      |
| **Domain & SSL**     | Render            | HTTPS and custom domain support         |
| **Version Control**  | GitHub            | Source code management and CI/CD        |

---

## 🌟 **Core Features & Capabilities**

### **🔐 Multi-Tenant Architecture**

- **Complete data isolation** between organizations
- **Organization-scoped access** to all resources
- **Team member management** with role-based permissions
- **Invitation system** for adding team members

### **📊 Status Page Management**

- **Public status pages** accessible via unique URLs (`/status/{org-slug}`)
- **Real-time status updates** without page refresh
- **Service status tracking** (Operational, Degraded, Partial Outage, Major Outage)
- **Incident management** with affected services
- **Scheduled maintenance** notifications

### **⚡ Real-Time Features**

- **Live WebSocket updates** for all status changes
- **Connection indicator** showing live status
- **Automatic page refresh** when data changes
- **Multi-device synchronization**

### **🎛️ Admin Dashboard**

- **Service management** (Create, Read, Update, Delete)
- **Incident tracking** and resolution workflow
- **Maintenance scheduling** and management
- **Team member administration**
- **Organization settings** and configuration

### **🔒 Security & Authentication**

- **Clerk integration** for secure authentication
- **JWT-based API access** with automatic token refresh
- **Organization-scoped permissions**
- **CORS protection** for cross-origin requests

---

## 🛣️ **Application Routes & Endpoints**

### **Frontend Routes (React Router)**

#### **Public Routes** (No Authentication Required)

```
GET  /status/{org-slug}           → Public status page for organization
GET  /accept-invitation           → Accept team invitation page
GET  /                           → Landing page / organization selection
```

#### **Protected Routes** (Authentication Required)

```
GET  /dashboard/services         → Service management dashboard
GET  /dashboard/incidents        → Incident management dashboard
GET  /dashboard/maintenance      → Maintenance scheduling dashboard
GET  /dashboard/team            → Team member management
GET  /dashboard/organization    → Organization settings
```

#### **Special Routes**

```
GET  /sign-in                   → Clerk authentication
GET  /sign-up                   → User registration
GET  /websocket-test           → WebSocket connection testing
```

### **Backend API Endpoints (FastAPI)**

#### **🌐 Public Endpoints** (No Authentication)

```http
# Organization Status Data
GET  /api/status/{org_slug}                    → Complete status page data
GET  /api/status/{org_slug}/services           → Public service list
GET  /api/status/{org_slug}/incidents          → Public incident list
GET  /api/status/{org_slug}/maintenance        → Public maintenance list
GET  /api/status/{org_slug}/timeline           → Recent activity timeline

# System Health
GET  /                                         → API root message
GET  /health                                   → Health check with DB status
```

#### **🔒 Protected Endpoints** (Authentication Required)

**Service Management**

```http
GET    /api/services                           → List organization services
POST   /api/services                           → Create new service
GET    /api/services/{service_id}              → Get service details
PUT    /api/services/{service_id}              → Update service
DELETE /api/services/{service_id}              → Delete service
PUT    /api/services/{service_id}/status       → Update service status
```

**Incident Management**

```http
GET    /api/incidents                          → List organization incidents
POST   /api/incidents                          → Create new incident
GET    /api/incidents/{incident_id}            → Get incident details
PUT    /api/incidents/{incident_id}            → Update incident
DELETE /api/incidents/{incident_id}            → Delete incident
PUT    /api/incidents/{incident_id}/status     → Update incident status
POST   /api/incidents/{incident_id}/updates    → Add incident update
```

**Maintenance Management**

```http
GET    /api/maintenance                        → List scheduled maintenance
POST   /api/maintenance                        → Schedule new maintenance
GET    /api/maintenance/{maintenance_id}       → Get maintenance details
PUT    /api/maintenance/{maintenance_id}       → Update maintenance
DELETE /api/maintenance/{maintenance_id}       → Delete maintenance
PUT    /api/maintenance/{maintenance_id}/status → Update maintenance status
```

**Organization Management**

```http
GET    /api/organizations/current              → Get current user's organization
POST   /api/organizations                      → Create new organization
PUT    /api/organizations/{org_id}             → Update organization
GET    /api/organizations/check-user/{user_id} → Check user organization membership
```

**Team Management**

```http
GET    /api/team/members                       → List team members
POST   /api/team/invite                        → Invite new team member
GET    /api/team/members/me                    → Get current user info
DELETE /api/team/members/{member_id}           → Remove team member
GET    /api/team/invitations/{token}           → Get invitation details
POST   /api/team/invitations/{token}/accept    → Accept team invitation
```

#### **🔧 Admin Endpoints**

```http
POST   /admin/init-database                    → Manual database initialization
GET    /admin/debug/organizations              → List all organizations (debug)
```

#### **📡 WebSocket Events**

**Client → Server Events**

```javascript
subscribe_organization     → Subscribe to organization updates
unsubscribe_organization  → Unsubscribe from organization updates
```

**Server → Client Events**

```javascript
status_update            → Generic status change notification
service_update           → Service status changed
incident_update          → Incident status changed
incident_created         → New incident created
maintenance_update       → Maintenance status changed
maintenance_created      → New maintenance scheduled
connect                  → WebSocket connected
disconnect               → WebSocket disconnected
```

---

## 🔄 **Application Flow & User Journey**

### **1. User Registration & Organization Setup**

```
User signs up via Clerk → Creates organization → Becomes organization admin → Invites team members
```

### **2. Service Management Workflow**

```
Admin creates services → Sets initial status → Monitors via dashboard → Updates status when needed
```

### **3. Incident Management Workflow**

```
Issue detected → Create incident → Select affected services → Incident shows on status page →
Update incident status → Resolve incident → Incident archived in timeline
```

### **4. Public Status Page Access**

```
External user visits /status/{org-slug} → Views real-time status → Sees active incidents →
Checks recent activity → Optionally subscribes to updates
```

### **5. Real-Time Updates Flow**

```
Admin changes service status → WebSocket event fired → All connected clients receive update →
Public status pages update automatically → No refresh needed
```

---

## 🚀 **Deployment Architecture**

### **Production Environment (Render)**

#### **Frontend Deployment**

- **Service Type**: Static Site
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Auto-Deploy**: Enabled on `main` branch push
- **Custom Domain**: `status-page-frontend.onrender.com`
- **SSL Certificate**: Auto-provisioned

#### **Backend Deployment**

- **Service Type**: Web Service
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Auto-Deploy**: Enabled on `main` branch push
- **Custom Domain**: `status-page-backend-cx26.onrender.com`
- **Health Check**: `/health` endpoint

#### **Database Setup**

- **Service Type**: PostgreSQL 14
- **Storage**: Persistent with automatic backups
- **Connection**: Via `DATABASE_URL` environment variable
- **Auto-scaling**: Managed by Render

### **Environment Variables Configuration**

#### **Backend Environment Variables**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
JWT_SECRET=your_jwt_secret

# Application
ENVIRONMENT=production
LOG_LEVEL=INFO
FRONTEND_URL=https://status-page-frontend.onrender.com

# CORS
ALLOWED_ORIGINS=https://status-page-frontend.onrender.com
```

#### **Frontend Environment Variables**

```bash
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# API Configuration
VITE_API_URL=https://status-page-backend-cx26.onrender.com
VITE_SOCKET_URL=https://status-page-backend-cx26.onrender.com
```

### **Continuous Deployment Pipeline**

```
Code Push → GitHub → Render Webhook → Automatic Build → Deploy → Health Check → Live
     │          │           │              │           │         │         │
     └── Git ───┴─ Trigger ─┴── Install ───┴── Test ───┴── Route ┴── Monitor ┘
```

---

## 🛠️ **Development Setup**

### **Prerequisites**

- Node.js 16+ and npm
- Python 3.9+
- PostgreSQL 14+
- Git

### **Local Development Setup**

#### **1. Clone Repository**

```bash
git clone https://github.com/ar0085/status-page.git
cd status-page
```

#### **2. Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your database credentials and Clerk keys

# Run database migrations
alembic upgrade head

# Start development server
uvicorn app.main:app --reload --port 8000
```

#### **3. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Add your Clerk publishable key and API URLs

# Start development server
npm run dev
```

#### **4. Database Setup**

```sql
-- Create PostgreSQL database
CREATE DATABASE statuspage;
CREATE USER statususer WITH PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE statuspage TO statususer;
```

#### **5. Create Demo Data (Optional)**

```bash
# Run demo setup script
python demo_setup.py
```

### **Development URLs**

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Demo Status Page**: http://localhost:5173/status/github

---

## 📊 **Database Schema**

### **Core Tables**

```sql
organizations          → Multi-tenant organization data
├── id, name, slug, created_at

users                  → User account information
├── id, clerk_id, email, name, created_at

organization_members   → User-organization relationships
├── organization_id, user_id, role, joined_at

services              → Services being monitored
├── id, organization_id, name, description, status, created_at

incidents             → Service incidents and outages
├── id, organization_id, title, description, status, created_at

maintenance           → Scheduled maintenance windows
├── id, organization_id, title, scheduled_start, scheduled_end

team_invitations      → Pending team member invitations
├── id, organization_id, email, token, expires_at
```

### **Relationships**

- **One organization** → Many services, incidents, maintenance, members
- **Many-to-many** → Users ↔ Organizations (via organization_members)
- **Many-to-many** → Incidents ↔ Services (via incident_services)

---

## 🔐 **Security Implementation**

### **Authentication Flow**

1. **User logs in** via Clerk authentication
2. **JWT token** issued by Clerk
3. **Backend verifies** JWT signature
4. **Organization scope** determined from user membership
5. **All API calls** filtered by organization ID

### **Data Security**

- **Complete tenant isolation** - users only see their organization's data
- **JWT verification** on all protected endpoints
- **CORS protection** for browser security
- **SQL injection protection** via SQLAlchemy ORM
- **Input validation** via Pydantic models

---

## 🎯 **Usage Examples**

### **Creating a Status Page**

#### **1. Set Up Organization**

```bash
# 1. Sign up at https://status-page-frontend.onrender.com
# 2. Create your organization
# 3. Note your organization slug
```

#### **2. Add Services**

```bash
# Via dashboard: /dashboard/services
# Add services like: "Web Application", "API", "Database"
```

#### **3. Access Public Status Page**

```bash
# Your status page will be available at:
# https://status-page-frontend.onrender.com/status/your-org-slug
```

### **API Integration Example**

#### **Get Organization Status**

```javascript
// Fetch public status data
const response = await fetch(
  "https://status-page-backend-cx26.onrender.com/api/status/your-org-slug"
);
const statusData = await response.json();

console.log("Organization:", statusData.organization.name);
console.log("Services:", statusData.services.length);
console.log("Active Incidents:", statusData.active_incidents.length);
```

#### **WebSocket Integration**

```javascript
import io from "socket.io-client";

const socket = io("https://status-page-backend-cx26.onrender.com");

socket.on("connect", () => {
  // Subscribe to organization updates
  socket.emit("subscribe_organization", { tenant_id: organizationId });
});

socket.on("service_update", (data) => {
  console.log("Service status changed:", data);
  // Update UI with new status
});
```

---

## 🔧 **Configuration & Customization**

### **Environment-Based Configuration**

The application automatically adapts based on the `ENVIRONMENT` setting:

- **Development**: Detailed logging, local CORS, debug features
- **Production**: Optimized performance, secure CORS, error handling

### **Customization Options**

- **Organization branding** via organization settings
- **Custom service categories** and status types
- **Notification preferences** for incidents
- **Public page customization** with organization details

---

## 📈 **Monitoring & Analytics**

### **Health Monitoring**

- **Health endpoint**: `/health` provides system status
- **Database connectivity** monitoring
- **Real-time connection** tracking
- **API response time** monitoring

### **Logging & Debugging**

- **Structured logging** with configurable levels
- **Request/response logging** for API calls
- **WebSocket connection tracking**
- **Error tracking** and stack traces

---

## 🤝 **Contributing**

### **Development Workflow**

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test locally
4. Commit with descriptive messages
5. Push and create pull request

### **Code Standards**

- **TypeScript** for frontend type safety
- **Python type hints** for backend
- **ESLint** and **Prettier** for code formatting
- **SQLAlchemy models** for database operations

---

## 📝 **API Documentation**

### **Interactive Documentation**

- **Swagger UI**: [https://status-page-backend-cx26.onrender.com/docs](https://status-page-backend-cx26.onrender.com/docs)
- **ReDoc**: [https://status-page-backend-cx26.onrender.com/redoc](https://status-page-backend-cx26.onrender.com/redoc)

### **Authentication for API Testing**

1. Sign in to the frontend application
2. Get JWT token from browser developer tools
3. Use token in API documentation: `Authorization: Bearer <token>`

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **Frontend Not Loading**

```bash
# Check build status and environment variables
# Verify Clerk publishable key is set
# Check CORS configuration in backend
```

#### **API Connection Issues**

```bash
# Verify backend is running: curl https://status-page-backend-cx26.onrender.com/health
# Check environment variables
# Verify database connectivity
```

#### **WebSocket Not Connecting**

```bash
# Check network configuration
# Verify Socket.IO client version compatibility
# Check browser console for connection errors
```

### **Support Resources**

- **GitHub Issues**: [Create an issue](https://github.com/ar0085/status-page/issues)
- **API Documentation**: [Interactive docs](https://status-page-backend-cx26.onrender.com/docs)
- **Health Check**: [System status](https://status-page-backend-cx26.onrender.com/health)

---

## 📄 **License**

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **GitHub Status Page** - Design inspiration
- **Render** - Cloud hosting platform
- **Clerk** - Authentication service
- **FastAPI** - Modern Python web framework
- **React** - User interface library

---

**Built with ❤️ using modern web technologies and deployed on Render cloud platform.**

For questions or support, please check the [API documentation](https://status-page-backend-cx26.onrender.com/docs) or create an issue on GitHub.
