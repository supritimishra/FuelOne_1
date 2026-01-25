// @ts-nocheck
import { Router } from "express";
import { AuthRequest } from "./auth.js";
import mongoose from "mongoose";

// Import Mongoose Models
// NOTE: We used to import models inside handlers to avoid circular dips but standard top-level import is fine now
import { FuelProduct } from "./models/FuelProduct.js";
import { DailySaleRate } from "./models/DailySaleRate.js";
import { BusinessTransaction } from "./models/BusinessTransaction.js";
import { CreditCustomer } from "./models/CreditCustomer.js";
import { Vendor, VendorTransaction } from "./models/VendorTransaction.js";
import { Employee } from "./models/Employee.js";
import { FuelProductService } from "./services/FuelProductService.js";

export const router = Router();

// Middleware helper to ensure tenantId
const ensureTenant = (req: any, res: any) => {
    if (!req.user || !req.user.tenantId) {
        res.status(400).json({ ok: false, error: "Missing tenant context" });
        return false;
    }
    return req.user.tenantId;
};

// GET /fuel-products - List active fuel products
router.get("/fuel-products", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        // Ensure defaults exist
        await FuelProductService.ensureDefaults(tenantId);

        const products = await FuelProductService.getActiveProducts(tenantId);

        // Map to provide both camelCase (Standard) and snake_case (Legacy compatibility)
        // Also provide id alias for _id
        const mapped = products.map(p => {
            const obj = p.toObject();
            return {
                ...obj,
                id: p._id,
                // Snake case aliases for older components
                product_name: obj.productName,
                short_name: obj.shortName,
                is_active: obj.isActive
            };
        });

        res.json({ ok: true, data: mapped, rows: mapped });
    } catch (error: any) {
        console.error("[GET /fuel-products] Error:", error);
        res.status(500).json({ ok: false, error: "Failed to fetch fuel products" });
    }
});

// POST /fuel-products - Create new
router.post("/fuel-products", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const product = await FuelProductService.createOrUpdate(null, req.body, tenantId);
        res.status(201).json({ ok: true, message: "Fuel product created", data: product });
    } catch (error: any) {
        console.error("[POST /fuel-products] Error:", error);
        res.status(500).json({ ok: false, error: error.message || "Failed to create fuel product" });
    }
});

// PUT /fuel-products/:id - Update existing
router.put("/fuel-products/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        const product = await FuelProductService.createOrUpdate(id, req.body, tenantId);

        if (!product) return res.status(404).json({ ok: false, error: "Fuel product not found" });

        res.json({ ok: true, message: "Fuel product updated", data: product });
    } catch (error: any) {
        console.error("[PUT /fuel-products/:id] Error:", error);
        res.status(500).json({ ok: false, error: error.message || "Failed to update fuel product" });
    }
});

// DELETE /fuel-products/:id - Deactivate
router.delete("/fuel-products/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        const product = await FuelProductService.deactivate(id, tenantId);

        if (!product) return res.status(404).json({ ok: false, error: "Fuel product not found" });

        res.json({ ok: true, message: "Fuel product deactivated" });
    } catch (error: any) {
        console.error("[DELETE /fuel-products/:id] Error:", error);
        res.status(500).json({ ok: false, error: "Failed to deactivate fuel product" });
    }
});

// GET /daily-rates - Get rates for a specific date and shift
router.get("/daily-rates", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { date, shift } = req.query;
        if (!date || typeof date !== 'string') {
            return res.status(400).json({ ok: false, error: "Date parameter is required (YYYY-MM-DD)" });
        }
        const shiftVal = (typeof shift === 'string' && (shift === 'S-1' || shift === 'S-2')) ? shift : 'S-1';

        const rates = await DailySaleRate.find({
            tenantId,
            date: date,
            shift: shiftVal
        });

        res.json({ ok: true, data: rates.map(r => ({ ...r.toObject(), id: r._id })) });
    } catch (error: any) {
        console.error("[GET /daily-rates] Error:", error);
        res.status(500).json({ ok: false, error: "Failed to fetch daily rates" });
    }
});

