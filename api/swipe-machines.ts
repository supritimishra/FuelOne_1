import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "./_pg.js";
import { swipeMachines, vendors } from "../shared/schema.js";
import { desc, eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { db } = getDb();

    if (req.method === 'GET') {
        try {
            const results = await db.select({
                id: swipeMachines.id,
                machine_name: swipeMachines.machineName,
                machine_type: swipeMachines.machineType,
                provider: swipeMachines.provider,
                machine_id: swipeMachines.machineId,
                status: swipeMachines.status,
                attach_type: swipeMachines.attachType,
                bank_type: swipeMachines.bankType,
                vendor_id: swipeMachines.vendorId,
                created_at: swipeMachines.createdAt,
                vendor_name: vendors.vendorName
            })
                .from(swipeMachines)
                .leftJoin(vendors, eq(swipeMachines.vendorId, vendors.id))
                .orderBy(desc(swipeMachines.createdAt));

            res.json({ success: true, rows: results, ok: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const body = req.body;
            const payload = {
                machineName: body.machine_name,
                machineType: body.machine_type,
                provider: body.provider,
                machineId: body.machine_id,
                status: body.status,
                attachType: body.attach_type,
                bankType: body.bank_type,
                vendorId: body.vendor_id
            };
            const saved = await db.insert(swipeMachines).values(payload).returning();
            res.json({ success: true, data: saved[0], ok: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
