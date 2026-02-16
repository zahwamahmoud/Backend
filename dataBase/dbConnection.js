import mongoose from "mongoose";

export const dbConnection = async () => {
    try {
        if (!process.env.DB_CONNECTION) {
            throw new Error("Database connection string is not defined in environment variables.");
        }

        await mongoose.connect(process.env.DB_CONNECTION);
        console.log('Database connection successful');
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
};