import mongoose from 'mongoose';

const fuelProductSchema = new mongoose.Schema({
    productName: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    shortName: { type: String, required: true },
    salesType: { type: String, default: 'Fuel' }, // For identifying if it's Fuel or Lubricant
    price: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },

    // Additional fields for tax/levy
    wgtPercentage: { type: Number, default: 0 },
    tdsPercentage: { type: Number, default: 0 },
    gstPercentage: { type: Number, default: 0 },
    lfrn: { type: String, default: "0" },
}, { timestamps: true });

export const FuelProduct = mongoose.models.FuelProduct || mongoose.model('FuelProduct', fuelProductSchema);
