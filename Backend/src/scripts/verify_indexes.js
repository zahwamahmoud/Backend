import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";

async function verifyState() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const collection = mongoose.connection.db.collection('contacts');

        console.log('--- Current Indexes ---');
        const indexes = await collection.indexes();
        indexes.forEach(idx => {
            console.log(`Name: ${idx.name}, Sparse: ${idx.sparse}, Unique: ${idx.unique}, Key: ${JSON.stringify(idx.key)}`);
        });

        console.log('--- Data Check ---');
        const nullTax = await collection.countDocuments({ taxNumber: null });
        const emptyTax = await collection.countDocuments({ taxNumber: "" });
        const existsTax = await collection.countDocuments({ taxNumber: { $exists: true } });
        const total = await collection.countDocuments({});

        console.log(`Total Contacts: ${total}`);
        console.log(`Contacts with taxNumber: null: ${nullTax}`);
        console.log(`Contacts with taxNumber: "": ${emptyTax}`);
        console.log(`Contacts with taxNumber field present: ${existsTax}`);

        console.log('--- Attempting Insert ---');
        try {
            await collection.insertOne({
                name: "Debug Test Individual " + Date.now(),
                type: "individual",
                companyId: new mongoose.Types.ObjectId(),
                // No taxNumber
            });
            console.log('Insert SUCCESS (No taxNumber)');
        } catch (e) {
            console.log('Insert FAILED (No taxNumber):', e.message);
        }

        try {
            await collection.insertOne({
                name: "Debug Test Individual Null " + Date.now(),
                type: "individual",
                companyId: new mongoose.Types.ObjectId(),
                taxNumber: null
            });
            console.log('Insert SUCCESS (taxNumber: null)');
        } catch (e) {
            console.log('Insert FAILED (taxNumber: null):', e.message);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

verifyState();
