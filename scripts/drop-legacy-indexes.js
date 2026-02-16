import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../src/modules/contacts/contacts.model.js';

dotenv.config();

const MONGODB_URI = process.env.DB_CONNECTION || 'mongodb://localhost:27017/invoice-db';

async function dropLegacyIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        console.log('Dropping legacy indexes...');

        // Drop taxNumber_1
        try {
            await Contact.collection.dropIndex('taxNumber_1');
            console.log('✅ Dropped index: taxNumber_1');
        } catch (e) {
            console.log('⚠️ Could not drop taxNumber_1 (might not exist):', e.message);
        }

        // Drop commercialRegister_1
        try {
            await Contact.collection.dropIndex('commercialRegister_1');
            console.log('✅ Dropped index: commercialRegister_1');
        } catch (e) {
            console.log('⚠️ Could not drop commercialRegister_1 (might not exist):', e.message);
        }

        // Drop code_1
        try {
            await Contact.collection.dropIndex('code_1');
            console.log('✅ Dropped index: code_1');
        } catch (e) {
            console.log('⚠️ Could not drop code_1 (might not exist):', e.message);
        }

        console.log('Legacy index cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

dropLegacyIndexes();
