# 💰 Smart Expense Tracker with AI

A full-stack, industry-style expense tracking application featuring **OCR bill scanning**, **AI-powered spending prediction**, **budget alerts**, and **monthly reports**.

Built with: **React (Vite)** · **Node.js / Express** · **MongoDB** · **Tesseract.js (OCR)** · **simple-statistics (ML)**

---

## ✨ Features

| Feature | How it works |
|---|---|
| 🔐 Auth | JWT-based register/login, passwords hashed with bcrypt |
| 💸 Expense Tracking | Full CRUD, filter by category/date, pagination |
| 📷 OCR Bill Scanning | Upload a photo of a receipt → Tesseract.js extracts text → regex-based parser pulls out amount, date, merchant, and auto-guesses category (Indian DD/MM/YYYY dates + ₹ amounts handled) |
| 🤖 Spending Prediction | Linear regression (via `simple-statistics`) over your last 6 months of spending predicts next month's total, with a confidence score (R²) and trend direction |
| 🚨 Anomaly Detection | Flags categories where this month's spend is a statistical outlier (z-score) vs. your own history |
| 🔔 Budget Alerts | Set per-category or overall monthly budgets; get warned at a configurable threshold (default 80%) and when exceeded |
| 📊 Monthly Reports | Category breakdown, daily spending trend, payment-method breakdown — all chart-visualized with Recharts |

---

## 📁 Project Structure

```
smart-expense-tracker/
├── docker-compose.yml             # Orchestrates mongo + backend + frontend
├── .env.example                   # JWT_SECRET for docker-compose
├── .github/workflows/ci.yml       # CI: runs tests + frontend build on every push
├── postman/                       # Postman collection + environment (19 requests)
├── backend/
│   ├── config/db.js               # MongoDB connection
│   ├── models/                    # User, Expense, Budget (Mongoose schemas)
│   ├── controllers/                # Business logic
│   ├── routes/                    # Express routes
│   ├── middleware/                 # auth (JWT), upload (Multer), errorHandler
│   ├── utils/
│   │   ├── ocrParser.js           # Parses raw OCR text → structured expense data
│   │   ├── predictSpending.js     # Linear regression + anomaly detection
│   │   └── seed.js                # Populates a demo account with sample data
│   ├── tests/
│   │   ├── unit/                  # ocrParser + predictSpending — no DB needed
│   │   └── integration/           # Full API flow tests via supertest + in-memory MongoDB
│   ├── app.js                     # Express app config (importable by tests, no port binding)
│   ├── server.js                  # Starts the server (imports app.js)
│   ├── Dockerfile
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/axios.js           # Axios instance with JWT interceptor
    │   ├── context/AuthContext.jsx
    │   ├── pages/                 # Login, Register, Dashboard, AddExpense, ScanBill, Reports, Budget
    │   └── components/            # Navbar, ExpenseList, SpendingChart, BudgetAlert
    ├── Dockerfile                 # Multi-stage build served via nginx
    ├── nginx.conf
    └── vite.config.js             # Dev proxy → backend on :5000
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- MongoDB running locally (`mongodb://127.0.0.1:27017`) **or** a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set:
```
MONGO_URI=mongodb://127.0.0.1:27017/smart_expense_tracker
JWT_SECRET=<generate a long random string>
PORT=5000
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start
```
Server runs on **http://localhost:5000**. Health check: `GET /api/health`.

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
App runs on **http://localhost:5173** (Vite dev server proxies `/api` and `/uploads` to the backend automatically — see `vite.config.js`).

### 3. Use the app
1. Open http://localhost:5173 → Register a new account
2. Add an expense manually, or go to **Scan Bill (OCR)** and upload a photo of a receipt
3. Set budgets under **Budgets** to start getting alerts
4. Check **Reports & AI** after you have a few weeks/months of data for predictions

> 💡 Want to explore without entering data manually? Run `npm run seed` in `backend/` to create a demo account (`demo@expensetracker.com` / `demo1234`) pre-loaded with 5 months of sample expenses and budgets — great for showing off the AI prediction chart immediately.

---

## 🐳 Running with Docker Compose (recommended for quick demos / grading)

No need to install Node or MongoDB locally — everything runs in containers.

```bash
# from the project root
cp .env.example .env      # optionally edit JWT_SECRET
docker compose up --build
```

This starts three containers:
| Service | URL | Notes |
|---|---|---|
| `frontend` | http://localhost:5173 | React build served by nginx, proxies `/api` to backend |
| `backend` | http://localhost:5000 | Express API |
| `mongo` | localhost:27017 | MongoDB 7, with a named volume so data persists across restarts |

To seed demo data into the Dockerized database:
```bash
docker compose exec backend npm run seed
```

Stop everything with `docker compose down` (add `-v` to also wipe the database volume).

---

## 🧪 Testing

The backend has both **unit tests** (pure logic, no external services, run in under a second) and **integration tests** (full HTTP request → Express → MongoDB flow, using an in-memory MongoDB via `mongodb-memory-server`).

```bash
cd backend
npm run test:unit          # OCR parser + ML prediction logic — 28 tests, no network needed
npm run test:integration   # Auth, Expense CRUD, Budget alerts — spins up an in-memory MongoDB
npm test                   # runs everything
npm run test:coverage      # with a coverage report
```

> ℹ️ The **first** time you run the integration tests, `mongodb-memory-server` downloads a real `mongod` binary (~100MB) to run tests against — this needs internet access and takes a minute. After that it's cached and tests run fast. If you're in a fully offline/restricted environment, run `npm run test:unit` instead, which needs no network or database at all.

