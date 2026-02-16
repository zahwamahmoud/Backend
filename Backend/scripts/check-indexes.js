import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Contact from '../src/modules/contacts/contacts.model.js';

dotenv.config();

const MONGODB_URI = process.env.DB_CONNECTION || 'mongodb://localhost:27017/invoice-db';

async function listIndexes() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const indexes = await Contact.collection.getIndexes();
        console.log('Current Indexes:');
        console.log(JSON.stringify(indexes, null, 2));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

listIndexes();
