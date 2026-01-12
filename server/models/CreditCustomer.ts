import mongoose from 'mongoose';

const creditCustomerSchema = new mongoose.Schema({
    tenantId: { type: String, required: true, index: true },
    organizationName: { type: String, required: true }, // Customer Name
    phoneNumber: { type: String },
    mobileNumber: { type: String },
    email: { type: String },
    address: { type: String },
    creditLimit: { type: Number, default: 0 },
    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },
    vehicleNumber: { type: String }, // Some customers are associated with vehicles
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const CreditCustomer = mongoose.models.CreditCustomer || mongoose.model('CreditCustomer', creditCustomerSchema);
