import mongoose from 'mongoose';

const recoverySchema = new mongoose.Schema({
    tenantId: { type: String, required: true, index: true },
    creditCustomerId: { type: String, required: true }, // Linking to CreditCustomer._id
    customerName: { type: String }, // Snapshot of name
    recoveryDate: { type: String, required: true }, // YYYY-MM-DD
    shift: { type: String },
    employeeId: { type: String },
    employeeName: { type: String },
    receivedAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    pendingAmount: { type: Number },
    balanceAmount: { type: Number },
    paymentMode: { type: String },
    notes: { type: String },
    createdBy: { type: String }
}, { timestamps: true });

export const Recovery = mongoose.models.Recovery || mongoose.model('Recovery', recoverySchema);
