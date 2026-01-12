import mongoose from 'mongoose';

export async function connectToMongo() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error("MONGODB_URI not found in environment variables.");
        }

        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(uri);
        console.log("✅ MongoDB Connected Successfully");
        console.log(`📁 Database: ${mongoose.connection.name}`);

        mongoose.connection.on('error', (err) => {
            console.error("❌ MongoDB connection error:", err);
        });

        mongoose.connection.on('disconnected', () => {
            console.warn("⚠️ MongoDB disconnected");
        });

    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        throw error; // Rethrow to let the caller handle fatal failure
    }
}
