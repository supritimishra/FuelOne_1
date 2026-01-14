import mongoose from 'mongoose';

export async function connectToMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.warn("⚠️ MONGODB_URI not found in environment variables. MongoDB features will not work.");
        return;
    }

    try {
        mongoose.set('debug', true);
        await mongoose.connect(uri);
        console.log("✅ Connected to MongoDB");
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
    }
}
