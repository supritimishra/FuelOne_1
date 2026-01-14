
import mongoose from 'mongoose';
import { db } from '../server/db.js';
import {
    interestTransactions, sheetRecords, tankerSales, guestSales,
    attendance, dutyPayRecords, salesOfficerInspections, creditRequests,
    expiryItems, feedback, creditCustomers, fuelProducts
} from '../shared/schema.js';
import {
    InterestTransaction, SheetRecord, TankerSale, GuestSale,
    Attendance, DutyPayRecord, SalesOfficerInspection, CreditRequest,
    ExpiryItem, Feedback, CreditCustomer, FuelProduct
} from '../server/models.js';
import { config } from 'dotenv';
import path from 'path';

// Load env
config({ path: path.resolve(process.cwd(), '.local.env') });

const BATCH_SIZE = 100;

async function migrate() {
    try {
        console.log("🚀 Starting Migration...");

        // Connect Mongo
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) throw new Error("Missing MONGODB_URI");

        await mongoose.connect(mongoUri);
        console.log("✅ Connected to MongoDB");

        // Helper to migrate table
        async function migrateTable(
            drizzleTable: any,
            MongoModel: any,
            tableName: string,
            mappingFn: (row: any) => any
        ) {
            console.log(`\n📦 Migrating ${tableName}...`);
            let rows: any[] = [];
            try {
                rows = await db.select().from(drizzleTable);
                console.log(`   Found ${rows.length} records in Postgres.`);
            } catch (err: any) {
                console.warn(`   ⚠️ Could not read table '${tableName}' from Postgres. Skipping.`);
                console.warn(`   Error: ${err.message}`);
                return;
            }

            if (rows.length === 0) {
                console.log("   Skipping (No records).");
                return;
            }

            let success = 0;
            let failed = 0;

            // Clear existing mongo collection for clean migration? 
            await MongoModel.deleteMany({});

            for (const row of rows) {
                try {
                    const mappedData = mappingFn(row);
                    const doc = new MongoModel(mappedData);
                    await doc.save();
                    success++;
                } catch (e: any) {
                    failed++;
                    console.error(`   ❌ Failed to migrate row ${row.id}: ${e.message}`);
                }
            }
            console.log(`   ✅ Migrated ${success} records. Failed: ${failed}`);
        }

        // 1. Interest Transactions
        await migrateTable(interestTransactions, InterestTransaction, "Interest Transactions", (row) => ({
            transactionDate: new Date(row.transactionDate),
            partyName: row.partyName,
            loanAmount: Number(row.loanAmount || 0),
            interestAmount: Number(row.interestAmount || 0),
            principalPaid: Number(row.principalPaid || 0),
            transactionType: row.transactionType,
            remarks: row.notes, // 'notes' in schema -> 'remarks' in model
            createdAt: row.createdAt,
            createdBy: row.createdBy
        }));

        // 2. Sheet Records
        await migrateTable(sheetRecords, SheetRecord, "Sheet Records", (row) => ({
            date: new Date(row.date),
            sheetName: row.sheetName,
            openReading: Number(row.openReading || 0),
            closeReading: Number(row.closeReading || 0),
            notes: row.notes,
            createdBy: row.createdBy
        }));

        // 3. Tanker Sales
        await migrateTable(tankerSales, TankerSale, "Tanker Sales", (row) => ({
            saleDate: new Date(row.saleDate),
            fuelProductId: row.fuelProductId,
            beforeDipStock: Number(row.beforeDipStock || 0),
            grossStock: Number(row.grossStock || 0),
            tankerSaleQuantity: Number(row.tankerSaleQuantity || 0),
            notes: row.notes,
            createdBy: row.createdBy
        }));

        // 4. Guest Sales
        await migrateTable(guestSales, GuestSale, "Guest Sales", (row) => ({
            saleDate: new Date(row.saleDate),
            shift: row.shift,
            customerName: row.customerName || 'Unknown',
            mobileNumber: row.mobileNumber,
            billNo: row.billNo,
            vehicleNumber: row.vehicleNumber,
            fuelProductId: row.fuelProductId,
            pricePerUnit: Number(row.pricePerUnit || 0),
            quantity: Number(row.quantity || 0),
            discount: Number(row.discount || 0),
            totalAmount: Number(row.totalAmount || 0),
            description: row.description,
            paymentMode: row.paymentMode,
            employeeId: row.employeeId,
            gstNumber: row.gstNumber,
            createdBy: row.createdBy
        }));

        // 5. Attendance
        await migrateTable(attendance, Attendance, "Attendance", (row) => ({
            attendanceDate: new Date(row.attendanceDate),
            employeeId: row.employeeId,
            status: row.status || 'Absent',
            shiftId: row.shiftId,
            notes: row.notes,
            createdBy: row.createdBy
        }));

        // 6. Duty Pay
        await migrateTable(dutyPayRecords, DutyPayRecord, "Duty Pay Records", (row) => ({
            salaryDate: new Date(row.salaryDate),
            employeeId: row.employeeId,
            shift: row.shift,
            dutySalary: Number(row.dutySalary || 0),
            grossSalary: Number(row.grossSalary || 0),
            pf: Number(row.pf || 0),
            esi: Number(row.esi || 0),
            loanDeduction: Number(row.loanDeduction || 0),
            advanceDeduction: Number(row.advanceDeduction || 0),
            businessShortage: Number(row.businessShortage || 0),
            netSalary: Number(row.netSalary || 0),
            payMode: row.payMode
        }));

        // 7. Sales Officer
        await migrateTable(salesOfficerInspections, SalesOfficerInspection, "Sales Officer Inspections", (row) => ({
            inspectionDate: new Date(row.inspectionDate),
            officerName: "System Admin",
            fuelProductId: row.fuelProductId,
            dipReading: Number(row.dipValue || 0),
            variance: 0,
            createdBy: row.createdBy
        }));

        // 8. Credit Requests
        await migrateTable(creditRequests, CreditRequest, "Credit Requests", (row) => ({
            requestDate: new Date(row.requestDate),
            creditCustomerId: row.creditCustomerId,
            fuelProductId: row.fuelProductId,
            quantity: Number(row.orderedQuantity || 0),
            status: row.status,
            description: row.notes,
            createdBy: row.createdBy
        }));

        // 9. Expiry Items
        await migrateTable(expiryItems, ExpiryItem, "Expiry Items", (row) => ({
            itemName: row.itemName,
            issueDate: row.issueDate ? new Date(row.issueDate) : undefined,
            expiryDate: row.expiryDate ? new Date(row.expiryDate) : undefined,
            status: row.status
        }));

        // 10. Feedback
        await migrateTable(feedback, Feedback, "Feedback", (row) => ({
            customerName: row.name,
            rating: 5,
            comments: row.message,
            createdBy: row.createdBy
        }));

        // 11. Credit Customers
        await migrateTable(creditCustomers, CreditCustomer, "Credit Customers", (row) => ({
            _id: row.id, // Store Postgres UUID as Mongo _id to preserve relationships
            organizationName: row.organizationName,
            phoneNumber: row.phoneNumber,
            mobileNumber: row.mobileNumber,
            email: row.email,
            address: row.address,
            creditLimit: Number(row.creditLimit || 0),
            openingBalance: Number(row.openingBalance || 0),
            currentBalance: Number(row.currentBalance || 0),
            registeredDate: row.registeredDate ? new Date(row.registeredDate) : undefined,
            tinGstNo: row.tinGstNo,
            representativeName: row.representativeName,
            organizationAddress: row.organizationAddress,
            isActive: row.isActive,
            createdAt: row.createdAt
        }));

        // 12. Fuel Products
        await migrateTable(fuelProducts, FuelProduct, "Fuel Products", (row) => ({
            _id: row.id,
            productName: row.productName,
            shortName: row.shortName,
            gstPercentage: Number(row.gstPercentage || 0),
            tdsPercentage: Number(row.tdsPercentage || 0),
            wgtPercentage: Number(row.wgtPercentage || 0),
            lfrn: row.lfrn,
            isActive: row.isActive,
            createdAt: row.createdAt
        }));

        console.log("\n🎉 Migration Complete!");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

migrate();
