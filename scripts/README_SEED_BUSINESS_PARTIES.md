# Business Parties Seed Script

This script seeds sample business party data into the FuelOne MongoDB database.

## Sample Data Included

The script includes 15 sample business parties covering all party types:

- **Cash accounts** (5): HALDER, BABU SONA, INDUS TOWER, SANJAY MANAGAR, DEB KUMAR, Petty Cash
- **Bank accounts** (3): State Bank of India, HDFC Bank, Axis Bank
- **Creditors** (3): Reliance Petroleum, Indian Oil Corporation, Shell India
- **Owner account** (1): Rajesh Kumar - Owner
- **Tanker** (1): Bharat Tankers Ltd
- **Capital account** (1): Capital Investment Account

## Usage

Run the seed script using:

```bash
npm run seed:business-parties
```

Or directly with tsx:

```bash
tsx scripts/seed_business_parties.ts
```

## What the Script Does

1. Connects to MongoDB using the `MONGODB_URI` from environment variables
2. Deletes all existing business party records (optional - can be commented out)
3. Inserts 15 sample business party records
4. Verifies the insertion count
5. Closes the database connection

## Prerequisites

- MongoDB connection string must be set in `.env` file as `MONGODB_URI`
- MongoDB server must be running and accessible
- The `fuelone` database will be used (created automatically if doesn't exist)

## Database Collection

Collection name: `business_parties`

## Fields

Each business party record includes:
- `party_name`: Name of the party (unique)
- `party_type`: Type (Bank, Capital, Cash, Creditor, Owner, Tanker)
- `phone_number`: Contact phone number
- `email`: Email address
- `address`: Physical address
- `description`: Additional notes
- `opening_balance`: Initial balance amount
- `opening_date`: Date of opening balance
- `opening_type`: Balance type (Receivable/Payable for Debit/Credit)
- `is_active`: Active status (boolean)
- `createdAt`: Timestamp of record creation

## Note

⚠️ **Warning**: This script will delete all existing business party records before inserting new ones. If you want to preserve existing data, comment out the `deleteMany` line in the script.
