
import { Router, Request, Response } from "express";
import { db } from "../db";
import {
    saleEntries, nozzles, fuelProducts, dailySaleRates, employees, dutyShifts, users, tanks,
    insertSaleEntrySchema
} from "../../shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import {
    Nozzle, DailySaleRate, FuelProduct, Tank, SaleEntry, DutyShift, Employee, User
} from "../models";

export const saleEntriesRouter = Router();

// GET /api/nozzles-with-last-readings?date=YYYY-MM-DD
saleEntriesRouter.get("/nozzles-with-last-readings", async (req: Request, res: Response) => {
    try {
        const dateStr = req.query.date as string || new Date().toISOString().slice(0, 10);

        // MongoDB Path
        if (!process.env.DATABASE_URL) {
            // Fetch active nozzles
            const activeNozzles = await Nozzle.find({ isActive: true }).sort({ pumpStation: 1, nozzleNumber: 1 });

            // Need Tank Numbers and Product Names
            const tankIds = activeNozzles.map(n => n.tankId).filter(Boolean);
            const productIds = activeNozzles.map(n => n.fuelProductId).filter(Boolean);

            const tanksList = await Tank.find({ _id: { $in: tankIds } });
            const productsList = await FuelProduct.find({ _id: { $in: productIds } });

            const tankMap = tanksList.reduce((acc, t) => ({ ...acc, [String(t._id)]: t.tankNumber }), {} as Record<string, string>);
            const productMap = productsList.reduce((acc, p) => ({ ...acc, [String(p._id)]: p.productName }), {} as Record<string, string>);

            // Fetch daily rates for date
            const rates = await DailySaleRate.find({
                rateDate: { $gte: new Date(dateStr), $lte: new Date(dateStr + "T23:59:59") }
            });
            const ratesMap = new Map();
<<<<<<< HEAD
            rates.forEach(r => ratesMap.set(r.fuelProductId, r.closeRate));
=======
            rates.forEach((r: any) => ratesMap.set(r.fuelProductId, r.closeRate));
>>>>>>> b1b708d (Fix typescript errors and deployment issues)

            const rows = await Promise.all(activeNozzles.map(async (n) => {
                // Get last closing reading
                const lastEntry = await SaleEntry.findOne({ nozzleId: String(n._id) })
                    .sort({ saleDate: -1, createdAt: -1 });

                return {
                    id: n._id,
                    nozzle_number: n.nozzleNumber,
                    tank_number: tankMap[n.tankId] || '',
                    pump_station: n.pumpStation,
                    fuel_product_id: n.fuelProductId,
                    product_name: productMap[n.fuelProductId] || '',
                    last_closing_reading: lastEntry ? lastEntry.closingReading : "0",
                    current_rate: ratesMap.get(n.fuelProductId) || 0
                };
            }));

            return res.json({ success: true, ok: true, rows });
        }

        // Postgres Path
        const activeNozzles = await db.select({
            id: nozzles.id,
            nozzle_number: nozzles.nozzleNumber,
            tank_number: tanks.tankNumber, // Join correct table
            pump_station: nozzles.pumpStation,
            fuel_product_id: nozzles.fuelProductId,
            product_name: fuelProducts.productName
        })
            .from(nozzles)
            .leftJoin(fuelProducts, eq(nozzles.fuelProductId, fuelProducts.id))
            .leftJoin(tanks, eq(nozzles.tankId, tanks.id)) // Join tanks
            .where(eq(nozzles.isActive, true))
            .orderBy(nozzles.pumpStation, nozzles.nozzleNumber);

        // Fetch daily rates for the given date
        const rates = await db.select()
            .from(dailySaleRates)
            .where(eq(dailySaleRates.rateDate, dateStr));

        const ratesMap = new Map();
<<<<<<< HEAD
        rates.forEach(r => ratesMap.set(r.fuelProductId, r.closeRate));

        const rows = await Promise.all(activeNozzles.map(async (n) => {
=======
        rates.forEach((r: any) => ratesMap.set(r.fuelProductId, r.closeRate));

        const rows = await Promise.all(activeNozzles.map(async (n: any) => {
>>>>>>> b1b708d (Fix typescript errors and deployment issues)
            // Get last closing reading
            const lastEntry = await db.select({ closingReading: saleEntries.closingReading })
                .from(saleEntries)
                .where(eq(saleEntries.nozzleId, n.id))
                .orderBy(desc(saleEntries.saleDate), desc(saleEntries.createdAt))
                .limit(1);

            return {
                ...n,
                last_closing_reading: lastEntry.length > 0 ? lastEntry[0].closingReading : "0",
                current_rate: ratesMap.get(n.fuel_product_id) || 0
            };
        }));

        res.json({ success: true, ok: true, rows });
    } catch (error: any) {
        console.error("Error fetching nozzles:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/sale-entries
saleEntriesRouter.get("/sale-entries", async (req: Request, res: Response) => {
    try {
        const { from, to, product } = req.query;

        // MongoDB Path
        if (!process.env.DATABASE_URL) {
            let conditions: any = {};
            if (from && to) {
                // Ensure 'to' covers the full day
                const toDate = new Date(String(to));
                toDate.setHours(23, 59, 59, 999);

                conditions.saleDate = {
                    $gte: new Date(String(from)),
                    $lte: toDate
                };
            }
            // Product filtering requires mapping product name to ID first, OR we fetch all and filter in memory
            // Or look up product ID by name
            if (product && product !== 'All') {
                const prod = await FuelProduct.findOne({ productName: String(product) });
                if (prod) conditions.fuelProductId = prod._id;
                else conditions.fuelProductId = "non_existent";
            }

            // Using lean() for performance and simple object return
            const entries = await SaleEntry.find(conditions).sort({ saleDate: -1, createdAt: -1 });

            // Fetch related data for mapping
            // This is N+1 susceptible but for now fine
            const rows = await Promise.all(entries.map(async (e) => {
                const nozzle = await Nozzle.findById(e.nozzleId);
                const tank = nozzle ? await Tank.findById(nozzle.tankId) : null;
                const prod = await FuelProduct.findById(e.fuelProductId);
                const shift = e.shiftId ? await DutyShift.findById(e.shiftId) : null;
                const emp = await Employee.findById(e.employeeId);
                const user = e.createdBy ? await User.findById(e.createdBy) : null;

                return {
                    id: e._id,
                    sale_date: e.saleDate instanceof Date ? e.saleDate.toISOString().slice(0, 10) : e.saleDate,
                    pump_station: e.pumpStation,
                    tank_number: tank ? tank.tankNumber : '',
                    product_name: prod ? prod.productName : '',
                    shift: shift ? shift.shiftName : '',
                    nozzle_number: nozzle ? nozzle.nozzleNumber : '',
                    opening_reading: e.openingReading,
                    closing_reading: e.closingReading,
                    price_per_unit: e.pricePerUnit,
                    quantity: e.quantity,
                    net_sale_amount: e.netSaleAmount,
                    employee_name: emp ? emp.employeeName : '',
                    created_at: e.createdAt,
                    created_by: user ? (user.fullName || user.username) : ''
                };
            }));

            return res.json({ success: true, ok: true, rows });
        }

        // Postgres Path
        let query = db.select({
            id: saleEntries.id,
            sale_date: saleEntries.saleDate,
            pump_station: saleEntries.pumpStation,
            tank_number: tanks.tankNumber,
            product_name: fuelProducts.productName,
            shift: dutyShifts.shiftName,
            nozzle_number: nozzles.nozzleNumber,
            opening_reading: saleEntries.openingReading,
            closing_reading: saleEntries.closingReading,
            price_per_unit: saleEntries.pricePerUnit,
            quantity: saleEntries.quantity,
            net_sale_amount: saleEntries.netSaleAmount,
            employee_name: employees.employeeName,
            created_at: saleEntries.createdAt,
            created_by: users.fullName
        })
            .from(saleEntries)
            .leftJoin(nozzles, eq(saleEntries.nozzleId, nozzles.id))
            .leftJoin(fuelProducts, eq(saleEntries.fuelProductId, fuelProducts.id))
            .leftJoin(dutyShifts, eq(saleEntries.shiftId, dutyShifts.id))
            .leftJoin(employees, eq(saleEntries.employeeId, employees.id))
            .leftJoin(users, eq(saleEntries.createdBy, users.id))
            .leftJoin(tanks, eq(nozzles.tankId, tanks.id)); // Join tanks here too

        const conditions = [];
        if (from) conditions.push(sql`${saleEntries.saleDate} >= ${from}`);
        if (to) conditions.push(sql`${saleEntries.saleDate} <= ${to}`);
        if (product && product !== 'All') conditions.push(eq(fuelProducts.productName, product as string));

        if (conditions.length > 0) {
            // @ts-ignore
            query.where(and(...conditions));
        }

        // @ts-ignore
        query.orderBy(desc(saleEntries.saleDate), desc(saleEntries.createdAt));

        const rows = await query;
        res.json({ success: true, ok: true, rows });
    } catch (error: any) {
        console.error("Error fetching sale entries:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/sale-entries
saleEntriesRouter.post("/sale-entries", async (req: Request, res: Response) => {
    try {
        const body = req.body; // Array of entries

        if (!Array.isArray(body)) {
            return res.status(400).json({ success: false, error: "Expected array of entries" });
        }

        // MongoDB Path
        if (!process.env.DATABASE_URL) {
            const results = [];
            for (const entry of body) {
                // Calculate derived fields
                const open = parseFloat(entry.opening_reading);
                const close = parseFloat(entry.closing_reading);
                const test = parseFloat(entry.test_qty || '0');
                const price = parseFloat(entry.price_per_unit);

                const quantity = Math.max(0, (close - open) - test).toFixed(2);
                let netSaleAmount = entry.net_sale_amount;
                if (!netSaleAmount) {
                    netSaleAmount = (parseFloat(quantity) * price).toFixed(2);
                }

                const newEntry = new SaleEntry({
                    saleDate: entry.sale_date,
                    shiftId: entry.shift_id,
                    pumpStation: entry.pump_station,
                    nozzleId: entry.nozzle_id,
                    fuelProductId: entry.fuel_product_id,
                    openingReading: open,
                    closingReading: close,
                    testQty: test,
                    pricePerUnit: price,
                    quantity: parseFloat(quantity),
                    netSaleAmount: parseFloat(netSaleAmount),
                    employeeId: entry.employee_id,
                    createdBy: (req as any).user?.id
                });

                const saved = await newEntry.save();
                results.push({ ...saved.toObject(), id: saved._id });
            }
            return res.json({ success: true, ok: true, count: results.length });
        }

        // Postgres Path
        const results = [];
        for (const entry of body) {
            // Calculate derived fields
            const open = parseFloat(entry.opening_reading);
            const close = parseFloat(entry.closing_reading);
            const test = parseFloat(entry.test_qty || '0');
            const price = parseFloat(entry.price_per_unit);

            const quantity = Math.max(0, (close - open) - test).toFixed(2);

            // Use provided net_sale_amount if available (manual override), otherwise calculate
            let netSaleAmount = entry.net_sale_amount;
            if (!netSaleAmount) {
                netSaleAmount = (parseFloat(quantity) * price).toFixed(2);
            }

            const formatted = {
                saleDate: entry.sale_date,
                shiftId: entry.shift_id,
                pumpStation: entry.pump_station,
                nozzleId: entry.nozzle_id,
                fuelProductId: entry.fuel_product_id,
                openingReading: entry.opening_reading?.toString(),
                closingReading: entry.closing_reading?.toString(),
                quantity: quantity.toString(),
                pricePerUnit: entry.price_per_unit?.toString(),
                netSaleAmount: netSaleAmount.toString(),
                employeeId: entry.employee_id,
                createdBy: (req as any).user?.id
            };

            console.log("Saving entry:", formatted);
            const saved = await db.insert(saleEntries).values(formatted).returning();
            results.push(saved[0]);
        }

        res.json({ success: true, ok: true, count: results.length });
    } catch (error: any) {
        console.error("Error saving sale entries:", error);
        res.status(500).json({ success: false, error: error.message || "DB Error" });
    }
});

// DELETE /api/sale-entries/:id
saleEntriesRouter.delete("/sale-entries/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!process.env.DATABASE_URL) {
            await SaleEntry.findByIdAndDelete(id);
            return res.json({ success: true, ok: true });
        }

        await db.delete(saleEntries).where(eq(saleEntries.id, id));
        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/sale-entries-batch
saleEntriesRouter.delete("/sale-entries-batch", async (req: Request, res: Response) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: "No IDs provided" });
        }

        if (!process.env.DATABASE_URL) {
            await SaleEntry.deleteMany({ _id: { $in: ids } });
            return res.json({ success: true, ok: true });
        }

        // Using inArray would be better but for now looping is acceptable if handled in transaction or simple delete with 'in'
        // Drizzle select In: 
        const { inArray } = await import("drizzle-orm");

        await db.delete(saleEntries).where(inArray(saleEntries.id, ids));

        res.json({ success: true, ok: true });
    } catch (error: any) {
        console.error("Batch delete error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});
