import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

const testConnection = async () => {
    console.log('Testing connection to:', process.env.DB_CONNECTION);
    try {
        await mongoose.connect(process.env.DB_CONNECTION, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log('SUCCESS: Connected to MongoDB Atlas');
        await mongoose.disconnect();
    } catch (err) {
        console.error('ERROR: Failed to connect to MongoDB Atlas');
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
        if (err.message.includes('querySrv')) {
            console.log('\nTIP: This looks like a DNS SRV resolution issue. Try checking your DNS settings or firewall.');
        } else if (err.message.includes('IP address')) {
            console.log('\nTIP: Your IP address might not be whitelisted in MongoDB Atlas.');
        }
    }
    process.exit();
};

testConnection();
