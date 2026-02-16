import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../src/modules/contacts/contacts.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.DB_CONNECTION || 'mongodb://localhost:27017/invoice-db';
console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

async function fixContactIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Step 1: Update all documents with empty string taxNumber/commercialRegister to null
        const result1 = await Contact.updateMany(
            { taxNumber: '' },
            { $set: { taxNumber: null } }
        );
        console.log(`Updated ${result1.modifiedCount} documents with empty taxNumber to null`);

        const result2 = await Contact.updateMany(
            { commercialRegister: '' },
            { $set: { commercialRegister: null } }
        );
        console.log(`Updated ${result2.modifiedCount} documents with empty commercialRegister to null`);

        // Step 2: Drop existing indexes
        console.log('Dropping existing indexes...');
        await Contact.collection.dropIndex('taxNumber_1_companyId_1').catch(() => console.log('Index taxNumber_1_companyId_1 not found'));
        await Contact.collection.dropIndex('commercialRegister_1_companyId_1').catch(() => console.log('Index commercialRegister_1_companyId_1 not found'));
        await Contact.collection.dropIndex('code_1_companyId_1').catch(() => console.log('Index code_1_companyId_1 not found'));

        // Step 3: Recreate sparse unique indexes
        console.log('Creating sparse unique indexes...');
        await Contact.collection.createIndex(
            { taxNumber: 1, companyId: 1 },
            { unique: true, sparse: true }
        );
        console.log('Created sparse unique index on taxNumber + companyId');

        await Contact.collection.createIndex(
            { commercialRegister: 1, companyId: 1 },
            { unique: true, sparse: true }
        );
        console.log('Created sparse unique index on commercialRegister + companyId');

        await Contact.collection.createIndex(
            { code: 1, companyId: 1 },
            { unique: true, sparse: true }
        );
        console.log('Created sparse unique index on code + companyId');

        console.log('✅ Successfully fixed contact indexes!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing indexes:', error);
        process.exit(1);
    }
}

fixContactIndexes();
