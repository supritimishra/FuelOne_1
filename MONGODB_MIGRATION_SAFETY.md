# MongoDB Migration - Data Safety Guidelines

## 🔒 DATA PROTECTION MEASURES

### **CRITICAL: NO DATA WILL BE DELETED OR DROPPED**

This MongoDB migration has been designed with **maximum data safety** as the top priority. All operations preserve existing data.

---

## Safe Migration Strategy

### 1. **Dual Database Approach**
- PostgreSQL remains fully operational
- MongoDB runs in parallel
- No existing data is touched
- Gradual migration, not replacement

### 2. **Soft Delete Implementation**

All "delete" operations in the MongoDB API routes use **soft deletes**:

#### Collections with Soft Delete:
- **fuel_products**: Sets `isActive: false`
- **lubricants**: Sets `isActive: false`
- **credit_customers**: Sets `isActive: false`
- **employees**: Sets `isActive: false`
- **vendors**: Sets `isActive: false`
- **business_parties**: Sets `isActive: false`
- **swipe_machines**: Sets `status: 'Inactive'`
- **nozzles**: Sets `isActive: false`
- **tanks**: Sets `isDeleted: true`
- **expense_types**: Sets `isDeleted: true`

**What this means:**
- Records are NEVER permanently deleted
- Data remains in database with a flag
- Can be recovered at any time
- Full audit trail maintained

### 3. **No Destructive Operations**

The following operations are **explicitly NOT used**:
- ❌ `db.collection.drop()` - Never drops collections
- ❌ `db.dropDatabase()` - Never drops databases
- ❌ `collection.deleteMany()` - Never bulk deletes
- ✅ Only `updateOne()` for soft deletes
- ✅ `insertOne()` for creating records
- ✅ `find()` for reading records

### 4. **Index Creation Only**

The `createIndexes()` function in [`server/db-mongodb.ts`](server/db-mongodb.ts):
- ✅ Creates indexes for performance
- ✅ Uses `{ unique: true }` where needed
- ❌ Does NOT drop existing indexes
- ❌ Does NOT modify collection data

---

## Migration File Structure

### New Files (No Modifications to Existing):
```
server/
  ├── db-mongodb.ts              # MongoDB connection (NEW)
  ├── routes/
  │   └── master-data-mongodb.ts # MongoDB Master routes (NEW)
shared/
  └── mongodb-schema.ts          # Type definitions (NEW)
```

### Preserved Files (Untouched):
```
server/
  ├── db.ts                      # PostgreSQL connection (PRESERVED)
  ├── auth.ts                    # Authentication (PRESERVED)
  ├── routes/
  │   ├── user-management.ts     # User routes (PRESERVED)
  │   ├── feature-access.ts      # Features (PRESERVED)
  │   └── developer-mode.ts      # Dev mode (PRESERVED)
shared/
  └── schema.ts                  # Drizzle schema (PRESERVED)
```

---

## MongoDB Connection Details

### Connection String (from .local.env):
```env
MONGODB_URI=mongodb+srv://syntropylabworks_db_user:QArml7uLnqqg496U@cluster0.zlqfhe8.mongodb.net/fuelmanagement
DB_NAME=fuelmanagement
```

### Connection Features:
- ✅ Automatic reconnection
- ✅ Connection pooling (min: 2, max: 10)
- ✅ 30-second timeout protection
- ✅ Proper error handling

---

## Master Section API Endpoints

All endpoints maintain data integrity:

| Endpoint | Method | Operation | Data Safety |
|----------|--------|-----------|-------------|
| `/api/fuel-products` | GET | List | Read-only |
| `/api/fuel-products` | POST | Create | Adds new record |
| `/api/fuel-products/:id` | PUT | Update | Modifies existing |
| `/api/fuel-products/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/lubricants` | GET | List | Read-only |
| `/api/lubricants` | POST | Create | Adds new record |
| `/api/lubricants/:id` | PUT | Update | Modifies existing |
| `/api/lubricants/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/credit-customers` | GET | List | Read-only |
| `/api/credit-customers` | POST | Create | Adds new record |
| `/api/credit-customers/:id` | PUT | Update | Modifies existing |
| `/api/credit-customers/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/employees` | GET | List | Read-only |
| `/api/employees` | POST | Create | Adds new record |
| `/api/employees/:id` | PUT | Update | Modifies existing |
| `/api/employees/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/vendors` | GET | List | Read-only |
| `/api/vendors` | POST | Create | Adds new record |
| `/api/vendors/:id` | PUT | Update | Modifies existing |
| `/api/vendors/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/swipe-machines` | GET | List | Read-only |
| `/api/swipe-machines` | POST | Create | Adds new record |
| `/api/swipe-machines/:id` | PUT | Update | Modifies existing |
| `/api/swipe-machines/:id` | DELETE | Soft Delete | Sets status=Inactive |
| `/api/tanks` | GET | List | Read-only |
| `/api/tanks` | POST | Create | Adds new record |
| `/api/tanks/:id` | PUT | Update | Modifies existing |
| `/api/tanks/:id` | DELETE | Soft Delete | Sets isDeleted=true |
| `/api/nozzles` | GET | List | Read-only |
| `/api/nozzles` | POST | Create | Adds new record |
| `/api/nozzles/:id` | PUT | Update | Modifies existing |
| `/api/nozzles/:id` | DELETE | Soft Delete | Sets isActive=false |
| `/api/expense-types` | GET | List | Read-only |
| `/api/expense-types` | POST | Create | Adds new record |
| `/api/expense-types/:id` | PUT | Update | Modifies existing |
| `/api/expense-types/:id` | DELETE | Soft Delete | Sets isDeleted=true |
| `/api/business-parties` | GET | List | Read-only |
| `/api/business-parties` | POST | Create | Adds new record |
| `/api/business-parties/:id` | PUT | Update | Modifies existing |
| `/api/business-parties/:id` | DELETE | Soft Delete | Sets isActive=false |

---

## Testing & Verification

### Test Script Created:
- `test-mongodb-connection.ts` - Verifies MongoDB connection
- No test performs destructive operations
- All tests are read-only or create temporary test data

### Manual Verification:
```bash
# 1. Test MongoDB connection
npx tsx test-mongodb-connection.ts

# 2. Start server
npm run dev

# 3. Test endpoints (all safe)
curl http://localhost:5001/api/fuel-products
curl http://localhost:5001/api/lubricants
```

---

## Rollback Plan

If needed, rollback is simple because:
1. PostgreSQL data remains untouched
2. MongoDB data is in separate database
3. Original server code is preserved
4. Just switch back to PostgreSQL routes

---

## Summary

✅ **PostgreSQL data**: Completely preserved  
✅ **MongoDB data**: Protected by soft deletes  
✅ **No collections dropped**: Ever  
✅ **No records permanently deleted**: All soft deletes  
✅ **Rollback available**: Original system intact  
✅ **Audit trail**: All changes tracked with timestamps  

**Your data is 100% safe throughout this migration.**
