import { VercelRequest, VercelResponse } from "@vercel/node";
import { getDb } from "../_pg.js";
import { swipeMachines } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    const { db } = getDb();
    const { id } = req.query;

    if (req.method === 'PUT') {
        try {
            const body = req.body;
            const payload: any = {};
            if (body.machine_name !== undefined) payload.machineName = body.machine_name;
            if (body.machine_type !== undefined) payload.machineType = body.machine_type;
            if (body.provider !== undefined) payload.provider = body.provider;
            if (body.machine_id !== undefined) payload.machineId = body.machine_id;
            if (body.status !== undefined) payload.status = body.status;
            if (body.attach_type !== undefined) payload.attachType = body.attach_type;
            if (body.bank_type !== undefined) payload.bankType = body.bank_type;
            if (body.vendor_id !== undefined) payload.vendorId = body.vendor_id;

            const updated = await db.update(swipeMachines)
                .set(payload)
                .where(eq(swipeMachines.id, id as string))
                .returning();
            res.json({ success: true, data: updated[0], ok: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else if (req.method === 'DELETE') {
        try {
            await db.delete(swipeMachines).where(eq(swipeMachines.id, id as string));
            res.json({ success: true, ok: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}
