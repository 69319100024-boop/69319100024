# Security Specification — DBTech Ledger (Firestore `db-1ffd6`)

## 1. Data Invariants
1. **Verified Google Identity Required**: Every read and write operation requires `request.auth != null` and `request.auth.token.email_verified == true`.
2. **Strict PII & Record Isolation**:
   - `users/{userId}` can ONLY be read (`get`), created, or updated by the owner (`request.auth.uid == userId`). `allow list` on `users` is permanently `false` to prevent user enumeration.
   - `transactions/{transactionId}` can ONLY be read (`get`, `list`), created, updated, or deleted when `userId == request.auth.uid`.
   - `budgets/{budgetId}` can ONLY be read (`get`, `list`), created, updated, or deleted when `userId == request.auth.uid`, and `budgetId` must match `^[a-zA-Z0-9_\-]+$`.
3. **Referential & Immutable Ownership Integrity**:
   - Creating a `Transaction` or `MonthlyBudget` requires that the parent `users/{request.auth.uid}` document exists (`exists(...)`), preventing orphaned records.
   - `userId`, `uid`, and `createdAt` are immutable once created.
4. **Temporal Integrity**:
   - `createdAt` MUST equal `request.time` on create.
   - `updatedAt` MUST equal `request.time` on both create and update.
5. **Volumetric & Schema Strictness**:
   - Every key is explicitly allowlisted via `hasAll` + `hasOnly` on create and `affectedKeys().hasOnly(...)` on update.
   - All string fields enforce `size()` bounds and regex patterns (`date`, `monthKey`, document IDs).
   - Monetary amounts enforce strict numeric ranges (`amount > 0 && amount <= 1000000000` for transactions; `>= 0 && <= 1000000000` for budgets).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return `PERMISSION_DENIED`)
1. **Unauthenticated Read/Write**: Attempting `get` or `create` on `/transactions/tx1` with `auth == null`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` attempting to create a `Transaction` or `UserProfile`.
3. **Cross-Tenant Identity Spoofing (Create)**: User A (`uid: "userA"`) creating `/transactions/tx2` with `userId: "userB"`.
4. **Cross-Tenant Ownership Hijack (Update)**: User A attempting to update User B's transaction or mutate `userId` from `"userA"` to `"userB"`.
5. **User Enumeration Scrape (`list /users`)**: Any authenticated user attempting `list` on `/users`.
6. **Unscoped Transaction Scrape (`list /transactions`)**: Querying `/transactions` without `where("userId", "==", request.auth.uid)`.
7. **Shadow / Ghost Field Injection**: Creating or updating a transaction with an extra undeclared field `{ ..., isAdmin: true }` or `{ ..., verified: true }`.
8. **ID Poisoning / Resource Exhaustion**: Writing to `/transactions/` with a 150-character document ID or invalid characters (`tx$bad/id`).
9. **Type & Value Poisoning**: Creating a transaction with negative `amount: -500`, `amount: "1000"` (string), or a `title` exceeding 120 characters.
10. **Client Timestamp Forgery**: Creating a transaction with a backdated `createdAt` instead of `request.time`, or mutating `createdAt` on update.
11. **Malformed Date / MonthKey Consistency Bypass**: Creating a transaction with `date: "2026-11-15"` and `monthKey: "2025-01"` (mismatched `monthKey` prefix) or invalid regex `"15/11/2026"`.
12. **Orphaned Transaction Creation**: Creating a transaction before the owner's `/users/{uid}` profile document exists.
