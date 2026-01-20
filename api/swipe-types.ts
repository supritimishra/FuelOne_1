import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Return static swipe types as fallback/fix for timeout
    res.status(200).json({
        success: true,
        rows: [
            { id: "1", type: "Card" },
            { id: "2", type: "UPI" },
            { id: "3", type: "QR" }
        ]
    });
}
