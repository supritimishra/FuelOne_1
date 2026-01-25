import { Router } from "express";
import { relationalRouter } from "./routes/relational.js";
import { dailyRatesRouter } from "./routes/daily_rates.js";
import { saleEntriesRouter } from "./routes/sale_entries.js";
import { router as mongodbRouter } from "./routes-mongodb.js";

export const router = Router();

// 1. Restore Original MongoDB Modules (Priority)
router.use("/", mongodbRouter);

// 2. Preserve Teammate's Relational Work
router.use("/", relationalRouter);
router.use("/", dailyRatesRouter);
router.use("/", saleEntriesRouter);