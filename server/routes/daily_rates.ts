
import { Router, Request, Response } from "express";
import { db } from "../db.js";
import {
    dailySaleRates, insertDailySaleRateSchema, fuelProducts, users
} from "../../shared/schema.js";
import { DailySaleRate, FuelProduct } from "../models";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const dailyRatesRouter = Router();

// ==========================================
// Daily Sale Rates (Postgres)
// ==========================================
// ==========================================
// Daily Sale Rates (Hybrid: Mongo Fallback)
// ==========================================
dailyRatesRouter.get("/daily-sale-rates", async (req: Request, res: Response) => {
    try {
        const { date, from, to } = req.query;

        // MongoDB Path
        if (!process.env.DATABASE_URL) {
            let conditions: any = {};
            if (date) conditions.date = String(date);
            else if (from && to) {
                conditions.date = {
                    $gte: String(from),
                    $lte: String(to)
                };
            }

            const results = await DailySaleRate.find(conditions).sort({ date: -1 });

            // Fetch Fuel Products to map names
            const productIds = Array.from(new Set(results.map(r => r.fuelProduct).filter(Boolean)));
            const products = await FuelProduct.find({ _id: { $in: productIds } });
            const productMap = products.reduce((acc, p) => ({ ...acc, [String(p._id)]: p.productName }), {} as Record<string, string>);

            const mapped = results.map(r => ({
                id: r._id,
                rate_date: r.date,
                open_rate: r.openRate,
                close_rate: r.closeRate,
                variation_amount: r.variationAmount,
                fuel_product_id: r.fuelProduct,
                product_name: productMap[r.fuelProduct] || 'Unknown',
                created_at: r.createdAt
            }));

            return res.json({ success: true, ok: true, rows: mapped });
        }

        // Postgres Path
        let conditions = undefined;
        if (date) {
            conditions = eq(dailySaleRates.rateDate, String(date));
        } else if (from && to) {
            conditions = and(
                gte(dailySaleRates.rateDate, String(from)),
                lte(dailySaleRates.rateDate, String(to))
            );
        }

        const query = db.select({
            id: dailySaleRates.id,
            rate_date: dailySaleRates.rateDate,
            open_rate: dailySaleRates.openRate,
            close_rate: dailySaleRates.closeRate,
            variation_amount: dailySaleRates.variationAmount,
            fuel_product_id: dailySaleRates.fuelProductId,
            product_name: fuelProducts.productName,
            created_at: dailySaleRates.createdAt,
            created_by_name: users.fullName
        })
            .from(dailySaleRates)
            .leftJoin(fuelProducts, eq(dailySaleRates.fuelProductId, fuelProducts.id))
            .leftJoin(users, eq(dailySaleRates.createdBy, users.id))
            .orderBy(desc(dailySaleRates.rateDate), desc(dailySaleRates.createdAt));

        // @ts-ignore
        if (conditions) {
            // @ts-ignore
            query.where(conditions);
        }

        const results = await query;
        res.json({ success: true, ok: true, rows: results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

dailyRatesRouter.post("/daily-sale-rates", async (req: Request, res: Response) => {
    try {
        const body = req.body;
        const rates = Array.isArray(body) ? body : [body];

        // MongoDB Path
        if (!process.env.DATABASE_URL) {
            const results = [];
            for (const rate of rates) {
                // Manually extract and validate lightly, bypassing strict UUID check
                const rateDate = rate.rateDate ? String(rate.rateDate).slice(0, 10) : new Date().toISOString().slice(0, 10);

                // Check existing
                const existing = await DailySaleRate.findOne({
                    date: rateDate,
                    fuelProduct: rate.fuelProductId
                });

                if (existing) {
                    existing.openRate = rate.openRate;
                    existing.closeRate = rate.closeRate;
                    existing.variationAmount = rate.variationAmount;
                    existing.createdBy = (req as any).user?.id;
                    const saved = await existing.save();
                    results.push({ ...saved.toObject(), id: saved._id });
                } else {
                    const newRate = new DailySaleRate({
                        date: rateDate,
                        fuelProduct: rate.fuelProductId,
                        openRate: rate.openRate,
                        closeRate: rate.closeRate,
                        variationAmount: rate.variationAmount,
                        createdBy: (req as any).user?.id
                    });
                    const saved = await newRate.save();
                    results.push({ ...saved.toObject(), id: saved._id });
                }
            }
            return res.json({ success: true, ok: true, data: results });
        }

        // Postgres Path
        const results = [];
        for (const rate of rates) {
            const data = insertDailySaleRateSchema.parse(rate);
            // Check if exists for this date and product, update if so
            const rateDate = data.rateDate || new Date().toISOString().slice(0, 10);
            const existing = await db.select().from(dailySaleRates).where(and(
                eq(dailySaleRates.rateDate, rateDate),
                eq(dailySaleRates.fuelProductId, data.fuelProductId)
            ));

            if (existing.length > 0) {
                const updated = await db.update(dailySaleRates)
                    .set({ ...data, createdBy: (req as any).user?.id })
                    .where(eq(dailySaleRates.id, existing[0].id))
                    .returning();
                results.push(updated[0]);
            } else {
                const saved = await db.insert(dailySaleRates).values({
                    ...data,
                    createdBy: (req as any).user?.id
                }).returning();
                results.push(saved[0]);
            }
        }

        res.json({ success: true, ok: true, data: results });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
});

dailyRatesRouter.delete("/daily-sale-rates/:id", async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        if (!process.env.DATABASE_URL) {
            const deleted = await DailySaleRate.findByIdAndDelete(id);
            if (!deleted) return res.status(404).json({ success: false, error: "Rate not found" });
            return res.json({ success: true, ok: true });
        }

        const deleted = await db.delete(dailySaleRates)
            .where(eq(dailySaleRates.id, id))
            .returning();

        if (!deleted.length) return res.status(404).json({ success: false, error: "Rate not found" });

        res.json({ success: true, ok: true });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
});

