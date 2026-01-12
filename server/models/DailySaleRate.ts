import mongoose from 'mongoose';

const dailySaleRateSchema = new mongoose.Schema({
    date: { type: String, required: true }, // YYYY-MM-DD
    tenantId: { type: String, required: true, index: true },
    shift: { type: String, enum: ['S-1', 'S-2'], default: 'S-1' },
    fuelProduct: { type: String, required: true }, // e.g., 'HSD', 'MS', 'XP' (Sticking to simple string names for now if easy) or ObjectId
    // Ideally ObjectId referencing FuelProduct, but let's see. The user requirement says "Ensure fuel products are exactly HSD, MS, and XP."
    // I will store the shortName here for simplicity/stability as per "Shift Sheet Entry" requirements.

    openRate: { type: Number, required: true },
    closeRate: { type: Number, required: true },

    createdBy: { type: String }, // User ID or Name
}, { timestamps: true });

// Compound index to prevent duplicates with tenant isolation
dailySaleRateSchema.index({ tenantId: 1, date: 1, shift: 1, fuelProduct: 1 }, { unique: true });

export const DailySaleRate = mongoose.models.DailySaleRate || mongoose.model('DailySaleRate', dailySaleRateSchema);
