import mongoose from 'mongoose';

const businessTransactionSchema = new mongoose.Schema({
    transactionDate: { type: String, required: true }, // YYYY-MM-DD
    tenantId: { type: String, required: true, index: true },
    transactionType: { type: String, enum: ['Credit', 'Debit'], required: true },
    partyName: { type: String, required: true },
    effectedParty: { type: String },
    source: { type: String },
    amount: { type: Number, required: true },
    description: { type: String },
    enteredBy: { type: String },

    createdBy: { type: String },
}, { timestamps: true });

export const BusinessTransaction = mongoose.models.BusinessTransaction || mongoose.model('BusinessTransaction', businessTransactionSchema);
