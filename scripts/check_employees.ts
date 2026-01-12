
import mongoose from 'mongoose';
import { Employee } from '../server/models.js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function checkEmployees() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not set in .local.env");
        }

        console.log(`Connecting to MongoDB: ${mongoUri.split('@')[1]}`); // Mask credentials
        await mongoose.connect(mongoUri);
        console.log("Connected to MongoDB.");

        const employees = await Employee.find({});
        console.log(`Found ${employees.length} employees.`);

        if (employees.length > 0) {
            console.log("Sample employee:", JSON.stringify(employees[0], null, 2));
        } else {
            console.log("⚠️ No employees found! Seeding a test employee...");
            const newEmp = new Employee({
                _id: new mongoose.Types.ObjectId().toString(),
                joinDate: new Date(),
                employeeName: "Test Employee",
                designation: "Pump Attendant",
                salaryType: "Per Duty",
                salary: 15000,
                isActive: true
            });
            await newEmp.save();
            console.log("✅ Seeded Test Employee");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkEmployees();
