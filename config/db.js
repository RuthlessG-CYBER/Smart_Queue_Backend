import mongoose from 'mongoose';

export const connectDB = async() => {
    try {
        mongoose.connect(process.env.MONGODB_URL);
        console.log("Your DB is connected!");
    } catch (error) {
        console.log("Your DB is not connected!", error)
    }
}