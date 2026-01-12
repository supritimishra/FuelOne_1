import mongoose from 'mongoose';

// Used for blacklisting tokens (logout)
const invalidatedTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    userEmail: { type: String, required: true },
    reason: { type: String, default: 'logout' },
    expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
}, { timestamps: true });

export const InvalidatedToken = mongoose.models.InvalidatedToken || mongoose.model('InvalidatedToken', invalidatedTokenSchema);
