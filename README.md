## Collabify

Modern, full‑stack collaborative document editor with authentication, RBAC, real‑time editing via WebSockets, invitations/notifications, and AI writing assistance.

### Monorepo structure
- `api-gateway/`: Single entrypoint for frontend API calls; proxies to backend services
- `backend/`
  - `auth-service/`: Auth (register/login/logout), JWT, PostgreSQL via Sequelize
  - `document-service/`: Document CRUD, collaborators, invitations integration (HTTP), PostgreSQL via Sequelize
  - `collaboration-service/`: Real‑time editing and persistence via Socket.IO + MongoDB
  - `notification-service/`: Invitations lifecycle + email delivery (SMTP/Gmail), MongoDB or in‑memory fallback
  - `ai-suggestions-service/`: AI grammar/style suggestions using Google Gemini
- `frontend/`: React + Vite app

### Default ports
- Frontend: `5173`
- API Gateway: `4000`
- Auth Service: `5000` (service default; proxied as `http://localhost:5001` unless overridden)
- Document Service: `5001` (service default; proxied as `http://localhost:5002` unless overridden)
- Collaboration Service (HTTP + Socket.IO): `5003`
- Notification Service: `5004`
- AI Suggestions Service: `5001` by default in code; best run on `5005` via env

Note: The API Gateway is configured with fallbacks to these proxy targets:
- `AUTH_SERVICE_URL` → `http://localhost:5001`
- `DOCUMENT_SERVICE_URL` → `http://localhost:5002`
- `COLLABORATION_SERVICE_URL` → `http://localhost:5003`
- `NOTIFICATION_SERVICE_URL` → `http://localhost:5004`
- `AI_SUGGESTIONS_SERVICE_URL` → `http://localhost:5005`

### Quick start (development)
1) Install dependencies at the root and in each package (first run only):
```bash
npm install
cd api-gateway && npm install
cd ../backend/auth-service && npm install
cd ../document-service && npm install
cd ../collaboration-service && npm install
cd ../notification-service && npm install
cd ../ai-suggestions-service && npm install
cd ../../../frontend && npm install
```

2) Create environment files using the examples below.

3) Start services (in separate terminals):
```bash
# API Gateway
cd api-gateway && npm run dev

# Auth Service
cd backend/auth-service && npm run dev

# Document Service
cd backend/document-service && npm run dev

# Collaboration Service (Socket.IO)
cd backend/collaboration-service && npm run dev

# Notification Service
cd backend/notification-service && npm run dev

# AI Suggestions Service
cd backend/ai-suggestions-service && npm run dev

# Frontend
cd frontend && npm run dev
```

Open the app at `http://localhost:5173`.

### Environment variables

#### API Gateway (`api-gateway/.env`)
```env
PORT=4000
AUTH_SERVICE_URL=http://localhost:5001
DOCUMENT_SERVICE_URL=http://localhost:5002
COLLABORATION_SERVICE_URL=http://localhost:5003
NOTIFICATION_SERVICE_URL=http://localhost:5004
AI_SUGGESTIONS_SERVICE_URL=http://localhost:5005
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:4000
VITE_SOCKET_URL=http://localhost:5003
```

#### Auth Service (`backend/auth-service/.env`)
```env
PORT=5000
DB_NAME=collabify_auth
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

#### Document Service (`backend/document-service/.env`)
```env
PORT=5001
DB_NAME=collabify_docs
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET=your_jwt_secret
```

#### Collaboration Service (`backend/collaboration-service/.env`)
```env
PORT=5003
MONGO_URI=mongodb://localhost:27017/collabify-collaboration
```

#### Notification Service (`backend/notification-service/.env`)
```env
PORT=5004
MONGODB_URI=mongodb://localhost:27017/collabify-notifications

# Email via SMTP (preferred)
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_pass

# or Gmail fallback (app password required)
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

#### AI Suggestions Service (`backend/ai-suggestions-service/.env`)
```env
PORT=5005
GEMINI_API_KEY=your_google_generative_ai_key
```