// POST /daily-rates - Save rates for a date
router.post("/daily-rates", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const authReq = req as AuthRequest;
        const { date, shift, rates } = req.body;

        if (!date || !Array.isArray(rates)) {
            return res.status(400).json({ ok: false, error: "Invalid payload. Required: date, rates[]" });
        }

        if (shift !== 'S-1' && shift !== 'S-2') {
            return res.status(400).json({ ok: false, error: "Invalid shift. Must be 'S-1' or 'S-2'." });
        }

        // 1. Strict Duplicate Check: If ANY entry exists for this Date + Shift, REJECT.
        const existingCount = await DailySaleRate.countDocuments({
            tenantId,
            date: date,
            shift: shift
        });

        if (existingCount > 0) {
            return res.status(400).json({
                ok: false,
                error: "Shift sheet already exists for this date and shift."
            });
        }

        // Process each rate entry
        const toInsert = [];
        for (const item of rates) {
            const { fuelProductId, openRate, closeRate } = item;

            // Resolve product to get shortName (HSD, MS, XP)
            const product = await FuelProductService.resolveProduct(fuelProductId, tenantId);

            let productName = product ? product.shortName : "Unknown";

            if (productName === "Unknown") {
                // Last ditch effort: if shortName or productName passed directly
                const fallback = item.shortName || item.productName || (typeof fuelProductId === 'string' ? fuelProductId : null);
                if (fallback) productName = fallback;
            }

            toInsert.push({
                tenantId,
                date: date,
                shift: shift,
                fuelProduct: productName,
                openRate: openRate ? Number(openRate) : 0,
                closeRate: closeRate ? Number(closeRate) : 0,
                createdBy: authReq.user?.userId
            });
        }

        if (toInsert.length > 0) {
            await DailySaleRate.insertMany(toInsert);
        }

        res.json({ ok: true, message: "Rates saved successfully" });

    } catch (error: any) {
        console.error("[POST /daily-rates] Error:", error);
        res.status(500).json({ ok: false, error: "Failed to save daily rates: " + error.message });
    }
});

// ==========================================
// BUSINESS TRANSACTIONS MODULE
// ==========================================

