import mongoose from 'mongoose';
import config from './config.js';

dotenv.config();

export default async function connectMongo() {
    try {
        await mongoose.connect(config.database.uri, config.database.options);
        console.log("Connected to MongoDB");
    } catch (err) {
        console.error("Could not connect to MongoDB. Error:", err);
    }
}