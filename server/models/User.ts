import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    fullName: { type: String },
    username: { type: String, unique: true, sparse: true },
    tenantId: { type: String, required: true, index: true }, // Linking user to a tenant
    role: { type: String, default: 'manager' }, // Default role
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
