import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
    vendorName: { type: String, required: true },
    tenantId: { type: String, required: true, index: true },
    vendorType: { type: String }, // Liquid, Lubricant, etc.
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Vendor = mongoose.models.Vendor || mongoose.model('Vendor', vendorSchema);

const vendorTransactionSchema = new mongoose.Schema({
    transactionDate: { type: String, required: true }, // YYYY-MM-DD
    tenantId: { type: String, required: true, index: true },
    vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    transactionType: { type: String, enum: ['Credit', 'Debit'], required: true },
    amount: { type: Number, required: true },
    paymentMode: { type: String, enum: ['Cash', 'Bank', 'UPI'], default: 'Cash' },
    description: { type: String },
    employeeId: { type: String }, // Optional link to employee

    createdBy: { type: String },
}, { timestamps: true });

export const VendorTransaction = mongoose.models.VendorTransaction || mongoose.model('VendorTransaction', vendorTransactionSchema);
