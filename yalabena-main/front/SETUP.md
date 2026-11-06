# Speak Up Academy TMS — Frontend Setup

## Requirements

- Node.js 20+
- npm 10+
- Docker (optional, for containerized deployment)
- Backend running on `http://localhost:3000`

## Quick Start

### 1. Clone / Extract

Extract `speakup-frontend.zip` to your desired directory.

### 2. Environment

```bash
cp .env.example .env
```

Edit `.env` if needed. Default values work for local development:
```
VITE_API_BASE_URL=/api/v1
VITE_APP_NAME=Speak Up Academy TMS
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

The Vite dev server proxies `/api/v1` and Socket.IO transport requests (`/socket.io/`) to `http://localhost:3000`. The chat namespace is `/chat`; do not proxy only `/chat`, because Socket.IO uses `/socket.io/` as its transport path.

### 5. Production Build

```bash
npm run build
```

Output is in `dist/` directory.

### 6. TypeScript Check

```bash
npm run typecheck
```

### 7. Lint

```bash
npm run lint
```

## Docker Deployment

### Build & Run Frontend Only

```bash
docker build -t speakup-frontend .
docker run -p 80:80 speakup-frontend
```

### With Docker Compose (requires backend network)

```bash
# First ensure backend network exists
docker network create speakup-network

# Then start frontend
docker-compose up -d
```

## Backend Setup (Required)

The backend must be running before the frontend can function.

```bash
# In the backend directory
cp .env.example .env
# Edit .env with your PostgreSQL credentials

docker-compose up -d postgres redis
npm install
npm run migration:run
npm run seed
npm run start:dev
```

Backend URLs:
- API: `http://localhost:3000/api/v1`
- Swagger Docs: `http://localhost:3000/docs`

## URLs

| Service | URL |
|---------|-----|
| Frontend (dev) | `http://localhost:5173` |
| Frontend (Docker) | `http://localhost` |
| Backend API | `http://localhost:3000/api/v1` |
| Swagger | `http://localhost:3000/docs` |

## Troubleshooting

### `Cannot POST /api/v1/auth/register`

**Cause:** API prefix mismatch or proxy not working.

**Fix:**
1. Verify backend is running: `curl http://localhost:3000/api/v1/health`
2. Check `vite.config.ts` proxy target matches backend port
3. Ensure `VITE_API_BASE_URL=/api/v1` (not `http://localhost:3000/api/v1` in dev)

### Chat page loads but rooms/messages or live updates do not work

**Fix:**
1. Confirm `front/.env` has `VITE_API_BASE_URL=/api/v1`.
2. Restart Vite after changing `.env`.
3. In DevTools → Network, verify `/api/v1/chat/consent` and `/api/v1/chat/rooms` are sent to the backend.
4. Verify `/socket.io/?EIO=4...` is proxied to port 3000. The namespace is `/chat`, but the transport path is `/socket.io/`.
5. Confirm the backend is running, the access token is valid, and the signed-in user is eligible for at least one chat room.

### 401 Unauthorized on every request

**Cause:** Token expired or invalid.

**Fix:**
1. Clear localStorage and re-login
2. Check browser DevTools → Application → Local Storage
3. Verify token format: `Bearer <jwt>`

### CORS errors

**Cause:** Backend CORS origin not matching frontend.

**Fix:**
1. In backend `.env`, set `CORS_ORIGIN=http://localhost:5173`
2. Or use Vite proxy (already configured)

### `npm install` fails / hangs

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### TypeScript errors about missing type definitions

**Fix:**
```bash
npm install --save-dev @types/react @types/react-dom @types/node
```

### Build fails with "Cannot find module"

**Fix:**
1. Ensure `tsconfig.json` has `"baseUrl": "."` and `"paths": { "@/*": ["./src/*"] }`
2. Ensure `vite.config.ts` has the `@` alias configured
3. Run `npm install` again

### Docker: "network not found"

**Fix:**
```bash
docker network create speakup-network
```

Then restart both backend and frontend containers.
