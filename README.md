# 🇨🇴 VECO — Vehículos Eléctricos de Colombia

![VECO Logo](public/logo-veco-colombia.png)

> **Veco** is a premium, open-source personal finance tracker specialized for Electric Vehicle (EV) owners in Colombia. Manage your charging expenses, track battery health, and master your financial flow with an interface designed for the future of mobility.

---

## ✨ Features

- 🔋 **EV Optimized**: Specialized modules for tracking charging sessions (kWh, SOC, Odometer).
- ⚡ **Neon Infrastructure**: Powered by Neon Postgres for instant branching and serverless scalability.
- 🔐 **Secure Auth**: Seamless Google OAuth integration and Row Level Security (RLS).
- 🧹 **Self-Managing**: Integrated garbage collection that maintains a 50-user capacity for zero-cost demo hosting.
- 🇨🇴 **Local First**: Built with the Colombian market in mind (COP currency, energy charging types, local branding).
- 📱 **Mobile Ready**: PWA-ready design for recording expenses on the go, directly at the charging station.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Database**: [PostgreSQL (Neon)](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [Auth.js (NextAuth v5)](https://authjs.dev/)
- **Styling**: Tailwind CSS + Custom Neo-Glassmorphism UI
- **Deployment**: Vercel + GitHub Actions

---

## 🚀 Getting Started Locally

### Prerequisites

- Node.js 20+
- A [Neon.tech](https://neon.tech) account (or local Postgres)
- Google Cloud Console Project (for OAuth)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jorgelopez21/veco.git
   cd veco
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file based on your credentials:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   NEXTAUTH_SECRET="your-secret"
   GOOGLE_CLIENT_ID="your-google-id"
   GOOGLE_CLIENT_SECRET="your-google-secret"
   NEXT_PUBLIC_ALLOW_DEV_BYPASS="true"
   ```

4. **Initialize Database:**
   ```bash
   npx prisma db push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see your local instance.

---

## 🛡️ Demo Constraints

This demo is configured for **low-maintenance public release**:
- **Capacity**: Auto-limited to 50 active users.
- **Cleanup**: Users inactive for more than 30 days are automatically removed to free up database space.
- **Developer Bypass**: In development mode, a secure bypass is provided for rapid testing without OAuth.

---

## 🤝 Contributing

Contributions are welcome! If you have ideas for improving the EV charging analytics or general UI, feel free to open a PR.

---

## 👨‍💻 Author

**Jorge Lopez** — *Senior DevOps Engineer*
[minube.dev](https://minube.dev)

---

*Built with precision in Colombia 🇨🇴*
