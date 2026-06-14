# 🏪 Store Management & Credit Ledger Application

A secure, MERN-stack store management system for small retail shops — track customer
credit ("due"/khata), log itemized transactions, manage a low-stock reorder list, and
keep a tamper-proof audit trail. Built for **single-owner** use with MFA, OAuth, and
ACID-safe MongoDB transactions.

---

## 📁 Project Structure

```
store-ledger/
├── backend/                  # Express.js + MongoDB API (port 5000)
│   ├── config/               # DB connection, Passport (OAuth/JWT) config
│   ├── controllers/           # Route handler logic
│   ├── middleware/            # Auth, MFA, re-auth guards
│   ├── models/                # Mongoose schemas (User, Customer, Transaction, Inventory)
│   ├── routes/                # Express routers
│   ├── utils/                 # Logger, email (Nodemailer), seed script
│   ├── logs/                  # Winston log files (auto-created)
│   ├── .env                   # ⚠️ YOU MUST FILL THIS IN
│   ├── package.json
│   └── server.js              # Entry point
│
├── frontend/                  # React 18 + Vite + Tailwind (port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   └── layout/DashboardLayout.jsx   # Sidebar + topbar shell
│   │   ├── context/authStore.js             # Zustand auth state (persisted)
│   │   ├── pages/                            # All route pages
│   │   ├── services/api.js                   # Axios instance + token refresh
│   │   ├── App.jsx                           # Routing
│   │   ├── main.jsx                          # App entry
│   │   └── index.css                         # Tailwind + design system
│   ├── .env                   # ⚠️ YOU MUST FILL THIS IN
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
└── .gitignore
```

---

## ✅ What's Implemented

### 1. Customer Credit & Transaction Ledger
- Customer profiles with unique `CUST-XXXXXXXX` IDs
- Per-customer running **Total Due** balance (auto-recalculated)
- Itemized transactions: product name, unit price, quantity → auto subtotal & total
- **Smart timestamping** with manual override (backdate any transaction via a
  `datetime-local` picker) — backdated entries are flagged with a "backdated" badge
- Payments reduce the due balance; credits increase it

### 2. Inventory / Reorder List
- Add items with category, current stock, reorder threshold, unit (kg, piece, etc.)
- **Optional** estimated wholesale cost field
- Auto status: `in_stock` / `low_stock` / `out_of_stock` based on stock vs. reorder level
- One-click restock

### 3. Security & Access Control
- **Single-owner enforcement**: registration & OAuth logins are rejected unless the
  email matches `OWNER_EMAIL` in `backend/.env`
- **MFA**: TOTP (Google Authenticator/Authy via QR code) + Email OTP fallback
- **JWT** access tokens (15 min) + refresh tokens (7 days) with auto-refresh on the frontend
- **Account lockout** after 5 failed login attempts (2-hour lock)
- **OAuth**: Google & Facebook login (restricted to owner email)
- **Immutable audit trail**: transactions can't be hard-deleted. "Voiding" a transaction
  requires re-entering your password (re-auth token), and the voided record stays
  permanently visible in the **Audit Log** page
- Helmet, rate-limiting, mongo-sanitize, CORS lockdown

### 4. Dashboard
- Total customers, total outstanding, monthly credit total, stock alerts
- Recent transactions chart (Recharts)
- Top debtors list

### Prerequisites
- Node.js 18+
- MongoDB (local install OR a free MongoDB Atlas cluster)

### 1. Backend Setup

```bash
cd backend
npm install
```

Then run:

```bash
npm run dev      # starts on http://localhost:5000 with nodemon
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Open `frontend/.env` and fill in:
- `VITE_GOOGLE_CLIENT_ID` — same Client ID as backend's `GOOGLE_CLIENT_ID`

Then run:

```bash
npm run dev      # starts on http://localhost:5173
```

### 4. (Optional) Seed Sample Data

After registering, run:
```bash
cd backend
npm run seed
```

---

## 🎨 Design System (Frontend)

- **Theme**: Dark glassmorphism with indigo/violet accent gradients
- **Fonts**: Plus Jakarta Sans (display), DM Sans (body), JetBrains Mono (numbers)
- All reusable styles are defined as Tailwind `@layer components` classes in
  `frontend/src/index.css` (`.glass-card`, `.btn-primary`, `.badge-*`, `.input-field`, etc.)
- Animations via Framer Motion

---

## 🚧 Known Limitations / Possible Next Steps

- The reset-password flow assumes the frontend route `/reset-password?token=...` —
  this is already wired up.
- Email sending requires valid SMTP credentials; without them, registration/OTP
  emails will fail (you'll see an error in backend logs but the account is still created).
- No automated test suite included yet (consider Jest + Supertest for backend,
  Vitest + React Testing Library for frontend).
- Currency is hardcoded to ₹ (INR) — change the symbol in the frontend pages if needed.
  and restrict CORS `FRONTEND_URL` to your real domain.

---

## 🐛 Troubleshooting

- **"Access denied. This system is restricted to the owner."** → Your login email
  doesn't match with owner email.
- **MongoDB connection error** → Check `MONGO_URI` and that MongoDB is running.
- **OAuth redirect fails** → Make sure the callback URLs registered in Google/Facebook
  developer consoles **exactly match** `GOOGLE_CALLBACK_URL` / `FACEBOOK_CALLBACK_URL`.
- **Emails not sending** → Gmail requires an **App Password**, not your normal password
  (requires 2FA enabled on the Google account first).
