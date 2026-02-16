import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";

async function reproduce() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to', mongoose.connection.db.databaseName);

        // Better to use collection directly to skip Mongoose validation first to see raw DB behavior, 
        // OR define schema to test Mongoose behavior.

        // Let's rely on collection to test INDICES.
        const collection = mongoose.connection.db.collection('contacts');

        const testContact = {
            name: "Reproduction Test " + Date.now(),
            type: "individual",
            // code: "AUTO-" + Date.now(), // Unique code
            companyId: new mongoose.Types.ObjectId("60d5ecb8b487343568912345"), // Dummy ID
            // taxNumber is MISSING
            // commercialRegister is MISSING
        };

        console.log('Attempting insert of individual contact (missing taxNumber)...');
        try {
            await collection.insertOne(testContact);
            console.log('Insert SUCCESS.');
        } catch (err) {
            console.error('Insert FAILED:', err.code, err.message);
        }

        // Test 2: explicit null
        const testContactNull = {
            name: "Reproduction Test Null " + Date.now(),
            type: "individual",
            companyId: new mongoose.Types.ObjectId("60d5ecb8b487343568912345"),
            taxNumber: null
        };
        console.log('Attempting insert of individual contact (taxNumber: null)...');
        try {
            await collection.insertOne(testContactNull);
            console.log('Insert SUCCESS (null).');
        } catch (err) {
            console.error('Insert FAILED (null):', err.code, err.message);
        }

        // Test 3: explicit null AGAIN (should fail if unique index works on null)
        const testContactNull2 = {
            name: "Reproduction Test Null 2 " + Date.now(),
            type: "individual",
            companyId: new mongoose.Types.ObjectId("60d5ecb8b487343568912345"),
            taxNumber: null
        };
        console.log('Attempting insert of individual contact (taxNumber: null duplicate)...');
        try {
            await collection.insertOne(testContactNull2);
            console.log('Insert SUCCESS (null duplicate) - THIS IS BAD if we want uniqueness per company. But for sparse index, only one null is allowed per unique key scope.');
        } catch (err) {
            console.error('Insert FAILED (null duplicate) - EXPECTED:', err.code, err.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

reproduce();
