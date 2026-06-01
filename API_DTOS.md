# Smart Voice Expense Manager - API DTO Specification

This document provides the formal **Data Transfer Object (DTO)** specifications for the Smart Voice Expense Manager mobile client to integrate with a remote backend service.

---

## 🔀 API Endpoint Mapping

Below is the mapping of REST API endpoints utilized by the mobile client:

| Endpoint | HTTP Method | Request Payload DTO | Response Payload DTO | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/transactions` | `GET` | *(Query Params)* | `TransactionListResponseDTO` | Paginated listing with search & filters |
| `/api/transactions` | `POST` | `CreateTransactionDTO` | `TransactionDTO` | Record a new ledger entry |
| `/api/transactions/{id}` | `GET` | *None* | `TransactionDTO` | Fetch detailed single transaction audit |
| `/api/transactions/{id}` | `PUT` | `UpdateTransactionDTO` | `TransactionDTO` | Edit metadata for a transaction |
| `/api/transactions/{id}` | `DELETE` | *None* | `{ success: boolean }` | Purge a transaction from records |
| `/api/voice/parse` | `POST` | `VoiceParseRequestDTO` | `VoiceParseResponseDTO` | Parses raw voice transcript into ledger schemas |
| `/api/budget` | `GET` | *None* | `BudgetDTO` | Fetch monthly target allocations |
| `/api/budget` | `PUT` | `UpdateBudgetDTO` | `BudgetDTO` | Sync monthly target threshold adjustments |
| `/api/profile` | `GET` | *None* | `UserProfileDTO` | Sync active user parameters and layout choices |
| `/api/profile` | `PUT` | `UpdateUserProfileDTO` | `UserProfileDTO` | Modify profile preferences |

---

## 💾 Core Ledger DTO Specifications

### 1. TransactionDTO
Unified database structure representing a recorded expense or income transaction.

```typescript
export interface TransactionDTO {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;       // ISO 8601 Date: YYYY-MM-DD
  notes: string | null;
  userId: string;
  createdAt: string;  // ISO 8601 Timestamp YYYY-MM-DDTHH:MM:SSZ
  updatedAt: string;  // ISO 8601 Timestamp YYYY-MM-DDTHH:MM:SSZ
}
```

### 2. CreateTransactionDTO
Payload sent by the mobile app client to insert a manual entry or commit parsed voice commands.

```typescript
export interface CreateTransactionDTO {
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;        // Format: YYYY-MM-DD
  notes?: string | null;
}
```

### 3. UpdateTransactionDTO
Allows partial updates to existing ledger fields.

```typescript
export interface UpdateTransactionDTO {
  title?: string;
  amount?: number;
  type?: "income" | "expense";
  category?: string;
  date?: string;
  notes?: string | null;
}
```

### 4. TransactionListResponseDTO
Enables responsive scroll listing and server-side data loading filters.

```typescript
export interface TransactionListResponseDTO {
  transactions: TransactionDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 🎙 Voice Assistant & NLP Parsing DTOs

Offloads the voice-command text processing to a remote AI service to parse raw user statements into valid financial entries.

### 1. VoiceParseRequestDTO
```typescript
export interface VoiceParseRequestDTO {
  text: string;
  /** Browser or device timezone offset in minutes to help parse relative dates like "yesterday" or "today" correctly */
  timezoneOffset?: number; 
}
```

### 2. VoiceParseResponseDTO
```typescript
export interface VoiceParseResponseDTO {
  success: boolean;
  /** High confidence parsing model values ready for validation & entry */
  data: CreateTransactionDTO | null;
  /** Confidence score between 0.0 and 1.0 */
  confidence: number;
  /** Transcribed or input raw query string */
  rawText: string;
  /** Optional matching category suggestions */
  suggestedCategories?: string[];
}
```

---

## 📊 Budget Allocation & Profiles DTOs

### 1. BudgetDTO & UpdateBudgetDTO
Tracks financial compliance boundaries.

```typescript
export interface BudgetDTO {
  userId: string;
  monthlyLimit: number;
  currency: string;    // ISO 4217 code, e.g. "USD", "VND"
  updatedAt: string;
}

export interface UpdateBudgetDTO {
  monthlyLimit: number;
}
```

### 2. UserProfileDTO & UpdateUserProfileDTO
Keeps preferences synced.

```typescript
export interface UserProfileDTO {
  id: string;
  email: string;
  name: string;
  notificationsEnabled: boolean;
  biometricsEnabled: boolean;
  localSyncEnabled: boolean;
  createdAt: string;
}

export interface UpdateUserProfileDTO {
  name?: string;
  notificationsEnabled?: boolean;
  biometricsEnabled?: boolean;
  localSyncEnabled?: boolean;
}
```
