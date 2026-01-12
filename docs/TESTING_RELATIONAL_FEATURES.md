
# Testing Relational Features Backend

Since the backend implementation relies on an authentication token and potentially tenant isolation, the easiest way to test these endpoints locally without a full frontend login flow is to use the provided test script.

## Pre-requisites
1. Ensure the server is running on port 5000:
   ```bash
   npm run dev
   ```

## Running the Tests
We have created a script located at `scripts/test_relational.js` that automatically hits all the new endpoints.

1. Open a new terminal.
2. Run the script:
   ```bash
   node scripts/test_relational.js
   ```

This script sends requests with a special header `x-test-user: TestSprite` which bypasses the standard authentication and uses a test user context.

## Manual Testing (Advanced)
If you prefer to use tools like **Postman** or **cURL**, use the following headers:
- `Content-Type: application/json`
- `x-test-user: TestSprite`

### Example cURL commands:

**1. Create Interest Transaction**
```bash
curl -X POST http://localhost:5000/api/interest-trans \
  -H "Content-Type: application/json" \
  -H "x-test-user: TestSprite" \
  -d '{"partyName":"Test Party", "transactionType":"Loan Taken", "loanAmount":"5000", "transactionDate":"2025-12-21"}'
```

**2. Get Day Cash Report**
```bash
curl -X GET "http://localhost:5000/api/day-cash-report?date=2025-12-21" \
  -H "x-test-user: TestSprite"
```

**(Add similar commands for other endpoints as needed)**
