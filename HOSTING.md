# Hosting Guide: Pool Tracker App 🎱

To make your Pool Tracker app available to everyone remotely, we recommend using **Railway.app** or **Render.com**. These services are excellent for Next.js applications and support the **persistent storage** required for our SQLite database.

## 🚀 Option 1: Railway (Easiest)

1. **Create a GitHub Repository**:
   - Push your code to a new private or public repository on GitHub.
2. **Connect to Railway**:
   - Go to [Railway.app](https://railway.app/) and sign in with GitHub.
   - Click **"New Project"** -> **"Deploy from GitHub repo"**.
   - Select your `pool-tracker` repository.
3. **Add a Persistent Volume**:
   - In your Railway project, click **"Add Service"** -> **"Volumes"**.
   - Create a volume and mount it to `/app/prisma` (where your database lives).
4. **Build & Deploy**:
   - Railway will automatically detect the Next.js app and deploy it.
   - Ensure your `.env` on Railway has `DATABASE_URL="file:/app/prisma/dev.db"` to use the persistent volume.

---

## 🛠️ Option 2: Render.com

1. **New Web Service**:
   - Sign in to [Render.com](https://render.com/) and create a new **Web Service**.
   - Connect your GitHub repository.
2. **Configure Build**:
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start`
3. **Add a Disk (Persistence)**:
   - Under the **"Disks"** tab for your service, click **"Add Disk"**.
   - Name: `pool-data`
   - Mount Path: `/var/data`
   - Size: 1GB (minimum)
4. **Environment Variables**:
   - Set `DATABASE_URL` to `file:/var/data/dev.db`.

---

## 🔒 Security Note
Since anyone with the link can log games, you may want to eventually add a simple password or login. For now, the app is open to whoever has the URL!
