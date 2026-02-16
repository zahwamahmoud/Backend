import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";

async function fixIndexesPartial() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to', mongoose.connection.db.databaseName);

        const collection = mongoose.connection.db.collection('contacts');
        const indexes = await collection.indexes();

        console.log('Identifying problematic indexes...');
        // 1. Drop existing problematic indexes
        const problemIndexes = indexes.filter(idx => {
            // Identify indexes on taxNumber, commercialRegister, code that involve companyId
            // We want to replace specific ones.
            const k = idx.key;
            if (!k) return false;
            // Check for compound key with companyId in it
            const hasTax = k.taxNumber && k.companyId;
            const hasCR = k.commercialRegister && k.companyId;
            const hasCode = k.code && k.companyId;

            return hasTax || hasCR || hasCode;
        });

        if (problemIndexes.length === 0) {
            console.log('No problematic indexes found. Maybe already partial?');
        } else {
            for (const idx of problemIndexes) {
                console.log(`Dropping index: ${idx.name}`);
                await collection.dropIndex(idx.name);
            }
        }

        // 2. Create new Partial Indexes
        console.log('Creating new Partial Indexes...');

        await collection.createIndex(
            { code: 1, companyId: 1 },
            {
                unique: true,
                partialFilterExpression: { code: { $exists: true } },
                name: "code_1_companyId_1_partial"
            }
        );
        console.log('Created partial index for code.');

        await collection.createIndex(
            { taxNumber: 1, companyId: 1 },
            {
                unique: true,
                partialFilterExpression: { taxNumber: { $exists: true } },
                name: "taxNumber_1_companyId_1_partial"
            }
        );
        console.log('Created partial index for taxNumber.');

        await collection.createIndex(
            { commercialRegister: 1, companyId: 1 },
            {
                unique: true,
                partialFilterExpression: { commercialRegister: { $exists: true } },
                name: "commercialRegister_1_companyId_1_partial"
            }
        );
        console.log('Created partial index for commercialRegister.');

        console.log('Partial Index setup complete.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

fixIndexesPartial();
