# 🇨🇴 VECO — Vehículos Eléctricos de Colombia

<p align="center">
  <img src="public/logo-veco-colombia.png" alt="VECO Logo" width="160" />
</p>

> **Veco** es un gestor de finanzas personales premium y de código abierto, especializado para propietarios de Vehículos Eléctricos (EV) en Colombia. Administra tus gastos de carga, monitorea la salud de tu batería y domina tu flujo financiero con una interfaz diseñada para el futuro de la movilidad.

---

## ✨ Características

- 🔋 **Optimizado para EV**: Módulos especializados para registrar sesiones de carga (kWh, SOC, Odómetro).
- ⚡ **Infraestructura con Neon**: Potenciado por Neon Postgres para branching instantáneo y escalabilidad serverless.
- 🔐 **Autenticación Segura**: Integración fluida con Google OAuth y Seguridad a Nivel de Fila (RLS).
- 🧹 **Autogestionado**: Limpieza automática (Garbage Collection) que mantiene un límite de 50 usuarios para hosting demo de costo cero.
- 🇨🇴 **Enfoque Local**: Diseñado para el mercado colombiano (Moneda COP, tipos de carga locales, branding nacional).
- 📱 **Mobile Ready**: Diseño listo para PWA, ideal para registrar gastos directamente en la estación de carga.

## 🛠️ Stack Tecnológico

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Base de Datos**: [PostgreSQL (Neon)](https://neon.tech/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: [Auth.js (NextAuth v5)](https://authjs.dev/)
- **Estilos**: Tailwind CSS + UI Neo-Glassmorphism personalizada
- **Despliegue**: Vercel + GitHub Actions

---

## 🚀 Inicio Rápido Local

### Requisitos Previos

- Node.js 20+
- Una cuenta en [Neon.tech](https://neon.tech) (o Postgres local)
- Proyecto en Google Cloud Console (para OAuth)

### Instalación

1. **Clona el repositorio:**
   ```bash
   git clone https://github.com/jorgelopez21/veco.git
   cd veco
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Configuración de Entorno:**
   Crea un archivo `.env` basado en tus credenciales:
   ```env
   DATABASE_URL="postgresql://..."
   DIRECT_URL="postgresql://..."
   NEXTAUTH_SECRET="tu-secreto"
   GOOGLE_CLIENT_ID="tu-google-id"
   GOOGLE_CLIENT_SECRET="tu-google-secret"
   NEXT_PUBLIC_ALLOW_DEV_BYPASS="true"
   ```

4. **Inicializa la Base de Datos:**
   ```bash
   npx prisma db push
   ```

5. **Lanza el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

Visita `http://localhost:3000` para ver tu instancia local.

---

## 🛡️ Restricciones del Demo

Este demo está configurado para un **lanzamiento público de bajo mantenimiento**:
- **Capacidad**: Autolimitado a 50 usuarios activos.
- **Limpieza**: Los usuarios inactivos por más de 30 días se eliminan automáticamente para liberar espacio.
- **Bypass de Desarrollo**: En modo local, se proporciona un acceso rápido para pruebas sin necesidad de OAuth.

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Si tienes ideas para mejorar la analítica de carga o la interfaz general, no dudes en abrir un PR.

---

## 👨‍💻 Autor

**Jorge Lopez** — *Senior DevOps Engineer*
[minube.dev](https://minube.dev)

---

---

# 🇺🇸 VECO — Electric Vehicles of Colombia

> **Veco** is an open-source, premium personal finance manager specifically designed for Electric Vehicle (EV) owners in Colombia. Track your charging costs, monitor battery health, and master your financial flow with an interface designed for the future of mobility.

## ✨ Features

- 🔋 **EV Optimized**: Specialized modules to record charging sessions (kWh, SOC, Odometer).
- ⚡ **Neon Infrastructure**: Powered by Neon Postgres for instant branching and serverless scalability.
- 🔐 **Secure Auth**: Seamless integration with Google OAuth and Row-Level Security (RLS).
- 🧹 **Self-Managed**: Automated Garbage Collection that maintains a 50-user limit for zero-cost demo hosting.
- 🇨🇴 **Local Focus**: Tailored for the Colombian market (COP currency, local charging types, national branding).
- 📱 **Mobile Ready**: PWA-ready design, ideal for logging expenses directly at the charging station.

## 🚀 Local Quick Start

### Prerequisites

- Node.js 20+
- A [Neon.tech](https://neon.tech) account (or local Postgres)
- Google Cloud Console project (for OAuth)

### Installation

1. **Clone the repo:**
   ```bash
   git clone https://github.com/jorgelopez21/veco.git
   cd veco
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Database Initialization:**
   ```bash
   npx prisma db push
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

---

## 👨‍💻 Author

**Jorge Lopez** — *Senior DevOps Engineer*
[minube.dev](https://minube.dev)

---

*Developed with precision in Antioquia, Colombia 🇨🇴*
