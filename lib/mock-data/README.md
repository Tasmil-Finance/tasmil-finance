# Mock Data Services

This directory contains mock data services that simulate backend API calls for development and testing purposes.

## TX Credit Mock Data Service

**File:** `tx-credit.ts`

### Overview

The TX Credit mock data service simulates a complete transaction credit system with purchase, consumption, and balance tracking functionality.

### Features

1. **Fetch TX Credit Balance** - Simulates retrieving current credit balances
2. **Process Recharge Payments** - Simulates credit purchases with payment processing
3. **Consume Credits** - Simulates using credits for transactions
4. **Random Payment Failures** - 10% failure rate to test error handling
5. **Persistent In-Memory Storage** - Credits persist during the session

### Mock Data Structure

```typescript
interface TxCreditData {
  paid: number;      // Currently available paid credits
  paidMax: number;   // Total paid credits purchased
  free: number;      // Currently available free credits
  freeMax: number;   // Maximum free credits allowed
}
```

### Initial Mock Values

- **Paid Credits:** 0 / 0
- **Free Credits:** 76 / 500
- **Progress:** 15.2% of free credits used

### Recharge Options

| Credits | Price (USDT) | Popular |
|---------|--------------|---------|
| 5,000   | $5           | No      |
| 20,000  | $20          | **Yes** |
| 35,000  | $35          | No      |
| 60,000  | $60          | No      |

**Pricing:** $1 per 1,000 TX Credits

### API Functions

#### `fetchTxCredit(delay?: number)`

Fetches current TX Credit balance.

```typescript
const credits = await fetchTxCredit(); // Default 1200ms delay
const quickFetch = await fetchTxCredit(500); // Custom delay
```

**Returns:** `Promise<TxCreditData>`

---

#### `processRecharge(amount: number, price: number)`

Processes a credit recharge payment.

```typescript
const result = await processRecharge(20000, 20);

if (result.success) {
  console.log(result.message); // "Successfully added 20,000 TX Credits!"
  console.log(result.transactionId); // "TX-1234567890-ABC123"
  console.log(result.newCredits); // Updated credit balances
}
```

**Returns:** `Promise<RechargeResponse>`

**Features:**
- 2-second processing delay (simulates payment gateway)
- 10% random failure rate for testing error handling
- Generates unique transaction IDs
- Updates paid credit balance automatically

---

#### `consumeCredits(amount: number, usePaid?: boolean)`

Consumes credits for a transaction.

```typescript
const result = await consumeCredits(100, true);

if (result.success) {
  console.log("Credits consumed successfully");
  console.log(result.remaining); // Updated balance
}
```

**Returns:** `Promise<{ success: boolean; remaining: TxCreditData }>`

**Priority:**
1. If `usePaid = true`: Uses paid credits first, then free credits
2. If `usePaid = false`: Uses free credits only

---

#### `resetCredits()`

Resets credits to initial state (for testing).

```typescript
resetCredits();
// Resets to: paid: 0, paidMax: 0, free: 76, freeMax: 500
```

---

#### `setCredits(credits: Partial<TxCreditData>)`

Manually set credit values for testing different scenarios.

```typescript
// Test low balance scenario
setCredits({ free: 5, freeMax: 500 });

// Test full balance scenario
setCredits({ paid: 50000, paidMax: 50000, free: 500, freeMax: 500 });
```

---

### Usage in Components

The mock service is already integrated into the footer sidebar:

```typescript
import {
  fetchTxCredit,
  processRecharge,
  RECHARGE_OPTIONS
} from "@/lib/mock-data/tx-credit";

// Fetch credits on component mount
useEffect(() => {
  const loadData = async () => {
    const credits = await fetchTxCredit();
    setTxCredit(credits);
  };
  loadData();
}, []);

// Process payment
const handlePayment = async () => {
  const response = await processRecharge(20000, 20);

  if (response.success) {
    toast.success(response.message);
    setTxCredit(response.newCredits);
  } else {
    toast.error(response.message);
  }
};
```

---

### User Flow Example

1. **Page Load**
   - Fetches initial credits (76/500 free)
   - Shows 15.2% progress bar

2. **User Clicks Recharge**
   - Opens recharge dialog
   - Displays 4 purchase options

3. **User Selects Option**
   - Highlights selected option with primary border
   - Shows info toast with selection details
   - Enables payment button

4. **User Clicks "Proceed to Crypto Payment"**
   - Button shows loading spinner
   - Processes payment (2s delay)
   - 90% success rate, 10% failure rate

5. **Payment Success**
   - Updates credit balance immediately
   - Shows success toast
   - Shows transaction ID after 1.5s
   - Closes dialog after 2s

6. **Payment Failure**
   - Shows error toast
   - Keeps dialog open
   - User can retry

---

### Testing Scenarios

#### Test Payment Success
```typescript
// Most payments will succeed (90% success rate)
const result = await processRecharge(20000, 20);
```

#### Test Payment Failure
```typescript
// Keep retrying until you hit the 10% failure rate
// Or modify the mock service to force failures for testing
```

#### Test Low Balance
```typescript
import { setCredits } from "@/lib/mock-data/tx-credit";

setCredits({ free: 5, freeMax: 500 });
// Now the progress bar shows 1%
```

#### Test High Balance
```typescript
import { setCredits } from "@/lib/mock-data/tx-credit";

setCredits({
  paid: 100000,
  paidMax: 100000,
  free: 500,
  freeMax: 500
});
```

---

### Replacing with Real API

When ready to integrate with a real backend:

1. Replace the functions in `tx-credit.ts` with real API calls
2. Update the base URL and endpoints
3. Add proper authentication headers
4. Keep the same interface for seamless integration

```typescript
// Example real API implementation
export const fetchTxCredit = async (): Promise<TxCreditData> => {
  const response = await fetch('/api/tx-credit', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch TX Credit');
  }

  return response.json();
};
```

The component code won't need any changes since the interface remains the same!

---

### Transaction ID Format

Transaction IDs follow this pattern:
```
TX-{timestamp}-{random-alphanumeric}
Example: TX-1234567890-ABC123XYZ
```

---

### Notes

- Credits persist in memory during the session
- Refresh the page to reset to initial state (unless using `resetCredits()`)
- Payment processing simulates real-world latency
- Error handling is built-in with toast notifications
- All monetary values are in USDT
