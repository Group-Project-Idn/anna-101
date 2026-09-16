# S&P 500 AI Dashboard API Documentation

## Base URL
```
http://localhost:3000/api
```

> **Note:** All responses use JSON. Every error follows the standard format:
> ```json
> { "message": "Error description." }
> ```

## Authentication
All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

If the token is missing, invalid, or the user is not found, the API returns:
```json
{
  "message": "Unauthorized."
}
```

---

## Auth Endpoints

### POST /auth/register
Register a new account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Success Response (201):**
```json
{
  "message": "Registration successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 400 | Missing email/password/name | `Email, password, and name are required.` |
| 400 | Password shorter than 5 characters | `Password must be at least 5 characters.` |
| 400 | Email already registered | `Email already registered.` |
| 400 | Sequelize validation error (invalid email, etc.) | varies |
| 400 | Unique constraint / FK violation from the database | `Invalid input.` |

---

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 400 | Missing email/password | `Email and password are required.` |
| 401 | Email not registered / wrong password | `Invalid email or password.` |
| 401 | Account created via Google Sign In | `This account uses Google Sign In.` |

---

### POST /auth/google
Login with Google OAuth.

**Request Body:**
```json
{
  "id_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "message": "Google Sign In successful.",
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatar_url": "https://..."
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 400 | `id_token` not sent | `ID token is required.` |
| 401 | `id_token` invalid | `Invalid Google ID token.` |
| 503 | `GOOGLE_CLIENT_ID` not configured | `Google Sign In not configured. Please set GOOGLE_CLIENT_ID in environment variables.` |

---

### GET /auth/me
Get the profile of the currently logged-in user. **Requires Auth**

**Success Response (200):**
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 401 | Missing / invalid token or user not found | `Unauthorized.` |

---

### PUT /auth/me
Update user profile. **Requires Auth**

**Request Body:**
```json
{
  "name": "New Name",
  "avatar_url": "https://..."
}
```

> Both `name` and `avatar_url` are optional; only the fields sent in the request are updated.

**Success Response (200):**
```json
{
  "message": "Profile updated successfully.",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "New Name",
    "avatar_url": "https://..."
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 401 | Missing / invalid token or user not found | `Unauthorized.` |
| 400 | `name` sent but empty | `Name cannot be empty.` |

---

## Stock Endpoints

### GET /stocks
Get all stocks.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `sector` | string | Filter by sector. Any value other than `"All"` filters the results (optional) |

**Success Response (200):**
```json
{
  "stocks": [
    {
      "id": 1,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "price": 150.00,
      "change": 2.50,
      "change_percent": 1.69
    }
  ]
}
```

---

### GET /stocks/:symbol
Get stock details by symbol.

**Success Response (200):**
```json
{
  "id": 1,
  "symbol": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "exchange": "NASDAQ",
  "country": "US",
  "logo_url": "https://logo.png",
  "market_cap": 2800000,
  "pe_ratio": 28.5,
  "week52_high": 180.00,
  "week52_low": 120.00,
  "beta": 1.29,
  "quote": {
    "current_price": 150.50,
    "change": 2.50,
    "change_percent": 1.67,
    "high": 152.00,
    "low": 148.00,
    "open": 149.00,
    "previous_close": 147.50
  }
}
```

> If the stock has no quote, `quote` is `null`.
> If fundamentals (`market_cap`, etc.) are not yet in the database, the server automatically fetches them from Finnhub for non-crypto stocks.

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 404 | Symbol does not exist | `Stock not found.` |

---

### GET /stocks/:symbol/history
Get historical candlestick price data.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `range` | string | Time range: `1m`, `3m`, `1y`, `5y` | `1m` |
| `interval` | string | Candle interval: `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`, `1M` | `1d` |

**Success Response (200):**
```json
{
  "data": [
    {
      "datetime": "2024-01-01T00:00:00.000Z",
      "open": 150.00,
      "high": 155.00,
      "low": 148.00,
      "close": 152.00,
      "volume": 1000000
    }
  ]
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 404 | Symbol does not exist | `Stock not found.` |

> If the history data is empty in the database, the server automatically fetches it from Twelve Data and saves it.

---

### GET /stocks/:symbol/news
Get news related to a stock.

**Query Parameters:**
| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `limit` | number | Number of news items requested | `10` |

**Success Response (200):**
```json
{
  "articles": [
    {
      "headline": "Apple announces new product",
      "summary": "...",
      "source": "Reuters",
      "url": "https://...",
      "image_url": "https://...",
      "published_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 404 | Symbol does not exist | `Stock not found.` |

---

### GET /stocks/:symbol/insight
Get the AI-generated insight for a stock.

**Success Response (200):**
```json
{
  "summary": "Apple shows strong growth potential...",
  "sentiment": "bullish",
  "confidence": 85,
  "keyPoints": [
    "Strong Q4 earnings",
    "New product pipeline"
  ],
  "risk_note": "Market volatility may affect short-term performance"
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 404 | Symbol does not exist | `Stock not found.` |
| 404 | Insight not yet available (AI failed) | `AI insight not available.` |
| 503 | Gemini not configured / overloaded | `AI service not configured...` or a message from Gemini |

---

## Market Endpoints

### GET /market/movers
Get the stocks with the biggest price changes (gainers & losers).

**Success Response (200):**
```json
{
  "gainers": [
    {
      "id": 10,
      "symbol": "NVDA",
      "name": "NVIDIA Corporation",
      "sector": "Technology",
      "price": 880.50,
      "change": 25.00,
      "change_percent": 2.92
    }
  ],
  "losers": [
    {
      "id": 5,
      "symbol": "KO",
      "name": "The Coca-Cola Company",
      "sector": "Consumer Staples",
      "price": 59.80,
      "change": -1.20,
      "change_percent": -1.97
    }
  ]
}
```

---

## Watchlist Endpoints (Require Auth)

### GET /watchlist
Get the user's watchlist. **Requires Auth**

**Success Response (200):**
```json
{
  "watchlist": [
    {
      "id": 1,
      "stock_id": 10,
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "sector": "Technology",
      "price": 150.00,
      "change_percent": 1.69,
      "added_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 401 | Missing / invalid token | `Unauthorized.` |

---

### POST /watchlist
Add a stock to the watchlist. **Requires Auth**

**Request Body:**
```json
{
  "stock_id": 10
}
```

**Success Response (201):**
```json
{
  "message": "Stock added to watchlist.",
  "data": {
    "id": 3,
    "stock_id": 10,
    "added_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 401 | Missing / invalid token | `Unauthorized.` |
| 400 | `stock_id` not sent | `stock_id is required.` |
| 400 | Stock already in the watchlist | `Stock already in watchlist.` |
| 404 | Stock not found | `Stock not found.` |

---

### DELETE /watchlist/:stock_id
Remove a stock from the watchlist. **Requires Auth**

**Success Response (200):**
```json
{
  "message": "Stock removed from watchlist."
}
```

**Common Errors:**
| Code | Condition | Message |
|------|-----------|---------|
| 401 | Missing / invalid token | `Unauthorized.` |
| 404 | Item not in the watchlist | `Stock not found in watchlist.` |

---

## Health Check

### GET /health
Check API status.

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Error Codes
The following status codes can be returned by the API:

| Code | Description |
|------|-------------|
| 400 | Bad Request — invalid body/query or validation failure |
| 401 | Unauthorized — missing/invalid token or wrong credentials |
| 404 | Not Found — resource not found |
| 503 | Service Unavailable — external service (Google/Gemini) unavailable |

> **Note:** `403 Forbidden`, `409 Conflict`, and `500 Internal Server Error` are **not** produced by the API at this time.
> - `403` is not used anywhere in production code (only a fallback in the error handler).
> - `409` is not used — duplicate watchlist entries actually return `400 Bad Request`.
> - `500` only appears from unexpected errors; Express's default handler returns HTML, not JSON.

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx jest --detectOpenHandles --forceExit --testPathPatterns='__test__/auth.test.js'

# Run with coverage
npm test -- --coverage
```