**What's covered:**
- `ocrParser.js` — amount extraction (including 4+ digit and comma-separated amounts), Indian DD/MM/YYYY date parsing, merchant detection, category auto-guessing
- `predictSpending.js` — linear regression trend detection (rising/falling/stable), confidence scoring, anomaly (z-score) detection
- Auth — register, duplicate email rejection, login, wrong password, protected route access
- Expenses — CRUD, per-user data isolation (user A can never see user B's expenses), category filtering, summary aggregation
- Budgets — create/upsert, warning vs. exceeded alert thresholds, delete

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the full test suite and a frontend production build on every push — useful to show in a college submission or interview as evidence of CI/CD awareness.

---

## 📮 Postman Collection

A ready-to-import Postman collection covering all **19 endpoints** (Auth, Expenses, OCR, Budgets, Reports & AI) lives in `postman/`:

- `Smart-Expense-Tracker.postman_collection.json`
- `Smart-Expense-Tracker.postman_environment.json`

**Setup:**
1. In Postman: **Import** → select both files
2. Pick the **"Smart Expense Tracker - Local"** environment from the dropdown (top-right)
3. Make sure the backend is running at `http://localhost:5000` (edit the `baseUrl` variable if yours runs elsewhere, e.g. `http://localhost:5000` via Docker Compose)
4. Run **Auth → Register User** (or **Login User**) first — this automatically saves the JWT into the `token` variable, which every other request then uses automatically via Bearer auth
5. Run **Expenses → Create Expense** — auto-saves its `_id` into `expenseId`, used by the Get/Update/Delete-by-id requests
6. Run **Budgets → Set Budget** similarly auto-saves `budgetId`
7. For **OCR → Scan Bill**, manually attach a receipt image in the Body tab before sending (Postman collections can't embed a file automatically)

Each request also has built-in test scripts (status code checks, response shape assertions) — open the **Runner**, select the collection, and run it top-to-bottom for a full smoke test of the API in one click.

---

## 🧠 How the "AI" Parts Work (no paid APIs required)

**OCR bill scanning** (`backend/utils/ocrParser.js`):
- Tesseract.js runs OCR on the uploaded image entirely on your server (free, open-source, no API key)
- The raw text is then parsed with pattern-matching: looks for lines containing "total"/"grand total"/etc. to find the amount, detects DD/MM/YYYY and other date formats, and uses the first non-numeric line as the merchant name
- A simple keyword-rule engine auto-suggests a category (e.g. "mart"/"grocery" → Groceries, "uber"/"petrol" → Transport)
- The frontend always shows a review screen before saving, since OCR + regex isn't 100% reliable — user can correct any field

**Spending prediction** (`backend/utils/predictSpending.js`):
- Aggregates your expenses into monthly totals for the last 6 months
- Fits a linear regression line (`simple-statistics`) and extrapolates one month forward
- Reports confidence as `high`/`medium`/`low` based on the R² fit quality
- Falls back gracefully to a moving average if you have less than 3 months of data

**Anomaly detection**:
- For each category, computes a z-score of this month's spend vs. your historical mean/stddev for that category
- Flags anything more than 1.5 standard deviations above your normal pattern

> Note: These are transparent statistical methods, not black-box LLM calls — which makes them fast, free, run fully on your own server, and easy to explain to users ("why am I seeing this alert?").

---

## 🔧 Tech Stack Detail

**Backend**: Express, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `multer` (v2, receipt image uploads), `tesseract.js` (OCR), `simple-statistics` (regression/anomaly detection), `express-async-handler`

**Frontend**: React 18, React Router v6, Axios, Recharts (pie/bar/line charts), plain CSS (no framework — custom design system in `index.css`)

**Database**: MongoDB with 3 collections — `users`, `expenses`, `budgets` — indexed on `user` + `date`/`category` for fast aggregation queries

---

## 📈 Possible Next Steps (for going further "industry level")

- Add React Testing Library / Cypress tests for the frontend (backend already has Jest unit + integration coverage)
- Move receipt image storage to S3/Cloudinary instead of local disk for production deployments
- Add refresh tokens / token rotation for stronger auth
- Add CSV/PDF export for monthly reports
- Swap the regex-based OCR parser for a cloud vision API if higher accuracy is needed (trade-off: cost + external dependency)

---

## ⚠️ Notes

- The `uploads/` folder stores receipt images on local disk — fine for development, but use cloud storage in production
- OCR accuracy depends heavily on photo quality — blurry or skewed receipts may need manual correction (this is why the app always shows a review step)
- This is a learning/portfolio-ready project — read the "Next Steps" section above before treating it as production-hardened


---

## Copyright & Attribution

© 2026 Abhinav Kumar Singh. All rights reserved.

**Smart Expense Tracker / ExpenseAI** is an original full-stack
application developed by Abhinav Kumar Singh.

The original application-specific source code, architecture,
documentation, UI implementation, and original creative content
are proprietary to the copyright holder.

This repository is publicly available for viewing and evaluation.
No permission is granted to copy, redistribute, modify, publish,
or commercially reuse the original project without prior written
permission.

### Third-Party Components

This project uses third-party libraries, frameworks, APIs, and
services. Those components remain the property of their respective
authors and organizations and are governed by their respective
licenses and terms.

Third-party technologies include, but are not limited to:

- React
- Vite
- Node.js
- Express.js
- MongoDB / Mongoose
- JWT
- bcrypt
- Tesseract.js
- OpenAI API
- Resend
- Render

Their inclusion in this project does not transfer ownership of
those technologies to the project author.

---

© 2026 Abhinav Kumar Singh · Smart Expense Tracker / ExpenseAI