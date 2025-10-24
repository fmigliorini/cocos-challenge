# 🗄️ Database Improvements Guide

Guide for database schema enhancements for the Cocos Challenge trading platform. 

---

## 📋 Table of Contents

1. [Users Table](#1-users-table)
2. [Orders Table](#2-orders-table)
3. [Instruments Table](#3-instruments-table)
4. [MarketData Table](#4-marketdata-table)
5. [Summary & Benefits](#summary--benefits)

---

## 1. Users Table

### 1.1 Add Timestamps

**SQL:**
```sql
ALTER TABLE users ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
```

**Purpose:**
- Record when users were created
- Track when user information was updated

---

### 1.2 Unique Email Constraint

**SQL:**
```sql
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE(email);
```

**Purpose:**
- Ensure each email address belongs to exactly one user
- Prevent duplicate user accounts


**Important Note:**
> For challenge purposes, the email index may not be strictly necessary from a performance point of view but you want it to avoid duplications

---

## 2. Orders Table

### 2.1 Add Lifecycle Timestamps and Soft Delete

**SQL:**
```sql
ALTER TABLE orders ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
```

**Purpose:**
- `created_at`: Know when order was placed
- `updated_at`: Track order state transitions (NEW → FILLED, etc.)
- `deleted_at`: Soft delete - mark as deleted without losing data


### 2.2 Add Validation Constraints

**Size Validation:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_size CHECK (size > 0);
```

**Purpose:** Order quantity must be positive (can't buy/sell -10 shares)

**Price Validation:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_price CHECK (price IS NULL OR price >= 0);
```

**Purpose:** Price must be non-negative or NULL (NULL for MARKET orders)

**Type Validation:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_type CHECK (type IN ('MARKET', 'LIMIT'));
```

**Purpose:** Only 2 valid order types in system

**Status Validation:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_status CHECK 
  (status IN ('NEW', 'FILLED', 'REJECTED', 'CANCELLED'));
```

**Purpose:** Restrict to valid order states

**Side Validation:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_side CHECK 
  (side IN ('BUY', 'SELL', 'CASH_IN', 'CASH_OUT'));
```

**Purpose:** Restrict to valid transaction directions

---

### 2.3 Semantic Business Rule Constraint (key for the challenge)

**SQL:**
```sql
ALTER TABLE orders ADD CONSTRAINT ck_orders_type_status CHECK 
  (NOT (type = 'MARKET' AND status = 'NEW'));
```

**Purpose:**
- MARKET orders execute immediately → cannot be NEW (impossible state)
- LIMIT orders wait for execution → can be NEW
- Prevent logically inconsistent order states


---

### 2.4 Performance Indexes

**User + Status + DateTime Index:**
```sql
CREATE INDEX idx_orders_user_status_dt ON orders(userid, status, datetime);
```

**Purpose:** Speed up portfolio and order history queries
- Most common query: "Get all FILLED orders for user 123"


**User + Instrument + Status Index:**
```sql
CREATE INDEX idx_orders_user_inst_status ON orders(userid, instrumentid, status);
```

---

## 3. Instruments Table

### 3.1 Add Timestamps and Enable Flag

**SQL:**
```sql
ALTER TABLE instruments ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE instruments ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE instruments ADD COLUMN enabled BOOLEAN DEFAULT true;
```

**Purpose:**
- Track when instruments were added to system
- Know when instrument information was updated

### 3.2 Add Search and Filter Indexes

**Ticker Index:**
```sql
CREATE INDEX idx_instruments_ticker ON instruments(ticker);
```

**Purpose:** Speed up instrument search by ticker

**Type Index:**
```sql
CREATE INDEX idx_instruments_type ON instruments(type);
```

**Purpose:** Speed up filtering by instrument type


---

## 4. MarketData Table

### 4.1 Add Timestamp

**SQL:**
```sql
ALTER TABLE marketdata ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
```

**Purpose:**
- Track when price data was recorded
- Verify data freshness and recency

---

### 4.2 Add Unique Constraint

**SQL:**
```sql
CREATE UNIQUE INDEX idx_marketdata_inst_date ON marketdata(instrumentid, date);
```

**Purpose:**
- Ensure exactly ONE price record per instrument per day