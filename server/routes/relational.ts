
import { Router, Request, Response } from "express";
import { db } from "../db.js";
import {
    fuelProducts, employees, dutyShifts, saleEntries, expenses,
    recoveries, creditCustomers, tanks, nozzles,

    insertSheetRecordSchema, insertDayCashMovementSchema, insertTankerSaleSchema,
    insertGuestSaleSchema, insertAttendanceSchema, insertDutyPaySchema,
    insertDutyPayRecordSchema,
    insertSalesOfficerInspectionSchema, insertCreditRequestSchema, insertFeedbackSchema,
    creditSales, lubSales, insertLubSaleSchema, denominations, swipeTransactions, employeeCashRecovery,
    daySettlements, expiryItems, expiryCategories, insertExpiryItemSchema, insertExpiryCategorySchema,
    dailySaleRates, insertDailySaleRateSchema, lubricants as lubricantsTable
} from "../../shared/schema.js";
import { eq, desc, and, sql, gte, lte, sum, inArray } from "drizzle-orm";
import { z } from "zod";

const mongoInterestTransactionSchema = z.object({
    transactionDate: z.string().or(z.date()).transform(val => new Date(val)),
    transactionType: z.string().optional(),
    partyName: z.string(),
    loanAmount: z.union([z.number(), z.string()]).transform(Number).optional(),
    interestAmount: z.union([z.number(), z.string()]).transform(Number).optional(),
    principalPaid: z.union([z.number(), z.string()]).transform(Number).optional(),
    notes: z.string().optional(),
    paymentMode: z.string().optional(),
    remarks: z.string().optional(),
    status: z.string().optional(),
    settlementDate: z.string().or(z.date()).optional().transform(val => val ? new Date(val) : undefined),
});


import {
    InterestTransaction, SheetRecord, TankerSale, GuestSale,
    Attendance, DutyPayRecord, SalesOfficerInspection, CreditRequest,
    ExpiryItem, Feedback, DayCashMovement, CreditCustomer, FuelProduct, Employee, ExpenseType,
    Tank, Nozzle, LubricantProduct
} from "../models.js";

export const relationalRouter = Router();

