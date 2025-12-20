# Deployment Guide for AiSocial

This project uses a **hybrid deployment strategy** due to the technical requirements of the real-time features.

-   **Frontend (App)**: Deployed to **Vercel** (Next.js).
-   **Backend (API)**: Deployed to **Render** (Node.js + Socket.io).

> **Why split them?**
> The backend relies on persistent WebSocket connections for chat and calling. Vercel's Serverless functions do not support these persistent connections, so the backend must be hosted on a platform that does (like Render, Railway, or Heroku).

---

## Part 1: Deploy Backend (Render)

You already have a `render.yaml` file in the root, which automates this process.

1.  Push your latest code to GitHub.
2.  Go to the [Render Dashboard](https://dashboard.render.com/).
3.  Click **"New"** -> **"Blueprint"**.
4.  Connect your GitHub repository.
5.  Render will read the `render.yaml` and create the `aisocial-server` service.

### Environment Variables (Server)
Make sure these are set in your Render dashboard (some might be auto-synced):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `CLIENT_ORIGIN` | The URL of your Vercel Frontend | `https://aisocial.vercel.app` (Update after deploying client) |
| `API_BASE_URL` | The URL of this Render Backend | `https://aisocial-server.onrender.com` |
| `MONGO_URI` | Your MongoDB Connection String | `mongodb+srv://...` |
| `JWT_SECRET` | Secret for cleaning tokens | `<random-string>` |
| `CLOUDINARY_*` | Cloudinary credentials | `...` |

---

## Part 2: Deploy Frontend (Vercel)

1.  Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your **AiSocial** Git repository.
4.  **Important**: Configure the **Root Directory**.
    *   Click "Edit" next to Root Directory.
    *   Select `client`.
    *   *Note: Vercel should automatically detect Next.js settings once you select the client folder.*
5.  **Environment Variables**:
    Add the following variables in the deployment setup:

| Variable | Description | Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_BASE_URL` | URL of your deployed Render Backend | `https://aisocial-server.onrender.com` (from Part 1) |

6.  Click **Deploy**.

---

## Part 3: Final Wiring

Once both are deployed:

1.  **Update Server**: Go back to Render -> Environment Variables. Update `CLIENT_ORIGIN` with your actual Vercel URL (e.g., `https://aisocial-project.vercel.app`). Redeploy the server if needed.
2.  **Verify**:
    *   Open your Vercel App.
    *   Try logging in (Tests Database connection).
    *   Try sending a message (Tests Socket connection).
