# Blessy Shalom Portfolio (Frontend + Backend)

Single-page portfolio UI (from your template) + a backend API that stores contact form submissions in **Neon Postgres**.

## Folder structure

- `frontend/` : static site (`index.html`, `style.css`, `script.js`)
- `backend/` : Flask API + Neon/Postgres database layer

## Profile photo (VS Code screenshot)

Place your image here:

- `frontend/assets/profile.png`

If the image is missing, the avatar falls back to “BS”.

## Backend (Neon Postgres)

### 1) Get your Neon `DATABASE_URL`
In Neon, copy the `DATABASE_URL` connection string.

### 2) Run locally
From the project root:

```powershell
cd "C:\Users\BLESSY SHALOM\Desktop\final project"
py -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt

$env:DATABASE_URL="PASTE_NEON_DATABASE_URL_HERE"
python -m backend.server
```

Backend endpoints:

- `GET /health`
- `POST /api/contact` (expects JSON: `{ "name": "...", "email": "...", "message": "..." }`)

## Frontend -> Backend connection

Update this line after you deploy the backend:

- `frontend/index.html` : `<meta name="api-url" content="...">`

It should point to your deployed Render backend, e.g.:

- `https://your-backend.onrender.com`

The contact form will POST to:

- `${api-url}/api/contact`

## Deploy to GitHub + Render (high level)

1. Create a GitHub repo.
2. Initialize git and push this folder to GitHub.
3. In Render, create:
   - **Web Service (Backend)** for `backend/server.py`
     - Environment variable: `DATABASE_URL` = your Neon URL
     - Start command (typical): `gunicorn backend.server:app --bind 0.0.0.0:$PORT`
   - **Static Site (Frontend)** using `frontend/` as the root
4. After the backend is live, copy its URL and update `frontend/index.html` meta tag.
5. Redeploy the frontend.

