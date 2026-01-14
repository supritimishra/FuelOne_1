import { Router } from "express";
import { relationalRouter } from "./routes/relational.js";
import { dailyRatesRouter } from "./routes/daily_rates.js";
import { saleEntriesRouter } from "./routes/sale_entries.js";

export const router = Router();

// Mount relational features routes
router.use("/", relationalRouter);
router.use("/", dailyRatesRouter);
router.use("/", saleEntriesRouter);