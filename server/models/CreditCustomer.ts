import mongoose from 'mongoose';

const creditCustomerSchema = new mongoose.Schema({
    tenantId: { type: String, index: true }, // Keep for future use if added
    organization_name: { type: String, required: true },
    tin_gst_no: { type: String },
    representative_name: { type: String },
    organization_address: { type: String },
    phone_number: { type: String },
    mobile_number: { type: String },
    email: { type: String },
    credit_limit: { type: Number, default: 0 },
    opening_balance: { type: Number, default: 0 },
    current_balance: { type: Number, default: 0 },
    vehicle_no: { type: String },
    is_active: { type: Boolean, default: true },
    registered_date: { type: String },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
}, {
    collection: 'credit_customers',
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Force new model construction to pick up schema/collection changes
if (mongoose.models.CreditCustomer) {
    delete (mongoose.models as any).CreditCustomer;
}

export const CreditCustomer = mongoose.model('CreditCustomer', creditCustomerSchema);