### CORS and cookies
All services are configured to allow origins `http://localhost:5173` and `http://localhost:3000` with credentials enabled. The gateway forwards headers and cookies. If you change frontend/gateway origins or ports, update them across services.

### Services overview and key routes

#### API Gateway (`api-gateway/server.js`)
- Proxies requests:
  - `/api/auth → AUTH_SERVICE_URL` (forwards as `/api/auth/...`)
  - `/api/documents → DOCUMENT_SERVICE_URL`
  - `/api/invitations → NOTIFICATION_SERVICE_URL`
  - `/api/collaboration → COLLABORATION_SERVICE_URL`
  - `/api/ai-suggestion → AI_SUGGESTIONS_SERVICE_URL`

#### Auth Service
- Base path: `/api/auth`
- Endpoints:
  - `POST /register`
  - `POST /login`
  - `POST /logout`
  - `POST /accept-invitation` (used in invitation accept flow)
- Tech: Express, JWT, Sequelize (PostgreSQL)

#### Document Service
- Base path: `/api/documents`
- Endpoints (JWT required; RBAC via `authorizeRoles` where noted):
  - `GET /get-Alldocument`
  - `POST /create-document`
  - `GET /:documentId` (roles: viewer, editor, admin)
  - `PUT /:documentId` (roles: editor, admin)
  - `DELETE /:documentId` (roles: admin)
  - Collaborators (admin):
    - `POST /:documentId/collaborators`
    - `PATCH /:documentId/collaborators/:userId`
    - `DELETE /:documentId/collaborators/:userId`
  - Invitations (admin/editor):
    - `POST /:documentId/invitations`
    - `GET /:documentId/invitations`
    - `DELETE /:documentId/invitations/:invitationId`
  - Internal (service‑to‑service):
    - `POST /internal/invitations/accept`
- Tech: Express, Sequelize (PostgreSQL)

#### Collaboration Service
- HTTP API: `/api/collaboration/:id`
  - `GET /:id` → load document
  - `POST /:id` → save document
- WebSocket (Socket.IO): namespace `/collaboration`
  - Events:
    - `join-document` with `documentId`
    - `load-document` (server → client)
    - `edit-document` with `{ documentId, content }`
    - `document-updated` (server → room)
    - `undo` (prototype, OT planned)
- Tech: Express, Socket.IO, MongoDB (Mongoose)

#### Notification Service (Invitations + Email)
- Base path: `/api/invitations`
- Endpoints:
  - `POST /send` → send invitation email
  - `GET /token/:token` → fetch invitation by token
  - `POST /accept/:token` → accept invitation
  - `POST /reject/:token` → reject invitation
  - `GET /document/:documentId` → list invitations for document
  - `GET /recipient` → list invitations for current user
  - `DELETE /:invitationId` → cancel invitation
  - `POST /cleanup` → remove expired invitations
- Email: Nodemailer via SMTP or Gmail app password; logs to console in dev if not configured
- Tech: Express, MongoDB (Mongoose)

#### AI Suggestions Service
- Base path: `/api/ai-suggestion`
- `POST /ai-suggestion` with `{ documentText }` → returns `{ suggestion }`
- Model: `gemini-2.0-flash-lite`

### Frontend configuration
- `frontend/src/config.js`
  - `API_URL` → `VITE_API_URL` (defaults to `http://localhost:4000`)
  - `SOCKET_URL` → `VITE_SOCKET_URL` (defaults to `http://localhost:5003`)

### Development tips
- Ensure PostgreSQL and MongoDB are running locally or supply cloud URIs via env
- For email in development, omit SMTP/Gmail envs to log email payloads to console
- Keep service ports in sync with the gateway proxy URLs and frontend `.env`

### Available scripts
- API Gateway: `npm run dev`
- Auth Service: `npm run dev`
- Document Service: `npm run dev`
- Collaboration Service: `npm run dev`
- Notification Service: `npm run dev`
- AI Suggestions Service: `npm run dev`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

### License
ISC (see individual package licenses if modified).