# OnlyMemes Security Specification

## 1. Data Invariants
- **User Privacy**: Each user's document in `/users/{email}` is only accessible by that user or an admin.
- **Balance Integrity**: Users cannot modify their own `balance` field. Balances are updated via server-side logic (future) or through specific admin operations. *Note: Currently client-side logic is used, so we need strict action-based update gates.*
- **Market Integrity**: Market prices and order books (`/markets/{marketId}`) are publicly readable but only writable by admins or via validated trading actions.
- **Task Verification**: Users can append to their task proof history but cannot overwrite existing proofs.
- **Withdrawal Security**: Withdrawals follow a strict 'Pending' -> 'Completed/Failed' state flow. Only admins can transition to terminal states.

## 2. "Dirty Dozen" Payloads (Deny List)
1. **Balance Injection**: User attempts to update their own `balance.USHA` to 999999.
2. **Identity Spoofing**: User A attempts to read User B's `/users/` document.
3. **Price Manipulation**: User attempts to set `markets/BTC-USHA/price` to 0.00000001.
4. **Order Book Hijack**: User attempts to delete all `bids` from a market.
5. **Withdrawal Self-Approval**: User creates a withdrawal with `status: 'completed'`.
6. **Task Reward Forgery**: User updates a task's `reward` field in global config.
7. **Admin Escalation**: User attempts to set `isAdmin: true` on their own profile.
8. **Double Spend**: User attempts to use a `promoCode` twice.
9. **Shadow Order**: User creates an order in User B's name by setting `userId: userB@email.com`.
10. **Trade Log Injection**: User appends fake trades to the market's `trades` array.
11. **Negative Balance**: User attempts to withdraw more than they have.
12. **Id Poisoning**: User creates a market with a 2MB string as ID.

## 3. Implementation Patterns
- Use `isValidUser()`, `isValidMarket()`, `isValidTask()` helpers.
- Implement `affectedKeys().hasOnly()` for all state transitions.
- Enforce server timestamps for `updatedAt`.
- Restrict `list` operations strictly.
