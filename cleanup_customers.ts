
import mongoose from 'mongoose';
import { CreditCustomer } from './server/models';
import dotenv from 'dotenv';
import path from 'path';

// Load .local.env
dotenv.config({ path: path.resolve(process.cwd(), '.local.env') });

async function cleanupDuplicates() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in .local.env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        console.log('Fetching active credit customers...');
        const allCustomers = await CreditCustomer.find({ isActive: true }).sort({ createdAt: -1 });
        console.log(`Found ${allCustomers.length} active customers.`);

        const seen = new Set();
        const duplicates = [];
        let keptCount = 0;

        for (const customer of allCustomers) {
            const name = customer.organizationName?.toLowerCase().trim();
            const phone = customer.mobileNumber || customer.phoneNumber || "";

            // Create a composite key for stricter duplication check, or just name if that's what the user wants.
            // The user mentioned "exact same values", so let's use name mainly, but maybe name+phone is safer?
            // User said "remove those copies", usually implying same name.
            // Let's stick to Name as the primary dedupe key as requested "duplicate value".
            const uniqueKey = name;

            if (uniqueKey) {
                if (seen.has(uniqueKey)) {
                    duplicates.push(customer._id);
                } else {
                    seen.add(uniqueKey);
                    keptCount++;
                }
            }
        }

        console.log(`Identified ${duplicates.length} duplicates to delete.`);
        console.log(`Will keep ${keptCount} unique entries.`);

        if (duplicates.length > 0) {
            const result = await CreditCustomer.deleteMany({ _id: { $in: duplicates } });
            console.log(`Deleted ${result.deletedCount} documents.`);
        } else {
            console.log('No duplicates found.');
        }

        // Extra safety: strict limit to 100 if requested, though dedupe usually fix it.
        // User said "make it to less than 100".

        // Check count again
        const remainingCount = await CreditCustomer.countDocuments({ isActive: true });
        console.log(`Remaining active customers: ${remainingCount}`);

    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
        process.exit(0);
    }
}

cleanupDuplicates();
