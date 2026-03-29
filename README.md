# Infinita OOD – Logistics Management System

Система за управление на логистиката на **Инфинита ООД** — внос/износ на медицинска апаратура между България, Гърция, Румъния и ЕС.

## Технологии

| Слой | Технологии |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, better-sqlite3 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deploy | Railway (два отделни service-а) |

---

## Локална разработка

### Изисквания
- Node.js 20+ (препоръчително) или 22/24 LTS
- npm 9+

### 1. Клониране

```bash
git clone https://github.com/your-org/infinita-logistic.git
cd infinita-logistic
```

### 2. Backend

```bash
cd backend
npm install
npm run seed:2026      # Зарежда тестови данни Q1 2026
npm run dev            # Стартира на http://localhost:5000
```

Налични credentials след seed:
| Потребител | Парола | Роля |
|---|---|---|
| `admin` | `Admin123!` | Администратор |
| `manager` | `Manager123!` | Мениджър |
| `ivanova` | `Pass123!` | Служител |

### 3. Frontend

```bash
cd frontend
npm install
npm run dev            # Стартира на http://localhost:3000
```

---

## Deploy на Railway

Проектът се deploy-ва като **два отделни service-а** в Railway.

### Предварително: Railway CLI

```bash
npm install -g @railway/cli
railway login
```

### Service 1 – Backend

1. В Railway Dashboard → **New Project** → **Deploy from GitHub repo**
2. Избери repo-то, **Root Directory** → `backend`
3. Railway автоматично засича `railway.toml`

**Environment Variables** (Settings → Variables):

```
NODE_ENV=production
JWT_SECRET=<генерирай с: openssl rand -base64 48>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://<frontend-service>.up.railway.app
DB_PATH=/data/infinita.db
```

**Volume за SQLite** (важно – без него DB се изтрива при всеки deploy):
- Settings → **Volumes** → Add Volume
- Mount Path: `/data`

**Seed при първи deploy** – в Railway Console:
```bash
npm run seed:2026
```

### Service 2 – Frontend

1. **New Service** в същия project → **Deploy from GitHub repo**
2. **Root Directory** → `frontend`
3. Railway засича `railway.toml` автоматично

**Environment Variables**:

```
VITE_API_URL=https://<backend-service>.up.railway.app/api
```

> Взимаш backend URL от Settings на backend service → Networking → Public Domain.

### Свързване на двата service-а

След deploy на backend:
1. Копирай публичния URL на backend service
2. Добави го като `FRONTEND_URL` в backend variables
3. Добави го като `VITE_API_URL` в frontend variables (с `/api` накрая)
4. **Redeploy** и двата service-а

---

## Структура на проекта

```
infinita-logistic/
├── backend/
│   ├── src/
│   │   ├── controllers/     # authController, shipmentsController, ...
│   │   ├── database/
│   │   │   ├── db.js        # SQLite schema + connection
│   │   │   ├── seed.js      # Начални данни
│   │   │   └── seed2026.js  # Данни Q1 2026 (20 пратки)
│   │   ├── middleware/
│   │   └── routes/
│   ├── server.js
│   ├── railway.toml
│   ├── Procfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/           # Dashboard, Shipments, Financial, ...
│   │   ├── components/
│   │   └── utils/
│   ├── railway.toml
│   └── .env.example
├── .gitignore
├── Procfile                  # Root-ниво (fallback)
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Описание |
|---|---|---|
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущ потребител |
| GET | `/api/shipments` | Списък пратки (с филтри) |
| POST | `/api/shipments` | Нова пратка |
| GET | `/api/shipments/stats` | Статистики (поддържа `?country=BG/GR`) |
| GET | `/api/couriers` | Куриери |
| GET | `/api/financial/dashboard` | Финансово резюме |
| GET | `/api/hs-codes` | HS кодове |
| GET | `/health` | Health check |

---

## Бележки за production

- **SQLite** е подходящ за малки екипи (до ~20 потребителя). При по-голям мащаб мигрирай към PostgreSQL (Railway го поддържа нативно).
- **JWT_SECRET** трябва да е минимум 32 символа случаен string.
- **DB Volume** е задължителен — без него базата се нулира при всеки deploy.
- Frontend се serve-ва като статични файлове чрез `serve` пакета.
