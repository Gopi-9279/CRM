# Mini CRP (Operations ERP)

A lightweight Cloud Resource Planning (CRP) / Enterprise Resource Planning (ERP) platform optimized for operations, inventory management, and fulfillment.

## Features

- **Auth & Access Control**: JWT-based authentication with Role-Based Access Control (Admin, Sales, Operations).
- **Core Reference Data**: Manage `Locations`, `Categories`, and `Items`.
- **Inventory & Batch Tracking**: High-concurrency tracking of item stock across multiple locations, separated by batches.
- **Internal Transfers**: Orchestrate stock movement between physical locations with a dispatch/receive state machine.
- **Customer Orders & Fulfillment**: Process sales orders by creating active stock reservations.
- **Work Orders**: Light manufacturing/assembly orders that deduct required component inventory.

## Tech Stack

### Backend
- **Node.js + Express** (TypeScript)
- **Prisma ORM**
- **PostgreSQL**
- **Jest & Supertest** for integration testing

### Frontend
- **React 18** (Vite + TypeScript)
- **Tailwind CSS**
- **React Router**
- **Axios**

---

## Getting Started

### 1. Prerequisites
- Docker & Docker Compose (for the PostgreSQL database)
- Node.js v18+

### 2. Database Setup
Start the local PostgreSQL database using Docker Compose:
```bash
docker-compose up -d
```

### 3. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
npm install
```

Copy the example environment file:
```bash
cp .env.example .env
```

Run database migrations and seed the database with default data (including the default `admin@example.com` user):
```bash
npm run prisma:generate
npm run migrate:dev
npm run seed
```

Start the backend development server:
```bash
npm run dev
```

### 4. Frontend Setup
In a new terminal window, navigate to the `frontend` directory:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The application will typically run at `http://localhost:5173`.

### 5. Default Credentials
Use the following credentials seeded in the database to log in:
- **Email:** `admin@example.com`
- **Password:** `password123`

---

## Testing

The backend includes a comprehensive integration test suite. Due to the high-concurrency pessimistic locking (`SELECT ... FOR UPDATE`) mechanisms, the tests **must** be run sequentially using `--runInBand` to avoid database transaction deadlocks between parallel test executions.

To run the tests:
```bash
cd backend
npm run test
```
*(This maps to `jest --runInBand`)*

## Documentation
For deep technical specifications, refer to the `Mini_Operations_ERP_Technical_Specification.md` in the root directory.
