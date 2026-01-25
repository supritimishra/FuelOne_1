import { VercelRequest, VercelResponse } from "@vercel/node";
import { insertSheetRecordSchema } from "../shared/schema.js";
import { SheetRecord } from "../server/models.js";
import { connectToMongo } from "./_mongo.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await connectToMongo();

        const data = insertSheetRecordSchema.parse(req.body);

        if (Number(data.closeReading) < Number(data.openReading)) {
            if (Number(data.closeReading) !== 0) {
                return res.status(400).json({ success: false, error: "Closing reading cannot be less than opening reading unless meter reset." });
            }
        }

        const saleQty = Number(data.closeReading) - Number(data.openReading);

        const newRecord = new SheetRecord({
            ...data,
            // createdBy: req.user?.id 
        });
        const saved = await newRecord.save();

        res.json({ success: true, data: { ...saved.toObject(), id: saved._id }, computedSaleQty: saleQty });
    } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
    }
}
