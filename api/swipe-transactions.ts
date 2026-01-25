import { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToMongo } from "./_mongo.js";
import { SwipeTransaction, Employee } from "../server/models.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    await connectToMongo();

    if (req.method === 'GET') {
        try {
            const { from, to, mode } = req.query;
            let query: any = {};
            if (from && to) {
                query.transactionDate = {
                    $gte: new Date(String(from)),
                    $lte: new Date(String(to))
                };
            }
            if (mode && mode !== 'all') {
                query.swipeMode = mode;
            }

            const results = await SwipeTransaction.find(query).sort({ transactionDate: -1 });

            // Enrich with employee names if possible, but keep it simple for Vercel
            // Assuming frontend handles name mapping or we fetch it here.
            // Let's do a quick enrichment if needed, but 'find' is fast. 
            // Better to return the data and let frontend map or we map here.

            // To make it fully self-contained similar to the previous PG query:
            const employees = await Employee.find({}, 'employeeName _id');
            const empMap = new Map(employees.map(e => [String(e._id), e.employeeName]));

            const mapped = results.map(r => ({
                id: r._id,
                transaction_date: r.transactionDate,
                employee_id: r.employeeId,
                employee_name: empMap.get(r.employeeId) || 'Unknown',
                swipe_type: r.swipeType,
                swipe_mode: r.swipeMode,
                amount: r.amount,
                batch_number: r.batchNumber,
                shift: r.shift,
                note: r.note,
                image_url: r.imageUrl,
                created_at: r.createdAt
            }));

            res.json({ success: true, rows: mapped, ok: true });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    } else if (req.method === 'POST') {
        try {
            const body = req.body;
            // Basic validation
            if (!body.employee_id || !body.amount) {
                return res.status(400).json({ success: false, error: "Missing required fields" });
            }

            const newTransaction = new SwipeTransaction({
                employeeId: body.employee_id,
                swipeType: body.swipe_type,
                swipeMode: body.swipe_mode,
                batchNumber: body.batch_number,
                amount: body.amount,
                transactionDate: body.transaction_date || new Date(),
                shift: body.shift,
                note: body.note,
                imageUrl: body.image_url
            });

            const saved = await newTransaction.save();
            res.json({ success: true, data: { ...saved.toObject(), id: saved._id }, ok: true });
        } catch (error: any) {
            res.status(400).json({ success: false, error: error.message });
        }
    } else {
        res.status(405).json({ error: 'Method Not Allowed' });
    }
}

