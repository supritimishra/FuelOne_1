const mongoose = require('mongoose');

// Default URI from checking other files or standard local URI
const MONGODB_URI = "mongodb://localhost:27017/FuelOne"; 

async function inspect() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB:", MONGODB_URI);

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("Collections:", collections.map(c => c.name));

        if (collections.find(c => c.name === 'employees')) {
            const employees = await mongoose.connection.db.collection('employees').find({}).toArray();
            console.log("\n--- Employees Collection Dump ---");
            console.log(JSON.stringify(employees, null, 2));
            console.log(`Total Count: ${employees.length}`);
        } else {
            console.log("Collection 'employees' NOT found!");
        }

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}

inspect();
