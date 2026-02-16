import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../src/modules/contacts/contacts.model.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
const MONGODB_URI = process.env.DB_CONNECTION || 'mongodb://localhost:27017/invoice-db';
console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@'));

async function cleanupNullFields() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Unset taxNumber where it is null
        const result1 = await Contact.updateMany(
            { taxNumber: null },
            { $unset: { taxNumber: "" } }
        );
        console.log(`Unset taxNumber for ${result1.modifiedCount} documents (was null)`);

        // Unset commercialRegister where it is null
        const result2 = await Contact.updateMany(
            { commercialRegister: null },
            { $unset: { commercialRegister: "" } }
        );
        console.log(`Unset commercialRegister for ${result2.modifiedCount} documents (was null)`);

        console.log('✅ Successfully cleaned up null fields!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning up fields:', error);
        process.exit(1);
    }
}

cleanupNullFields();
