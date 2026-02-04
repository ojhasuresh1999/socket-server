# Portfolio Socket Server

Standalone Socket.IO server for the portfolio chat feature. This server can be
deployed separately from the Next.js app (which runs on Vercel) to a platform
that supports WebSockets.

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start development server
pnpm dev
```

## Environment Variables

| Variable      | Description                       | Example                        |
| ------------- | --------------------------------- | ------------------------------ |
| `MONGODB_URI` | MongoDB connection string         | `mongodb+srv://...`            |
| `JWT_SECRET`  | JWT secret for admin auth         | Same as `NEXTAUTH_SECRET`      |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `https://your-site.vercel.app` |
| `PORT`        | Server port                       | `4000`                         |

## Deployment

### Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

### Docker

```bash
docker build -t portfolio-socket-server .
docker run -p 4000:4000 --env-file .env portfolio-socket-server
```

## After Deployment

Update your Vercel environment variables:

```
NEXT_PUBLIC_SOCKET_URL=https://your-socket-server.railway.app
```
