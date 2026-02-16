import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://admin:Lct3JI9W7Yuzb8X7@cluster0.sliiz.mongodb.net/dafaterAccounting";

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...', MONGODB_URI);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to', mongoose.connection.db.databaseName);

        const collection = mongoose.connection.db.collection('contacts');
        const indexes = await collection.indexes();
        console.log('Current Indexes:', JSON.stringify(indexes, null, 2));

        // Identify indexes to drop
        const indexesToDrop = indexes.filter(idx => {
            const key = idx.key;
            return key.taxNumber || key.commercialRegister || (key.code && key.companyId);
        });

        if (indexesToDrop.length === 0) {
            console.log('No relevant indexes found to drop.');
        } else {
            for (const idx of indexesToDrop) {
                console.log(`Dropping index: ${idx.name}`);
                await collection.dropIndex(idx.name);
            }
            console.log('Dropped legacy indexes.');
        }

        console.log('Indexes dropped. Mongoose should recreate them with sparse: true on next app startup.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

fixIndexes();
