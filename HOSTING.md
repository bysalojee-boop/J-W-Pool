# Hosting Guide: Pool Tracker App 🎱

> **Current Setup**: Deployed on **Render.com** with **Supabase PostgreSQL** as the persistent database.

---

## 🚀 Render + Supabase Deployment

### Build & Start Commands
| | Value |
|---|---|
| **Build Command** | `npm ci && npm run build:render` |
| **Start Command** | `npm run start` |

> Note: The build script in `package.json` already handles `prisma generate && prisma migrate deploy`, so `npm run build` triggers the full chain. You can use `npm ci && npm run build` as the build command on Render.

---

### Required Environment Variable

Set this in **Render Dashboard → Your Service → Environment**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `postgresql://postgres:YOUR_PASSWORD@db.xfgsmfxhneyhthvivfld.supabase.co:5432/postgres` |

> ⚠️ Replace `YOUR_PASSWORD` with your actual Supabase database password.

---

## 🔄 Data Backup & Restore (CSV)

Since the database now lives in **Supabase** (not the Render container), data persists across all redeploys automatically.

However, for extra safety or to migrate data:

1. Go to **Settings → Data Backup & Restore**
2. Click **⬇️ Export Game History (CSV)** to download all data
3. If you ever need to restore (e.g. switched Supabase project), click **⬆️ Import Game History (CSV)** and upload the exported file

The import is smart — it skips duplicate games and auto-creates missing players and seasons.

---

## 🗂️ Admin Features

| Feature | Location | Password |
|---|---|---|
| Add custom season | Settings | `000` |
| Set active season | Settings | `000` |
| Delete season | Settings | `000` |
| Reset league | Settings | No password |

---

## 🔒 Security Note

The management password is currently `000`. Anyone with the URL can log games. For production use, consider adding proper authentication.
