# Cocos Challenge - Stock Trading Portfolio Management API

A NestJS-based stock trading and portfolio management API built with TypeORM and PostgreSQL.

---

## Overview

Stock trading platform API that allows users to:
- **Create trading orders**
- **Track portfolio positions**
- **Search instruments**

---

## Prerequisites

### Environment Setup
Create a `.env` file based on `.env.example`:

```env
# Database
DATABASE_URL=postgres://${user}:${password}@${domain}:${port}/${db_name}
DATABASE_SYNCHRONIZE=true
DATABASE_LOGGING=true
DATABASE_SSL=true # required to connect cocos DB

# Application
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### Pre requirements (or docker setup)
- **Node.js**: v20+
- **Yarn**: v3+

## Installation

```bash
# Clone the repository
git clone https://github.com/facundomigliorini/cocos-challenge.git
cd cocos-challenge

# Install dependencies
yarn install
```

---

## Running the Application

### Development Mode (with hot reload)
```bash
yarn start
```

### Watch Mode
```bash
yarn start --watch
```

The API will be available at `http://localhost:3000`

---

## Useful Links

### API Documentation (Swagger)
```
http://localhost:3000/docs
```

### Key Endpoints

**Orders**
- `POST /orders` - Create new order

**Portfolio**
- `GET /portfolio/:userId` - Get user portfolio

**Instruments**
- `GET /instruments` - Search instruments
