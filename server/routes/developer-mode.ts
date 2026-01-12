import { Router } from "express";

export const developerModeRouter = Router();

// Stub for Developer Mode - features temporarily unavailable during migration
developerModeRouter.use((req, res) => {
  res.status(501).json({
    ok: false,
    error: "Developer Mode is temporarily unavailable due to database migration."
  });
});
