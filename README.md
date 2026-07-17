# AuraStyle - AI-Powered Virtual Try-On & Smart Fashion Platform

An enterprise-grade, ultra-premium web application styled in line with modern minimal design systems. It enables users to upload portrait photos, overlay catalog garments in an interactive real-time visual designer canvas, execute high-quality transparent compositing using local OpenCV and Pillow algorithms, and receive tailored outfit suggestions.

---

## Technical Stack

- **Frontend**: React (Vite), Tailwind CSS (curated palette), Framer Motion, Lucide React icons, Axios client.
- **Backend**: Python, Flask, Flask-SQLAlchemy (SQLite database), Flask-JWT-Extended secure tokens, Gunicorn WSGI.
- **Image Processing**: OpenCV (body region tracking), Pillow (alpha-blending, transformations), NumPy.
- **Infrastructure & DevOps**: Docker, Docker Compose, Nginx Reverse Proxy.

---

## Workspace Directory Structure

```
Try-on/
├── backend/
│   ├── app.py                  # Server bootstrap & Pillow clothes asset generator
│   ├── config.py               # Path configurations & security keys
│   ├── database.py             # SQLAlchemy DB instance
│   ├── models.py               # User, Category, Product, History, Session schemas
│   ├── routes/                 # Blueprint endpoints
│   │   ├── auth.py, categories.py, products.py, tryon.py, wishlist.py...
│   │   └── recommendations.py, admin.py
│   ├── services/
│   │   ├── image_processor.py  # Local OpenCV + Pillow composite blenders
│   │   └── recommender.py      # Rules-based fashion scoring engine
│   └── requirements.txt        # Python libraries
├── frontend/
│   ├── index.html              # Document header & root mount
│   ├── vite.config.js          # Proxy setups
│   ├── tailwind.config.js      # Theme palette and layout configurations
│   ├── nginx.conf              # SPA route router fallback
│   ├── package.json            # NPM dependencies list
│   └── src/
│       ├── main.jsx, App.jsx   # Client boot & router paths
│       ├── index.css           # Premium glassmorphism definitions
│       ├── components/         # Common Navbar, Footer, Skeletons
│       └── pages/              # Landing, Catalog, TryOn, Recommendations, Admin, Dash...
├── docs/                       # Project manuals (api.md, database.md, deployment.md)
├── docker/                     # Isolated container configs (Dockerfiles)
├── nginx/                      # Root reverse-proxy configuration
└── docker-compose.yml          # Services orchestrator
```

---

## Local Installation Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### Setup Backend
1. Navigate to backend and establish environment:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Boot development server:
   ```bash
   python app.py
   ```
   *Note: On initialization, the app will automatically draw transparent garments PNG assets and create mock catalog cards inside `/uploads` directory, alongside seeding the SQLite database.*

### Setup Frontend
1. Navigate to frontend folder and install packages:
   ```bash
   cd ../frontend
   npm install
   ```
2. Run Vite dev server:
   ```bash
   npm run dev
   ```
3. Open browser to `http://localhost:3000`.

### Developer Logins
- **Admin account**: Email `admin@smartfashion.com` | Password `admin123`
- **User account**: Registrations are available on the client form.