// ==========================================
// Fuel Products (MongoDB)
// ==========================================
relationalRouter.get("/fuel-products", async (req: Request, res: Response) => {
    try {
        const results = await FuelProduct.find().sort({ createdAt: 1 });
        // Map to snake_case for frontend compatibility
        const mapped = results.map(r => ({
            id: r._id,
            product_name: r.productName,
            short_name: r.shortName,
            wgt_percentage: r.wgtPercentage,
            tds_percentage: r.tdsPercentage,
            gst_percentage: r.gstPercentage,
            lfrn: r.lfrn,
            isActive: r.isActive,
            created_at: r.createdAt
        }));
        res.json({ success: true, data: mapped, rows: mapped, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/fuel-products", async (req: Request, res: Response) => {
    try {
        const { product_name, short_name, wgt_percentage, tds_percentage, gst_percentage, lfrn } = req.body;

        const crypto = await import("crypto");
        const id = crypto.randomUUID();

        const newProduct = new FuelProduct({
            _id: id,
            productName: product_name,
            shortName: short_name,
            wgtPercentage: wgt_percentage,
            tdsPercentage: tds_percentage,
            gstPercentage: gst_percentage,
            lfrn: lfrn,
            isActive: true
        });

        const saved = await newProduct.save();
        res.json({ success: true, ok: true, data: saved });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.put("/fuel-products/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { product_name, short_name, wgt_percentage, tds_percentage, gst_percentage, lfrn, isActive } = req.body;

        const updateData: any = {};
        if (product_name !== undefined) updateData.productName = product_name;
        if (short_name !== undefined) updateData.shortName = short_name;
        if (wgt_percentage !== undefined) updateData.wgtPercentage = wgt_percentage;
        if (tds_percentage !== undefined) updateData.tdsPercentage = tds_percentage;
        if (gst_percentage !== undefined) updateData.gstPercentage = gst_percentage;
        if (lfrn !== undefined) updateData.lfrn = lfrn;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updated = await FuelProduct.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Product not found" });

        res.json({ success: true, ok: true, data: updated });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/fuel-products/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await FuelProduct.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Product not found" });

        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// Lubricant Products (Postgres)
// ==========================================
// Note: LubricantProduct Mongo model usage replaced by Postgres 'lubricants' table


// Lubricant Products (Hybrid: Mongo Fallback)
relationalRouter.get("/lubricants", async (req: Request, res: Response) => {
    try {
        if (!process.env.DATABASE_URL) {
            // MongoDB Path
            const results = await LubricantProduct.find({ isActive: true }).sort({ createdAt: -1 });
            const mapped = results.map(r => ({
                ...r.toObject(),
                id: r._id,
                lubricant_name: r.productName,
                // Map other fields as needed by frontend
                gst_percentage: r.gstPercentage,
                mrp_rate: r.mrpRate,
                sale_rate: r.saleRate,
                current_stock: r.currentStock,
                minimum_stock: r.minimumStock,
                is_active: r.isActive,
                created_at: r.createdAt
            }));
            return res.json({ success: true, rows: mapped, ok: true });
        }

        // Postgres Path
        const results = await db.select().from(lubricantsTable).where(eq(lubricantsTable.isActive, true));

        const mapped = results.map(r => ({
            id: r.id,
            lubricant_name: r.lubricantName,
            gst_percentage: r.gstPercentage,
            mrp_rate: r.mrpRate,
            sale_rate: r.saleRate,
            current_stock: r.currentStock,
            minimum_stock: r.minimumStock,
            is_active: r.isActive,
            created_at: r.createdAt
        }));
        res.json({ success: true, rows: mapped, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});


relationalRouter.post("/lubricants", async (req: Request, res: Response) => {
    try {
        const { lubricant_name, gst_percentage, mrp_rate, sale_rate, minimum_stock } = req.body;

        const data = {
            lubricantName: lubricant_name,
            gstPercentage: gst_percentage,
            mrpRate: mrp_rate,
            saleRate: sale_rate,
            minimumStock: minimum_stock,
            isActive: true
        };

        const saved = await db.insert(lubricantsTable).values(data).returning();
        res.json({ success: true, ok: true, data: saved[0] });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.put("/lubricants/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { lubricant_name, gst_percentage, mrp_rate, sale_rate, minimum_stock, is_active } = req.body;

        const updateData: any = {};
        if (lubricant_name !== undefined) updateData.lubricantName = lubricant_name;
        if (gst_percentage !== undefined) updateData.gstPercentage = gst_percentage;
        if (mrp_rate !== undefined) updateData.mrpRate = mrp_rate;
        if (sale_rate !== undefined) updateData.saleRate = sale_rate;
        if (minimum_stock !== undefined) updateData.minimumStock = minimum_stock;
        if (is_active !== undefined) updateData.isActive = is_active;

        const updated = await db.update(lubricantsTable)
            .set(updateData)
            .where(eq(lubricantsTable.id, id))
            .returning();

        if (updated.length === 0) return res.status(404).json({ success: false, error: "Product not found" });

        res.json({ success: true, ok: true, data: updated[0] });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.put("/lubricants/bulk-rate", async (req: Request, res: Response) => {
    try {
        const { rates } = req.body;
        if (!Array.isArray(rates)) return res.status(400).json({ error: "Invalid data" });

        // Simple loop for update (transaction better but ok for now)
        for (const item of rates) {
            if (item.id && item.sale_rate !== undefined) {
                await db.update(lubricantsTable)
                    .set({ saleRate: item.sale_rate })
                    .where(eq(lubricantsTable.id, item.id));
            }
        }
        res.json({ success: true, ok: true, message: "Rates updated" });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/lubricants/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.update(lubricantsTable).set({ isActive: false }).where(eq(lubricantsTable.id, id));
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Nozzles List (Hybrid: Mongo Fallback)
relationalRouter.get("/nozzles-list", async (req: Request, res: Response) => {
    try {
        if (!process.env.DATABASE_URL) {
            // MongoDB Path
            const nozzlesList = await Nozzle.find({ isActive: true });

            // Fetch relevant tanks
            const tankIds = Array.from(new Set(nozzlesList.map(n => n.tankId).filter(Boolean)));
            const tanksList = await Tank.find({ _id: { $in: tankIds } });
            const tankMap: Record<string, string> = {};
            tanksList.forEach(t => tankMap[t._id] = t.tankNumber);

            const mapped = nozzlesList.map(n => ({
                id: n._id,
                nozzle_number: n.nozzleNumber,
                pump_station: n.pumpStation,
                fuel_product_id: n.fuelProductId,
                tank_id: n.tankId,
                tank_number: tankMap[n.tankId] || '-',
                is_active: n.isActive
            }));
            return res.json({ success: true, ok: true, rows: mapped, data: mapped });
        }

        // Postgres Path
        const results = await db.select({
            id: nozzles.id,
            nozzle_number: nozzles.nozzleNumber,
            pump_station: nozzles.pumpStation,
            fuel_product_id: nozzles.fuelProductId,
            tank_id: nozzles.tankId,
            tank_number: tanks.tankNumber,
            is_active: nozzles.isActive
        })
            .from(nozzles)
            .leftJoin(tanks, eq(nozzles.tankId, tanks.id))
            .where(eq(nozzles.isActive, true));

        res.json({ success: true, ok: true, rows: results, data: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Employees (Postgres)
// Employees (Hybrid: Mongo Fallback)
relationalRouter.get("/employees", async (req: Request, res: Response) => {
    try {
        if (!process.env.DATABASE_URL) {
            // MongoDB Path
            const results = await Employee.find({ isActive: true }).sort({ createdAt: -1 });
            const mapped = results.map(r => ({
                ...r.toObject(),
                id: r._id,
                employee_name: r.employeeName,
                name: r.employeeName,
                full_name: r.employeeName,
                designation: r.designation,
                mobile_number: r.mobileNumber,
                created_at: r.createdAt
            }));
            return res.json({ success: true, data: mapped, rows: mapped, ok: true });
        }

        // Postgres Path
        const results = await db.select().from(employees).where(eq(employees.isActive, true));
        const mapped = results.map(r => ({
            ...r,
            id: r.id,
            employee_name: r.employeeName,
            name: r.employeeName
        }));
        res.json({ success: true, data: results, rows: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/duty-shifts", async (req: Request, res: Response) => {
    try {
        const results = await db.select().from(dutyShifts);
        res.json({ success: true, data: results, rows: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.1 Interest Transactions (MongoDB)
// ==========================================
relationalRouter.get("/interest-transactions", async (req: Request, res: Response) => {
    try {
        const { from, to, party, type, amount_min, amount_max } = req.query;

        let conditions: any = {};

        if (from || to) {
            conditions.transactionDate = {};
            if (from) conditions.transactionDate.$gte = new Date(String(from));
            if (to) conditions.transactionDate.$lte = new Date(String(to));
        }

        if (party) {
            conditions.partyName = { $regex: String(party), $options: 'i' };
        }

        if (type && type !== 'All Types') {
            conditions.transactionType = String(type);
        }

        if (amount_min || amount_max) {
            const min = Number(amount_min) || 0;
            const max = Number(amount_max) || Infinity;
            conditions.$or = [
                { loanAmount: { $gte: min, $lte: max === Infinity ? Number.MAX_VALUE : max } },
                { interestAmount: { $gte: min, $lte: max === Infinity ? Number.MAX_VALUE : max } },
                { principalPaid: { $gte: min, $lte: max === Infinity ? Number.MAX_VALUE : max } }
            ];
        }

        const rows = await InterestTransaction.find(conditions).sort({ transactionDate: -1 });
        const mappedRows = rows.map(r => ({ ...r.toObject(), id: r._id }));

        res.json({ success: true, rows: mappedRows, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message, ok: false });
    }
});

relationalRouter.post("/interest-transactions", async (req: Request, res: Response) => {
    try {
        const data = mongoInterestTransactionSchema.parse(req.body);
        const newRecord = new InterestTransaction({
            ...data,
            createdBy: (req as any).user?.id
        });
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id }, ok: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message, ok: false });
    }
});

relationalRouter.put("/interest-transactions/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = mongoInterestTransactionSchema.partial().parse(req.body);

        const updated = await InterestTransaction.findByIdAndUpdate(id, data, { new: true });

        if (!updated) {
            return res.status(404).json({ success: false, error: "Transaction not found", ok: false });
        }

        res.json({ success: true, data: { ...updated.toObject(), id: updated._id }, ok: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message, ok: false });
    }
});

relationalRouter.delete("/interest-transactions/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const deleted = await InterestTransaction.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ success: false, error: "Transaction not found", ok: false });
        }

        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message, ok: false });
    }
});

// ==========================================
// 3.2 Sheet Records (MongoDB)
// ==========================================
relationalRouter.post("/sheet-records", async (req: Request, res: Response) => {
    try {
        const data = insertSheetRecordSchema.parse(req.body);

        if (Number(data.closeReading) < Number(data.openReading)) {
            if (Number(data.closeReading) !== 0) {
                return res.status(400).json({ success: false, error: "Closing reading cannot be less than opening reading unless meter reset." });
            }
        }

        const saleQty = Number(data.closeReading) - Number(data.openReading);

        const newRecord = new SheetRecord({
            ...data,
            createdBy: (req as any).user?.id
        });
        const saved = await newRecord.save();

        res.json({ success: true, data: { ...saved.toObject(), id: saved._id }, computedSaleQty: saleQty });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.3 Day Cash Reports (Hybrid)
// ==========================================
relationalRouter.post("/day-cash-movements", async (req: Request, res: Response) => {
    try {
        const data = insertDayCashMovementSchema.parse(req.body);
        const newRecord = new DayCashMovement(data);
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/day-cash-movements", async (req: Request, res: Response) => {
    try {
        const results = await DayCashMovement.find().sort({ date: -1 });
        const mapped = results.map(r => ({ ...r.toObject(), id: r._id }));
        res.json({ success: true, data: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/day-cash-report", async (req: Request, res: Response) => {
    try {
        const date = req.query.date ? String(req.query.date) : new Date().toISOString().slice(0, 10);

        const cashSales = await db.select({ total: sum(saleEntries.netSaleAmount) })
            .from(saleEntries)
            .where(and(eq(saleEntries.saleDate, date)));

        const recoveriesTotal = await db.select({ total: sum(recoveries.receivedAmount) })
            .from(recoveries)
            .where(and(eq(recoveries.recoveryDate, date), eq(recoveries.paymentMode, 'Cash')));

        const expensesTotal = await db.select({ total: sum(expenses.amount) })
            .from(expenses)
            .where(and(eq(expenses.expenseDate, date), eq(expenses.paymentMode, 'Cash')));

        const totalIn = Number(cashSales[0]?.total || 0) + Number(recoveriesTotal[0]?.total || 0);
        const totalOut = Number(expensesTotal[0]?.total || 0);
        const netCash = totalIn - totalOut;

        res.json({
            success: true,
            date,
            inflows: totalIn,
            outflows: totalOut,
            netCash,
            details: {
                cashSales: Number(cashSales[0]?.total || 0),
                recoveries: Number(recoveriesTotal[0]?.total || 0),
                expenses: Number(expensesTotal[0]?.total || 0)
            }
        });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.4 Tanker Sale (MongoDB)
// ==========================================
relationalRouter.post("/tanker-sales", async (req: Request, res: Response) => {
    try {
        // Map snake_case from frontend to camelCase for Mongoose model
        const {
            sale_date,
            fuel_product_id,
            tank_id, // Extract tank_id from frontend
            before_dip_stock,
            gross_stock,
            tanker_sale_quantity,
            notes
        } = req.body;

        const newRecord = new TankerSale({
            saleDate: sale_date,
            fuelProductId: fuel_product_id,
            tankId: tank_id, // Save tankId
            beforeDipStock: before_dip_stock,
            grossStock: gross_stock,
            tankerSaleQuantity: tanker_sale_quantity,
            notes: notes,
            createdBy: (req as any).user?.id
        });

        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        console.error("Error saving tanker sale:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/tanker-sales", async (req: Request, res: Response) => {
    try {
        const results = await TankerSale.find().sort({ saleDate: -1 });
        const mapped = results.map(r => ({
            id: r._id,
            sale_date: r.saleDate,
            fuel_product_id: r.fuelProductId,
            tank_id: (r as any).tankId,
            before_dip_stock: r.beforeDipStock,
            gross_stock: r.grossStock,
            tanker_sale_quantity: r.tankerSaleQuantity,
            notes: r.notes,
            created_at: (r as any).createdAt
        }));
        res.json({ success: true, rows: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.5 Guest Sales (MongoDB + Postgres Join)
// ==========================================
relationalRouter.post("/guest-sales", async (req: Request, res: Response) => {
    try {
        // Validation using Drizzle schema can be strict, so we extract directly
        const {
            saleDate,
            shift,
            customerName,
            mobileNumber,
            billNo,
            vehicleNumber,
            fuelProductId,
            pricePerUnit,
            amount, // Frontend sends 'amount' but model expects calculation or simply storing it
            discount,
            quantity,
            description,
            paymentMode,
            employeeId,
            gstNumber
        } = req.body;

        const calculatedTotal = amount ? Number(amount) : (Number(quantity) * Number(pricePerUnit)) - Number(discount || 0);

        const newRecord = new GuestSale({
            saleDate,
            shift,
            customerName,
            mobileNumber,
            billNo,
            vehicleNumber,
            fuelProductId,
            pricePerUnit,
            quantity,
            discount,
            paymentMode,
            totalAmount: calculatedTotal,
            description,
            employeeId,
            gstNumber,
            createdBy: (req as any).user?.id
        });

        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        console.error("Error saving guest sale:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/guest-sales", async (req: Request, res: Response) => {
    try {
        const { from, to, mobile } = req.query;
        let conditions: any = {};
        if (from || to) {
            conditions.saleDate = {};
            if (from) conditions.saleDate.$gte = new Date(String(from));
            if (to) conditions.saleDate.$lte = new Date(String(to));
        }
        if (mobile) {
            conditions.mobileNumber = { $regex: String(mobile) };
        }

        const results = await GuestSale.find(conditions).sort({ createdAt: -1 });

        const productIds = Array.from(new Set(results.map(r => r.fuelProductId).filter(Boolean)));
        let productsMap: Record<string, string> = {};
        if (productIds.length > 0) {
            // Use Mongo FuelProduct model instead of Postgres Drizzle
            const products = await FuelProduct.find({ _id: { $in: productIds } });
            products.forEach(p => productsMap[String(p._id)] = p.productName);
        }

        const mappedResults = results.map(r => ({
            ...r.toObject(),
            id: r._id,
            productName: r.fuelProductId ? productsMap[r.fuelProductId] : ''
        }));

        res.json({ success: true, data: mappedResults, rows: mappedResults });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.6 Attendance (MongoDB + Postgres Join)
// ==========================================
relationalRouter.post("/attendance", async (req: Request, res: Response) => {
    try {
        const data = insertAttendanceSchema.parse(req.body);
        const dateObj = data.attendanceDate ? new Date(data.attendanceDate) : new Date();
        const updated = await Attendance.findOneAndUpdate(
            { attendanceDate: dateObj, employeeId: data.employeeId },
            { ...data, attendanceDate: dateObj, createdBy: (req as any).user?.id },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: { ...updated.toObject(), id: updated._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/attendance/summary", async (req: Request, res: Response) => {
    try {
        const { employeeId, month, year } = req.query;
        if (!employeeId || !month || !year) return res.status(400).json({ error: "Missing params" });

        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 0, 23, 59, 59);

        const records = await Attendance.find({
            employeeId: String(employeeId),
            attendanceDate: { $gte: start, $lte: end }
        });

        let daysPresent = 0;
        records.forEach(r => {
            if (r.status === 'Present' || r.status === 'PRESENT') daysPresent += 1;
            else if (r.status === 'Half Day' || r.status === 'HALF-DAY') daysPresent += 0.5;
        });

        res.json({ success: true, employeeId, month, year, daysPresent, totalRecords: records.length });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/attendance/details", async (req: Request, res: Response) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ error: "Date is required" });

        const targetDate = new Date(String(date));
        const start = new Date(targetDate); start.setHours(0, 0, 0, 0);
        const end = new Date(targetDate); end.setHours(23, 59, 59, 999);

        const results = await Attendance.find({
            attendanceDate: { $gte: start, $lte: end }
        });

        const employeeIds = Array.from(new Set(results.map(r => r.employeeId).filter(Boolean)));
        let employeeMap: Record<string, { name: string, designation: string }> = {};

        if (employeeIds.length > 0) {
            const emps = await db.select({ id: employees.id, name: employees.employeeName, role: employees.designation })
                .from(employees)
                .where(inArray(employees.id, employeeIds as string[]));
            emps.forEach(e => employeeMap[e.id] = { name: e.name, designation: e.role || '' });
        }

        const mapped = results.map(r => ({
            ...r.toObject(),
            id: r._id,
            employeeName: employeeMap[r.employeeId]?.name || 'Unknown',
            designation: employeeMap[r.employeeId]?.designation || ''
        }));

        res.json({ success: true, data: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/attendance/bulk", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        if (!Array.isArray(body)) return res.status(400).json({ success: false, error: "Expected array" });

        const results = [];
        for (const item of body) {
            const data = insertAttendanceSchema.parse(item);
            const dateObj = data.attendanceDate ? new Date(data.attendanceDate) : new Date();
            const updated = await Attendance.findOneAndUpdate(
                { attendanceDate: dateObj, employeeId: data.employeeId },
                { ...data, attendanceDate: dateObj, createdBy: (req as any).user?.id },
                { new: true, upsert: true }
            );
            results.push({ ...updated.toObject(), id: updated._id });
        }
        res.json({ success: true, count: results.length, data: results });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/attendance/list", async (req: Request, res: Response) => {
    try {
        const { from, to } = req.query;
        let conditions: any = {};
        if (from && to) {
            conditions.attendanceDate = {
                $gte: new Date(String(from)),
                $lte: new Date(String(to))
            };
        }

        const allRecords = await Attendance.find(conditions).sort({ attendanceDate: -1 });

        const grouped: Record<string, { date: string, totalPresents: number, totalAbsents: number }> = {};

        allRecords.forEach(r => {
            const d = r.attendanceDate.toISOString().slice(0, 10);
            if (!grouped[d]) grouped[d] = { date: d, totalPresents: 0, totalAbsents: 0 };

            const status = r.status.toUpperCase();
            if (status === 'PRESENT') grouped[d].totalPresents += 1;
            else if (status === 'HALF-DAY' || status === 'HALF DAY') grouped[d].totalPresents += 0.5;
            else if (status === 'ABSENT') grouped[d].totalAbsents += 1;
        });

        const list = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
        res.json({ success: true, data: list });

    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.7 Duty Pay (MongoDB)
// ==========================================
relationalRouter.post("/duty-pay/entry", async (req: Request, res: Response) => {
    try {
        const data = insertDutyPayRecordSchema.parse(req.body);
        const net = (Number(data.grossSalary) || 0)
            - ((Number(data.pf) || 0) + (Number(data.esi) || 0) + (Number(data.loanDeduction) || 0)
                + (Number(data.advanceDeduction) || 0) + (Number(data.businessShortage) || 0));

        const finalData = {
            ...data,
            netSalary: net,
        };
        const newRecord = new DutyPayRecord(finalData);
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/duty-pay/summary", async (req: Request, res: Response) => {
    try {
        const records = await DutyPayRecord.find().sort({ salaryDate: -1 });
        const grouped: Record<string, { year: string, month: string, totalSalary: number, totalEmployees: Set<string>, rawDate: Date }> = {};

        records.forEach(r => {
            const d = new Date(r.salaryDate);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            const monthName = d.toLocaleString('default', { month: 'long' });

            if (!grouped[key]) {
                grouped[key] = {
                    year: d.getFullYear().toString(),
                    month: monthName,
                    totalSalary: 0,
                    totalEmployees: new Set(),
                    rawDate: r.salaryDate
                };
            }
            grouped[key].totalSalary += Number(r.netSalary || 0);
            if (r.employeeId) grouped[key].totalEmployees.add(r.employeeId);
        });

        const list = Object.values(grouped).map(g => ({
            year: g.year,
            month: g.month,
            totalSalary: g.totalSalary.toFixed(2),
            totalEmployee: g.totalEmployees.size,
            rawDate: g.rawDate
        })).sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());

        res.json({ success: true, data: list });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/duty-pay/details", async (req: Request, res: Response) => {
    try {
        const { year, month } = req.query; // Expecting year (e.g., "2026") and month (e.g., "January")

        if (!year || !month) {
            return res.status(400).json({ success: false, error: "Year and Month are required" });
        }

        // Convert Month Name to Index (0-11)
        const monthIndex = new Date(`${month} 1, 2000`).getMonth();

        const start = new Date(Number(year), monthIndex, 1);
        const end = new Date(Number(year), monthIndex + 1, 0, 23, 59, 59);

        const records = await DutyPayRecord.find({
            salaryDate: { $gte: start, $lte: end }
        }).sort({ salaryDate: -1 });

        // Fetch Employees to map names
        const allEmployees = await db.select({ id: employees.id, name: employees.employeeName })
            .from(employees);

        const employeeMap: Record<string, string> = {};
        allEmployees.forEach(e => employeeMap[e.id] = e.name);

        const mappedRecords = records.map(r => ({
            ...r.toObject(),
            id: r._id,
            employeeName: employeeMap[r.employeeId] || "Unknown"
        }));

        res.json({ success: true, data: mappedRecords });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.8 Sales Officer (MongoDB)
// ==========================================
relationalRouter.post("/sales-officer", async (req: Request, res: Response) => {
    try {
        const data = insertSalesOfficerInspectionSchema.parse(req.body);
        const newRecord = new SalesOfficerInspection({
            ...data,
            createdBy: (req as any).user?.id
        });
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.12 Credit Customers (MongoDB)
// ==========================================
relationalRouter.get("/credit-customers", async (req: Request, res: Response) => {
    try {
        const results = await CreditCustomer.find({ isActive: true }).sort({ createdAt: -1 });
        const mapped = results.map(r => ({ ...r.toObject(), id: r._id }));
        res.json({ success: true, ok: true, data: mapped, rows: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/credit-customers/cleanup-duplicates", async (req: Request, res: Response) => {
    try {
        const allCustomers = await CreditCustomer.find({ isActive: true }).sort({ createdAt: -1 });
        const seen = new Set();
        const duplicates: any[] = [];

        for (const customer of allCustomers) {
            // Using Organization Name as the unique key. 
            // You can add more fields like mobileNumber if needed: `${customer.organizationName}|${customer.mobileNumber}`
            const uniqueKey = customer.organizationName?.toLowerCase().trim();

            if (uniqueKey) {
                if (seen.has(uniqueKey)) {
                    duplicates.push(customer._id);
                } else {
                    seen.add(uniqueKey);
                }
            }
        }

        if (duplicates.length > 0) {
            await CreditCustomer.deleteMany({ _id: { $in: duplicates } });
        }

        res.json({ success: true, count: duplicates.length, message: `Deleted ${duplicates.length} duplicates` });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/credit-customers", async (req: Request, res: Response) => {
    try {
        const {
            organization_name, tin_gst_no, representative_name, organization_address,
            advance_amount, phone_number, alt_phone_no, credit_limit, username,
            password, email, opening_balance, opening_date, balance_type,
            discount_amount, offer_type, vehicles, penalty_interest,
            run_interest, grace_days, interest_percentage, registered_date, image
        } = req.body;

        const crypto = await import("crypto");
        const id = crypto.randomUUID();

        // Handle vehicles array mapping if needed
        const mappedVehicles = Array.isArray(vehicles) ? vehicles.map((v: any) => ({
            vehicleNo: v.vehicle_no,
            vehicleType: v.vehicle_type
        })) : [];

        const newCustomer = new CreditCustomer({
            _id: id,
            organizationName: organization_name,
            tinGstNo: tin_gst_no,
            representativeName: representative_name,
            organizationAddress: organization_address,
            advanceAmount: advance_amount,
            mobileNumber: phone_number,
            phoneNumber: phone_number,
            altPhone: alt_phone_no,
            creditLimit: credit_limit,
            username: username,
            password: password,
            email: email,
            openingBalance: opening_balance,
            openingDate: opening_date,
            balanceType: balance_type,
            discountAmount: discount_amount,
            offerType: offer_type,
            vehicles: mappedVehicles,
            penaltyInterest: penalty_interest,
            runInterest: run_interest,
            graceDays: grace_days,
            interestPercentage: interest_percentage,
            registeredDate: registered_date,
            image: image,
            isActive: true
        });

        const saved = await newCustomer.save();
        res.json({ success: true, ok: true, data: saved });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.put("/credit-customers/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            organization_name, tin_gst_no, representative_name, organization_address,
            advance_amount, phone_number, alt_phone_no, credit_limit, username,
            password, email, opening_balance, opening_date, balance_type,
            discount_amount, offer_type, vehicles, penalty_interest,
            run_interest, grace_days, interest_percentage, is_active, registered_date, image
        } = req.body;

        const updateData: any = {};
        if (organization_name !== undefined) updateData.organizationName = organization_name;
        if (tin_gst_no !== undefined) updateData.tinGstNo = tin_gst_no;
        if (representative_name !== undefined) updateData.representativeName = representative_name;
        if (organization_address !== undefined) updateData.organizationAddress = organization_address;
        if (advance_amount !== undefined) updateData.advanceAmount = advance_amount;
        if (phone_number !== undefined) {
            updateData.mobileNumber = phone_number;
            updateData.phoneNumber = phone_number;
        }
        if (alt_phone_no !== undefined) updateData.altPhone = alt_phone_no;
        if (credit_limit !== undefined) updateData.creditLimit = credit_limit;
        if (username !== undefined) updateData.username = username;
        if (password !== undefined) updateData.password = password;
        if (email !== undefined) updateData.email = email;
        if (opening_balance !== undefined) updateData.openingBalance = opening_balance;
        if (opening_date !== undefined) updateData.openingDate = opening_date;
        if (balance_type !== undefined) updateData.balanceType = balance_type;
        if (discount_amount !== undefined) updateData.discountAmount = discount_amount;
        if (offer_type !== undefined) updateData.offerType = offer_type;
        if (vehicles !== undefined) {
            updateData.vehicles = Array.isArray(vehicles) ? vehicles.map((v: any) => ({
                vehicleNo: v.vehicle_no,
                vehicleType: v.vehicle_type
            })) : [];
        }
        if (penalty_interest !== undefined) updateData.penaltyInterest = penalty_interest;
        if (run_interest !== undefined) updateData.runInterest = run_interest;
        if (grace_days !== undefined) updateData.graceDays = grace_days;
        if (interest_percentage !== undefined) updateData.interestPercentage = interest_percentage;
        if (is_active !== undefined) updateData.isActive = is_active;
        if (registered_date !== undefined) updateData.registeredDate = registered_date;
        if (image !== undefined) updateData.image = image;

        const updated = await CreditCustomer.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Customer not found" });

        res.json({ success: true, ok: true, data: updated });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/credit-customers/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await CreditCustomer.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Customer not found" });

        res.json({ success: true, ok: true, softDeleted: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.9 Credit Requests (MongoDB + MongoDB Check)
// ==========================================
relationalRouter.post("/credit-requests", async (req: Request, res: Response) => {
    try {
        const data = insertCreditRequestSchema.parse(req.body);

        // Check Credit Limit (MongoDB)
        const customer = await CreditCustomer.findById(data.creditCustomerId);

        res.json({ success: true, data: mappedRecords });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.8 Sales Officer (MongoDB -> Replaced by Postgres Daily Readings)
// ==========================================
// Kept for backward compat or reference if needed, but new UI uses tank-daily-readings
relationalRouter.post("/sales-officer", async (req: Request, res: Response) => {
    try {
        const data = insertSalesOfficerInspectionSchema.parse(req.body);
        const newRecord = new SalesOfficerInspection({
            ...data,
            createdBy: (req as any).user?.id
        });
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

import { tankDailyReadings, insertTankDailyReadingSchema, tanks } from "../../shared/schema.js";

// ==========================================
// 3.22 Tank Daily Readings (MongoDB Replacement)
// ==========================================
relationalRouter.post("/tank-daily-readings", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        // Parse date
        const readingDate = new Date(body.readingDate);
        readingDate.setUTCHours(0, 0, 0, 0); // Normalize time part if needed, usually string comparison is handled by Mongo date match if we store as Date

        // Check if exists
        const existing = await TankDailyReading.findOne({
            tankId: body.tankId,
            readingDate: body.readingDate // Or use a date range query if time components vary
        });

        // Find yesterdays reading for opening stock
        const prevDate = new Date(body.readingDate);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().slice(0, 10);

        const prevReading = await TankDailyReading.findOne({
            tankId: body.tankId,
            readingDate: prevDateStr
        });

        const openingStock = prevReading ? prevReading.closingStock : 0;

        // Logic for variation
        const stockReceived = Number(body.stockReceived || 0);
        const closingStock = Number(body.closingStock || 0);
        const meterSale = Number(body.meterSale || 0);
        const testing = Number(body.testing || 0);

        // Calculate Variation if not provided or double check
        // Variation = (Opening + Received - Closing) - (MeterSale - Testing) ?? OR
        // Variation = Actual Sales - Dip Sales
        // Dip Sales = (Opening + Received) - Closing
        // Actual Sales = MeterSale - Testing
        // Variation = Actual - Dip

        const dipSales = (openingStock + stockReceived) - closingStock;
        const actualSales = meterSale - testing;
        const variation = actualSales - dipSales;

        const finalData = {
            readingDate: body.readingDate,
            tankId: body.tankId,
            openingStock: openingStock,
            stockReceived: stockReceived,
            closingStock: closingStock,
            meterSale: meterSale,
            testing: testing,
            variation: variation,
            notes: body.notes,
            createdBy: (req as any).user?.id
        };

        if (existing) {
            const updated = await TankDailyReading.findByIdAndUpdate(existing._id, finalData, { new: true });
            return res.json({ success: true, data: { ...updated?.toObject(), id: updated?._id } });
        } else {
            const newRecord = new TankDailyReading(finalData);
            const saved = await newRecord.save();
            return res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
        }
    } catch (error: any) {
        console.error("Error saving tank reading:", error);
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/tank-daily-readings", async (req: Request, res: Response) => {
    try {
        const { date, fuelProductId } = req.query;
        let conditions: any = {};
        if (date) conditions.readingDate = new Date(String(date));

        // Filter by FuelProduct via Tank lookup
        let tankIds: string[] = [];
        if (fuelProductId) {
            const tanks = await Tank.find({ fuelProductId: String(fuelProductId) });
            tankIds = tanks.map(t => String(t._id));

            if (tankIds.length > 0) {
                conditions.tankId = { $in: tankIds };
            } else {
                return res.json({ success: true, rows: [] });
            }
        }

        const results = await TankDailyReading.find(conditions).sort({ readingDate: -1 });

        // Generate Report
        const report = await Promise.all(results.map(async (r) => {
            // Fetch Receipts (TankerSale)
            // Use TankerSale (Mongo)
            const receipts = await TankerSale.find({
                tankId: r.tankId,
                saleDate: new Date(r.readingDate) // Ensure date match functionality
            });
            const totalReceipts = receipts.reduce((sum, item) => sum + (item.tankerSaleQuantity || 0), 0);

            // Recalculate derived fields to ensure consistency
            const prevStock = Number(r.openingStock || 0);
            const totalStock = prevStock + totalReceipts;
            const currentStock = Number(r.closingStock || 0);
            const dipSales = totalStock - currentStock;
            const meterSales = Number(r.meterSale || 0);
            const testing = Number(r.testing || 0);
            const actualSales = meterSales - testing;
            const variation = actualSales - dipSales;

            return {
                id: r._id,
                date: r.readingDate,
                tankId: r.tankId, // Include tankId for frontend matching
                tank_id: r.tankId, // Alias
                previousStock: prevStock.toFixed(2),
                receipts: totalReceipts.toFixed(2),
                totalStock: totalStock.toFixed(2),
                currentStock: currentStock.toFixed(2),
                closing_stock: currentStock.toFixed(2), // Alias
                meterSales: meterSales.toFixed(2),
                meter_sale: meterSales.toFixed(2), // Alias
                testing: testing.toFixed(2),
                actualSales: actualSales.toFixed(2),
                dipSales: dipSales.toFixed(2),
                variation: variation.toFixed(2),
                variLimit: (actualSales * 0.006).toFixed(2),
                limit: actualSales ? (variation / actualSales * 100).toFixed(2) + '%' : '0.00%',
                limit4: (actualSales * 0.04).toFixed(2),
                dipReading: r.closingStock, // Alias for frontend pre-fill
                dip_reading: r.closingStock,
                notes: r.notes
            };
        }));

        res.json({ success: true, rows: report });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/credit-requests", async (req: Request, res: Response) => {
    try {
        const { from, to, organization } = req.query;

        let conditions: any = {};
        if (from && to) {
            conditions.requestDate = {
                $gte: new Date(String(from)),
                $lte: new Date(String(to))
            };
        }

        // Fetch from MongoDB
        const requests = await CreditRequest.find(conditions).sort({ requestDate: -1 });

        // Join with CreditCustomers (MongoDB)
        const customerIds = Array.from(new Set(requests.map(r => r.creditCustomerId).filter(Boolean)));
        let customerMap: Record<string, any> = {};

        if (customerIds.length > 0) {
            const customers = await CreditCustomer.find({ _id: { $in: customerIds } });
            customers.forEach(c => customerMap[String(c._id)] = c);
        }

        // Join with FuelProducts (MongoDB)
        const productIds = Array.from(new Set(requests.map(r => r.fuelProductId).filter(Boolean)));
        let productMap: Record<string, string> = {};

        if (productIds.length > 0) {
            const products = await FuelProduct.find({ _id: { $in: productIds } });
            products.forEach(p => productMap[String(p._id)] = p.productName);
        }

        // Map and Filter by Organization
        let mapped = requests.map(r => {
            const customer = customerMap[r.creditCustomerId];
            return {
                ...r.toObject(),
                id: r._id,
                orgName: customer?.organizationName || 'Unknown',
                vehicleNumber: r.vehicleNumber || '-',
                productName: r.fuelProductId ? productMap[r.fuelProductId] : '-',
                orderedUnit: r.quantity,
                orderedType: 'Bulk',
                description: r.description || '-'
            };
        });

        if (organization) {
            const orgFilter = String(organization).toLowerCase();
            mapped = mapped.filter(r => r.orgName.toLowerCase().includes(orgFilter));
        }

        res.json({ success: true, rows: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.10 Expiry Items (MongoDB)
// ==========================================
relationalRouter.get("/expiry-alerts", async (req: Request, res: Response) => {
    try {
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + 30);

        const alerts = await ExpiryItem.find({
            status: 'Active',
            expiryDate: { $lte: targetDate }
        });

        const mapped = alerts.map(a => ({ ...a.toObject(), id: a._id }));

        res.json({ success: true, count: mapped.length, data: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.11 Feedback (MongoDB)
// ==========================================
relationalRouter.get("/feedback", async (req: Request, res: Response) => {
    try {
        const results = await Feedback.find().sort({ createdAt: -1 });
        const mapped = results.map(r => ({ ...r.toObject(), id: r._id }));
        res.json({ success: true, data: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/feedback", async (req: Request, res: Response) => {
    try {
        const data = insertFeedbackSchema.parse(req.body);
        const newRecord = new Feedback({
            mobileNumber: data.mobileNumber,
            rating: data.rating,
            comments: data.message, // Map message to comments
            createdBy: (req as any).user?.id
        });
        const saved = await newRecord.save();
        res.json({ success: true, data: { ...saved.toObject(), id: saved._id } });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

// ==========================================
// 4.0 DAILY REPORT SUPPORT ROUTES (Postgres)
// ==========================================

relationalRouter.get("/expenses", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, payment_mode } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(expenses.expenseDate, String(from_date)));
        if (to_date) conditions.push(lte(expenses.expenseDate, String(to_date)));
        if (payment_mode) conditions.push(eq(expenses.paymentMode, String(payment_mode)));

        const results = await db.select().from(expenses)
            .where(and(...conditions))
            .orderBy(desc(expenses.expenseDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/recoveries", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, payment_mode } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(recoveries.recoveryDate, String(from_date)));
        if (to_date) conditions.push(lte(recoveries.recoveryDate, String(to_date)));
        if (payment_mode) conditions.push(eq(recoveries.paymentMode, String(payment_mode)));

        const results = await db.select().from(recoveries)
            .where(and(...conditions))
            .orderBy(desc(recoveries.recoveryDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/sale-entries", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, shift_id } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(saleEntries.saleDate, String(from_date)));
        if (to_date) conditions.push(lte(saleEntries.saleDate, String(to_date)));
        if (shift_id) conditions.push(eq(saleEntries.shiftId, String(shift_id)));

        const results = await db.select().from(saleEntries)
            .where(and(...conditions))
            .orderBy(desc(saleEntries.saleDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/credit-sales", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(creditSales.saleDate, String(from_date)));
        if (to_date) conditions.push(lte(creditSales.saleDate, String(to_date)));

        const results = await db.select().from(creditSales)
            .where(and(...conditions))
            .orderBy(desc(creditSales.saleDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Fix import alias first if needed in previous lines, or just use lubSales here which we will assume is available or we fix imports.
// Actually, I'll update the imports in a separate Edit if needed, but for now I'll use the variable name 'lubSales' assuming I renamed it or it matches.
// Wait, I should probably match whatever is imported. 
// If schema has 'lubSales', then I should use 'lubSales'.
// The previous tool snippet showed 'lubricantSales' imported. I will change that import line in a separate call or just use 'lubSales' if I can.
// Let's assume I fix the import in the import section.

relationalRouter.get("/lubricant-sales", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date, product, employee } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(lubSales.saleDate, String(from_date)));
        if (to_date) conditions.push(lte(lubSales.saleDate, String(to_date)));

        // Add filters if frontend sends them
        if (product && product !== 'All') conditions.push(eq(lubSales.product, String(product)));

        // Join with employees to get names if needed, but employeeId is UUID. 
        // Frontend might want employee name.
        const results = await db.select({
            ...lubSales,
            employeeName: employees.employeeName
        })
            .from(lubSales)
            .leftJoin(employees, eq(lubSales.employeeId, employees.id))
            .where(and(...conditions))
            .orderBy(desc(lubSales.saleDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/lubricant-sales", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        // Parse using schema
        const data = insertLubSaleSchema.parse(body);

        const saved = await db.insert(lubSales).values(data).returning();
        res.json({ success: true, data: saved[0], ok: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/lubricant-sales/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(lubSales).where(eq(lubSales.id, id));
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/denominations", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(denominations.denominationDate, String(from_date)));
        if (to_date) conditions.push(lte(denominations.denominationDate, String(to_date)));

        const results = await db.select().from(denominations)
            .where(and(...conditions))
            .orderBy(desc(denominations.denominationDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/swipe-transactions", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(swipeTransactions.transactionDate, String(from_date)));
        if (to_date) conditions.push(lte(swipeTransactions.transactionDate, String(to_date)));

        const results = await db.select().from(swipeTransactions)
            .where(and(...conditions))
            .orderBy(desc(swipeTransactions.transactionDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/employee-cash-recovery", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(employeeCashRecovery.recoveryDate, String(from_date)));
        if (to_date) conditions.push(lte(employeeCashRecovery.recoveryDate, String(to_date)));

        const results = await db.select().from(employeeCashRecovery)
            .where(and(...conditions))
            .orderBy(desc(employeeCashRecovery.recoveryDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.get("/day-settlements", async (req: Request, res: Response) => {
    try {
        const { from_date, to_date } = req.query;
        let conditions = [];
        if (from_date) conditions.push(gte(daySettlements.settlementDate, String(from_date)));
        if (to_date) conditions.push(lte(daySettlements.settlementDate, String(to_date)));

        const results = await db.select().from(daySettlements)
            .where(and(...conditions))
            .orderBy(desc(daySettlements.settlementDate));

        res.json({ success: true, rows: results, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});



// ==========================================
// 3.10 Expiry Items (Hybrid: Mongo Fallback)
// ==========================================
relationalRouter.get("/expiry-items", async (req: Request, res: Response) => {
    try {
        if (!process.env.DATABASE_URL) {
            const results = await ExpiryItem.find({ status: 'Active' }).sort({ createdAt: -1 });
            const mapped = results.map((r, index) => ({
                ...r.toObject(),
                id: r._id,
                item_name: r.itemName,
                issue_date: r.issueDate,
                expiry_date: r.expiryDate, // Ensure field matches frontend expectation
                category_name: (r as any).category || '',
                created_at: r.createdAt,
                s_no: index + 1
            }));
            return res.json({ success: true, rows: mapped, ok: true });
        }

        const results = await db.select().from(expiryItems).orderBy(desc(expiryItems.createdAt));
        const mapped = results.map((r, index) => ({
            ...r,
            item_name: r.itemName,
            issue_date: r.issueDate,
            expiry_date: r.expiryDate,
            category_name: r.category,
            created_at: r.createdAt,
            s_no: index + 1
        }));
        res.json({ success: true, rows: mapped, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/expiry-items", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const data = {
            itemName: body.item_name,
            issueDate: body.issue_date || null,
            expiryDate: body.expiry_date,
            category: body.category || body.category_name,
            status: body.status || 'Active'
        };

        if (!process.env.DATABASE_URL) {
            const newRecord = new ExpiryItem(data);
            const saved = await newRecord.save();
            return res.json({ success: true, rows: [{ ...saved.toObject(), id: saved._id }], ok: true });
        }

        const parsed = insertExpiryItemSchema.parse(data);
        const result = await db.insert(expiryItems).values(parsed).returning();
        res.json({ success: true, rows: result, ok: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/expiry-items/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(expiryItems).where(eq(expiryItems.id, id));
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Categories (for Dropdown)
relationalRouter.get("/categories", async (req: Request, res: Response) => {
    try {
        const results = await db.select().from(expiryCategories).where(eq(expiryCategories.isActive, true));
        const mapped = results.map(r => ({
            ...r,
            category_name: r.categoryName,
            created_at: r.createdAt
        }));
        res.json({ success: true, rows: mapped, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/categories", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const data = {
            categoryName: body.category_name,
            description: body.description
        };
        const parsed = insertExpiryCategorySchema.parse(data);
        const result = await db.insert(expiryCategories).values(parsed).returning();
        res.json({ success: true, rows: result, ok: true });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/categories/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await db.delete(expiryCategories).where(eq(expiryCategories.id, id));
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ==========================================
// 3.15 Employees (MongoDB)
// ==========================================
relationalRouter.get("/employees", async (req: Request, res: Response) => {
    try {
        const results = await Employee.find({ isActive: true }).sort({ createdAt: -1 });
        const mapped = results.map(r => ({
            ...r.toObject(),
            id: r._id,
            join_date: r.joinDate,
            employee_name: r.employeeName,
            name: r.employeeName,          // For compatibility with other dropdowns
            full_name: r.employeeName,     // For forward compatibility
            employee_number: r.employeeNumber,
            mobile_number: r.mobileNumber,
            id_proof_no: r.idProofNumber,
            salary_type: r.salaryType,
            has_pf: r.benefits?.providentFund,
            has_income_tax: r.benefits?.incomeTax,
            has_esi: r.benefits?.esi,
            created_at: r.createdAt
        }));
        res.json({ success: true, ok: true, rows: mapped, data: mapped });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

relationalRouter.post("/employees", async (req: Request, res: Response) => {
    try {
        const {
            join_date, employee_name, employee_number, mobile_number, id_proof_no,
            designation, salary_type, salary, address, description,
            has_pf, has_income_tax, has_esi, image
        } = req.body;

        const crypto = await import("crypto");
        const id = crypto.randomUUID();

        const newEmployee = new Employee({
            _id: id,
            joinDate: join_date,
            employeeName: employee_name,
            employeeNumber: employee_number,
            mobileNumber: mobile_number,
            idProofNumber: id_proof_no,
            designation: designation,
            salaryType: salary_type,
            salary: salary,
            address: address,
            description: description,
            image: image,
            benefits: {
                providentFund: has_pf || false,
                incomeTax: has_income_tax || false,
                esi: has_esi || false
            },
            isActive: true
        });

        const saved = await newEmployee.save();
        res.json({ success: true, ok: true, data: saved });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.put("/employees/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            join_date, employee_name, employee_number, mobile_number, id_proof_no,
            designation, salary_type, salary, address, description,
            has_pf, has_income_tax, has_esi, image
        } = req.body;

        const updateData: any = {};
        if (join_date !== undefined) updateData.joinDate = join_date;
        if (employee_name !== undefined) updateData.employeeName = employee_name;
        if (employee_number !== undefined) updateData.employeeNumber = employee_number;
        if (mobile_number !== undefined) updateData.mobileNumber = mobile_number;
        if (id_proof_no !== undefined) updateData.idProofNumber = id_proof_no;
        if (designation !== undefined) updateData.designation = designation;
        if (salary_type !== undefined) updateData.salaryType = salary_type;
        if (salary !== undefined) updateData.salary = salary;
        if (address !== undefined) updateData.address = address;
        if (description !== undefined) updateData.description = description;
        if (image !== undefined) updateData.image = image;

        if (has_pf !== undefined || has_income_tax !== undefined || has_esi !== undefined) {
            // Retrieve existing first if partial update needed, but usually UI sends all
            // For simplicity, we assume UI sends checkboxes state which defaults to false
            // But PUT might be partial. Let's rely on what is sent.
            const current = await Employee.findById(id);
            const currentBenefits = current?.benefits || { providentFund: false, incomeTax: false, esi: false };

            updateData.benefits = {
                providentFund: has_pf !== undefined ? has_pf : currentBenefits.providentFund,
                incomeTax: has_income_tax !== undefined ? has_income_tax : currentBenefits.incomeTax,
                esi: has_esi !== undefined ? has_esi : currentBenefits.esi
            };
        }

        const updated = await Employee.findByIdAndUpdate(id, updateData, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Employee not found" });

        res.json({ success: true, ok: true, data: updated });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

relationalRouter.delete("/employees/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updated = await Employee.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!updated) return res.status(404).json({ success: false, error: "Employee not found" });
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