// GET /credit-customers - List for dropdown
router.get("/credit-customers", async (req, res) => {
    try {
        // Fetch all active credit customers as requested ("makesure every data visible in the list")
        const custs = await CreditCustomer.find({ is_active: true });

        // The model now matches the snake_case collection fields
        const rows = custs.map(c => {
            const obj = c.toObject();
            return {
                ...obj,
                id: obj._id
            };
        });

        res.json({ ok: true, rows });
    } catch (e: any) {
        console.error("[GET /credit-customers] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// GET /vendors - List for dropdown
router.get("/vendors", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        // Multi-stage vendor list retrieval for dropdown
        // Find vendors belonging to this tenant OR vendors that have NO tenantId (global vendors)
        const vendorsList = await Vendor.find({
            $or: [
                { tenantId, isActive: true },
                { tenantId: { $exists: false }, isActive: true },
                { tenantId: null, isActive: true }
            ]
        });

        const data = vendorsList.map(v => ({
            id: v._id.toString(),
            _id: v._id.toString(),
            vendor_name: v.vendorName || v.vendor_name || 'Unknown Vendor'
        }));

        res.json({ ok: true, rows: data });
    } catch (e: any) {
        console.error("[GET /vendors] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /vendors - Create a new vendor
router.post("/vendors", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { vendorName, vendorType, contactPerson, mobileNumber, email, address, gstNumber, panNumber, openingBalance, openingDate, openingType, description } = req.body;

        if (!vendorName) {
            return res.status(400).json({ ok: false, error: "Vendor name is required" });
        }

        const payload = {
            tenantId,
            vendorName: vendorName.trim(),
            vendorType: vendorType || 'Liquid',
            contactPerson: contactPerson || null,
            mobileNumber: mobileNumber || null,
            email: email || null,
            address: address || null,
            gstNumber: gstNumber || null,
            panNumber: panNumber || null,
            openingBalance: openingBalance ? Number(openingBalance) : 0,
            openingDate: openingDate || null,
            openingType: openingType || 'Debit',
            description: description || '',
            isActive: true
        };

        const newVendor = await Vendor.create(payload);

        res.status(201).json({
            ok: true,
            message: "Vendor created successfully",
            data: { ...newVendor.toObject(), id: newVendor._id }
        });
    } catch (e: any) {
        console.error("[POST /vendors] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// GET /employees - List for dropdown
router.get("/employees", async (req, res) => {
    try {
        // Cross-tenant employee retrieval - include all by default, status can be filtered if needed
        const emps = await Employee.find({
            $or: [{ isActive: true }, { isActive: { $exists: false } }, { status: 'Active' }]
        });

        res.json({
            ok: true,
            rows: emps.map(e => {
                const obj = e.toObject();
                // Ensure id is a simple string for frontend use
                const idStr = obj._id.toString();
                return {
                    ...obj,
                    id: idStr,
                    _id: idStr,
                    employee_name: obj.employeeName || obj.fullName || 'Unknown'
                };
            })
        });
    } catch (e: any) {
        console.error("[GET /employees] Error:", e);
        res.json({ ok: true, rows: [], error: "Failed to fetch employees" });
    }
});

// GET /business-transactions
router.get("/business-transactions", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { from, to, party_name, transaction_type, limit, offset, sort_by, sort_order } = req.query;

        const filter: any = { tenantId };

        if (from || to) {
            filter.transactionDate = {};
            if (from) filter.transactionDate.$gte = from;
            if (to) filter.transactionDate.$lte = to;
        }

        if (party_name && typeof party_name === 'string') {
            filter.partyName = { $regex: party_name, $options: 'i' };
        }

        if (transaction_type === 'Credit' || transaction_type === 'Debit') {
            filter.transactionType = transaction_type;
        }

        const limitNum = limit && !isNaN(Number(limit)) ? Number(limit) : 100;
        const offsetNum = offset && !isNaN(Number(offset)) ? Number(offset) : 0;

        const sort: any = {};
        if (sort_by === 'amount') {
            sort.amount = sort_order === 'asc' ? 1 : -1;
        } else {
            sort.transactionDate = sort_order === 'asc' ? 1 : -1;
        }

        const transactions = await BusinessTransaction.find(filter)
            .sort(sort)
            .skip(offsetNum)
            .limit(limitNum);

        const totalCount = await BusinessTransaction.countDocuments(filter);

        res.json({
            ok: true,
            rows: transactions.map(t => ({ ...t.toObject(), id: t._id })),
            pagination: {
                total: totalCount,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + transactions.length < totalCount
            }
        });
    } catch (e: any) {
        console.error("[GET /business-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /business-transactions
router.post("/business-transactions", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;
        const authReq = req as AuthRequest;

        const { transaction_date, transaction_type, party_name, amount, description, effected_party, source, entered_by } = req.body;

        const errors: string[] = [];
        if (!transaction_date) errors.push("Transaction date is required");
        if (!transaction_type) errors.push("Transaction type is required");
        if (!party_name || !party_name.trim()) errors.push("Party name is required");
        if (!amount && amount !== 0) errors.push("Amount is required");

        if (errors.length > 0) {
            return res.status(400).json({ ok: false, error: errors.join("; "), errors });
        }

        const payload = {
            tenantId,
            transactionDate: transaction_date,
            transactionType: transaction_type,
            partyName: party_name.trim(),
            effectedParty: effected_party?.trim() || null,
            source: source?.trim() || null,
            amount: Number(amount),
            description: description?.trim() || '',
            enteredBy: entered_by?.trim() || null,
            createdBy: authReq.user?.userId
        };

        const newTransaction = await BusinessTransaction.create(payload);

        res.status(201).json({
            ok: true,
            message: "Transaction saved successfully",
            data: { ...newTransaction.toObject(), id: newTransaction._id }
        });

    } catch (e: any) {
        console.error("[POST /business-transactions] Error:", e);
        res.status(500).json({ ok: false, error: "Failed to save transaction: " + e.message });
    }
});

// PUT /business-transactions/:id
router.put("/business-transactions/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        const body = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ ok: false, error: "Invalid transaction ID" });
        }

        // Only allow update if tenantId matches
        const existing = await BusinessTransaction.findOne({ _id: id, tenantId });
        if (!existing) return res.status(404).json({ ok: false, error: "Transaction not found" });

        const payload: any = {
            transactionDate: body.transaction_date,
            transactionType: body.transaction_type,
            partyName: body.party_name,
            amount: body.amount !== undefined ? Number(body.amount) : undefined,
            description: body.description,
            effectedParty: body.effected_party,
            source: body.source,
            enteredBy: body.entered_by
        };

        // Remove undefined
        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        const updated = await BusinessTransaction.findByIdAndUpdate(id, payload, { new: true });

        res.json({
            ok: true,
            message: "Transaction updated successfully",
            data: { ...updated.toObject(), id: updated._id }
        });

    } catch (e: any) {
        console.error("[PUT /business-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// DELETE /business-transactions/:id
router.delete("/business-transactions/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ ok: false, error: "Invalid ID" });

        const deleted = await BusinessTransaction.findOneAndDelete({ _id: id, tenantId });
        if (!deleted) return res.status(404).json({ ok: false, error: "Transaction not found" });

        res.json({ ok: true, message: "Transaction deleted successfully" });
    } catch (e: any) {
        console.error("[DELETE /business-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});


// ==========================================
// VENDOR TRANSACTIONS MODULE
// ==========================================

// GET /vendor-transactions
router.get("/vendor-transactions", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { from, to, vendor_id, transaction_type, limit, offset, sort_by, sort_order } = req.query;

        const filter: any = { tenantId };

        if (from || to) {
            filter.transactionDate = {};
            if (from) filter.transactionDate.$gte = from;
            if (to) filter.transactionDate.$lte = to;
        }

        if (vendor_id && typeof vendor_id === 'string' && vendor_id !== 'ALL') {
            if (mongoose.Types.ObjectId.isValid(vendor_id)) {
                filter.vendorId = vendor_id;
            }
        }

        if (transaction_type === 'Credit' || transaction_type === 'Debit') {
            filter.transactionType = transaction_type;
        }

        const limitNum = limit && !isNaN(Number(limit)) ? Number(limit) : 100;
        const offsetNum = offset && !isNaN(Number(offset)) ? Number(offset) : 0;

        const sort: any = {};
        if (sort_by === 'amount') {
            sort.amount = sort_order === 'asc' ? 1 : -1;
        } else {
            sort.transactionDate = sort_order === 'asc' ? 1 : -1;
        }

        const transactions = await VendorTransaction.find(filter)
            .sort(sort)
            .skip(offsetNum)
            .limit(limitNum)
            .populate('vendorId', 'vendorName');

        const totalCount = await VendorTransaction.countDocuments(filter);

        // Resolve Vendors and Employees for each transaction
        const rows = await Promise.all(transactions.map(async (t) => {
            const row: any = {
                id: t._id.toString(),
                transactionDate: t.transactionDate,
                vendorId: (t.vendorId?._id || t.vendorId)?.toString(),
                transactionType: t.transactionType,
                amount: t.amount,
                paymentMode: t.paymentMode,
                description: t.description,
                createdAt: t.createdAt,
                createdBy: t.createdBy,
                // Check both camelCase and snake_case for legacy data
                employeeId: (t.employeeId || (t as any).employee_id)?.toString(),
            };

            // 1. Multi-stage Vendor resolution
            let resolvedVendor = null;
            if (row.vendorId) {
                resolvedVendor = await Vendor.findById(row.vendorId);
                if (!resolvedVendor) {
                    resolvedVendor = await Vendor.findOne({ _id: row.vendorId, tenantId });
                }
            }
            row.vendors = {
                vendor_name: resolvedVendor?.vendorName || resolvedVendor?.vendor_name || 'Unknown Vendor'
            };

            // 2. Employee and CreatedBy resolution (Cross-tenant)
            const resolveEmpName = async (id: any) => {
                if (!id) return null;
                try {
                    // Use findOne by _id without tenant filter (cross-tenant)
                    const emp = await Employee.findOne({ _id: id });
                    if (emp) {
                        return emp.fullName || emp.employeeName || null;
                    }
                } catch (err) {
                    // Fallback to searching by string name if it wasn't a valid ObjectId
                    if (typeof id === 'string' && id.length > 5 && id !== 'undefined' && id !== 'null') {
                        const empStr = await Employee.findOne({
                            $or: [{ fullName: id }, { employeeName: id }]
                        });
                        return empStr?.employeeName || empStr?.fullName || id;
                    }
                }
                return null;
            };

            const empName = await resolveEmpName(row.employeeId);
            const creatorName = await resolveEmpName(row.createdBy);

            row.employees = {
                employee_name: empName || creatorName || null
            };

            return row;
        }));

        res.json({
            ok: true,
            rows: rows,
            pagination: {
                total: totalCount,
                limit: limitNum,
                offset: offsetNum,
                hasMore: offsetNum + transactions.length < totalCount
            }
        });

    } catch (e: any) {
        console.error("[GET /vendor-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// POST /vendor-transactions
router.post("/vendor-transactions", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;
        const authReq = req as AuthRequest;

        const { transaction_date, vendor_id, transaction_type, amount, payment_mode, description, employee_id } = req.body;

        const errors: string[] = [];
        if (!transaction_date) errors.push("Transaction date is required");
        if (!vendor_id) errors.push("Vendor is required");
        if (!transaction_type) errors.push("Transaction type is required");
        if (!amount && amount !== 0) errors.push("Amount is required");

        if (errors.length > 0) return res.status(400).json({ ok: false, error: errors.join("; "), errors });

        const payload = {
            tenantId,
            transactionDate: transaction_date,
            vendorId: vendor_id,
            transactionType: transaction_type,
            amount: Number(amount),
            paymentMode: payment_mode || 'Cash',
            description: description?.trim() || '',
            employeeId: employee_id || null,
            createdBy: authReq.user?.userId
        };

        const newTransaction = await VendorTransaction.create(payload);

        res.status(201).json({
            ok: true,
            message: "Transaction saved successfully",
            data: { ...newTransaction.toObject(), id: newTransaction._id }
        });

    } catch (e: any) {
        console.error("[POST /vendor-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// PUT /vendor-transactions/:id
router.put("/vendor-transactions/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        const body = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ ok: false, error: "Invalid ID" });

        const existing = await VendorTransaction.findOne({ _id: id, tenantId });
        if (!existing) return res.status(404).json({ ok: false, error: "Transaction not found" });

        const payload: any = {
            transactionDate: body.transaction_date,
            vendorId: body.vendor_id,
            transactionType: body.transaction_type,
            amount: body.amount !== undefined ? Number(body.amount) : undefined,
            paymentMode: body.payment_mode,
            description: body.description
        };

        Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

        const updated = await VendorTransaction.findByIdAndUpdate(id, payload, { new: true });

        res.json({
            ok: true,
            message: "Transaction updated successfully",
            data: { ...updated.toObject(), id: updated._id }
        });

    } catch (e: any) {
        console.error("[PUT /vendor-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});

// DELETE /vendor-transactions/:id
router.delete("/vendor-transactions/:id", async (req, res) => {
    try {
        const tenantId = ensureTenant(req, res);
        if (!tenantId) return;

        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ ok: false, error: "Invalid ID" });

        const deleted = await VendorTransaction.findOneAndDelete({ _id: id, tenantId });
        if (!deleted) return res.status(404).json({ ok: false, error: "Transaction not found" });

        res.json({ ok: true, message: "Transaction deleted successfully" });
    } catch (e: any) {
        console.error("[DELETE /vendor-transactions] Error:", e);
        res.status(500).json({ ok: false, error: e.message });
    }
});
