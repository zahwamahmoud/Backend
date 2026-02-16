import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";

async function verifyFix() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to', mongoose.connection.db.databaseName);

        const collection = mongoose.connection.db.collection('contacts');
        const companyId = new mongoose.Types.ObjectId("60d5ecb8b487343568912345");

        // Cleanup previous test data
        await collection.deleteMany({ companyId: companyId });
        console.log('Cleaned up test data.');

        // Test 1: Insert first individual contact (missing tax/code)
        const contact1 = {
            name: "Test Contact 1",
            type: "individual",
            companyId: companyId
        };
        await collection.insertOne(contact1);
        console.log('Insert 1 SUCCESS (Missing fields)');

        // Test 2: Insert second individual contact (missing tax/code) - SHOULD SUCCEED NOW
        const contact2 = {
            name: "Test Contact 2",
            type: "individual",
            companyId: companyId
        };
        try {
            await collection.insertOne(contact2);
            console.log('Insert 2 SUCCESS (Missing fields dup) - [FIX VERIFIED]');
        } catch (err) {
            console.error('Insert 2 FAILED:', err.code, err.message);
        }

        // Test 3: Insert commercial contact with tax number
        const contact3 = {
            name: "Test Commercial 1",
            type: "commercial",
            companyId: companyId,
            taxNumber: "123456"
        };
        await collection.insertOne(contact3);
        console.log('Insert 3 SUCCESS (Commercial with tax)');

        // Test 4: Insert commercial contact with SAME tax number - SHOULD FAIL
        const contact4 = {
            name: "Test Commercial 2",
            type: "commercial",
            companyId: companyId,
            taxNumber: "123456"
        };
        try {
            await collection.insertOne(contact4);
            console.log('Insert 4 SUCCESS (Duplicate Tax) - [BAD]');
        } catch (err) {
            console.log('Insert 4 FAILED (Duplicate Tax) - [EXPECTED]:', err.code);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

verifyFix();
