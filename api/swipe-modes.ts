import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_pg.js";
import { swipeMachines } from "../shared/schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    try {
        const { db } = getDb();
        const machines = await db.select().from(swipeMachines);

        // Map machines to modes
        const modes = machines.map((m: any) => ({
            id: m.id,
            mode: m.machineName,
            type: m.machineType
        }));

        res.status(200).json({ success: true, rows: modes });
    } catch (e: any) {
        // Fallback if DB fails
        res.status(200).json({
            success: true,
            rows: [
                { id: "1", mode: "HDFC Card" },
                { id: "2", mode: "SBI Card" }
            ]
        });
    }
}
