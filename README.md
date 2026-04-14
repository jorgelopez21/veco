# 📊 VECO Finance Manager

VECO es una aplicación moderna de gestión financiera personal construida con **Next.js 15**, **Prisma** y **Tailwind CSS**. Permite rastrear ingresos, gastos, deudas y específicamente optimizado para el seguimiento de recargas de vehículos eléctricos (EV).

## 🚀 Despliegue Local

### Requisitos Previos
- Node.js 18+ instalado
- Instancia de PostgreSQL (Local o en la nube como Neon.tech)
- Cuenta en Google Cloud Console (Opcional para desarrollo local)
- Cloudflare Turnstile (Opcional para desarrollo local)

### 1. Clonar e Instalar
```bash
git clone <url-del-repo>
cd apps/veco
npm install
```

### 2. Configuración de Variables de Entorno
Crea un archivo `.env` en la raíz de `apps/veco` basado en el siguiente template:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/veco"
DIRECT_URL="postgresql://user:password@localhost:5432/veco" # Requerido para migraciones en Neon

# NextAuth (Autenticación)
AUTH_SECRET="tu_secreto_generado" # Genera con: openssl rand -base64 32
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="tu_client_id.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="tu_client_secret"

# Cloudflare Turnstile (Si se dejan vacíos, se desactivan automáticamente en local)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=""
TURNSTILE_SECRET_KEY=""
```

> [!IMPORTANT]
> **Bypass de Desarrollador (Solo en Local/Dev):** En ambiente de desarrollo (`NODE_ENV=development`), verás una sección naranja en el login que permite iniciar sesión sin Google OAuth. Este bypass es dinámico: si ya existe un usuario en tu base de datos local (ej. después de ejecutar el script SQL), el sistema te logueará automáticamente con el ID de ese usuario para que veas tus datos. Si la DB está vacía, usará un perfil genérico.

> [!WARNING]
> **Cloud Run y Turnstile:** Si obtienes un error de conexión en el widget de Turnstile tras desplegar en Cloud Run, verifica que la URL autogenerada del servicio (`https://veco-app-....a.run.app`) esté registrada en el panel de Cloudflare. Turnstile bloquea el widget si no reconoce el hostname exacto.

### 3. Inicializar Base de Datos
Tienes dos opciones para preparar la base de datos:

**Opción A: Usando Prisma (Recomendado)**
```bash
npx prisma migrate dev
```

**Opción B: Usando SQL Manual**
Si prefieres no usar el CLI de Prisma inicialmente, puedes ejecutar el script localizado en `prisma/structure.sql` directamente en tu cliente PostgreSQL. Este script incluye **datos de ejemplo** (categorías y cuentas) para facilitar el inicio rápido.

### 4. Ejecutar Aplicación
```bash
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

## 🗄️ Estructura de la Base de Datos
La aplicación utiliza PostgreSQL. Los modelos principales son:
- **User**: Gestión de perfiles y OAuth.
- **BankAccount**: Cuentas bancarias, efectivo y deudas (Tarjetas de crédito).
- **Transaction**: Registro de movimientos de dinero.
- **Category**: Clasificación de gastos e ingresos.
- **EV Stats**: Soporte especial para descripciones con prefijo `EV:` para cálculos de eficiencia energética.

## 🔐 Autenticación y Seguridad
- **Auth.js (NextAuth)**: Implementa Google OAuth para un inicio de sesión seguro.
- **Turnstile**: Protege la página de login contra bots.
- **Middleware**: Todas las rutas de `/finance` están protegidas y requieren sesión activa.

## 🐳 Despliegue con Docker
El proyecto incluye un `Dockerfile` optimizado:
```bash
docker build -t veco-app .
docker run -p 3000:3000 --env-file .env veco-app
```

## 🛠️ Desarrollo
- **Linting**: `npm run lint`
- **Formateo**: `npx prettier --write .`
- **Pruebas**: El proyecto utiliza Vitest para pruebas unitarias.
