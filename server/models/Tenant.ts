import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
    organizationName: { type: String, required: true },
    superAdminEmail: { type: String, required: true, unique: true },
    superAdminUserId: { type: String }, // Reference to User.id
    status: { type: String, default: 'active', enum: ['active', 'suspended', 'deleted'] },
    tenantDbName: { type: String }, // Kept for legacy compatibility if needed
    connectionString: { type: String }, // Deprecated, but might be needed for code traversing
}, { timestamps: true });

export const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', tenantSchema);
