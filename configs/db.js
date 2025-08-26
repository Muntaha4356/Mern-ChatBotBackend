import mongoose from "mongoose";

const connectDb = async () =>{
    try {
        mongoose.connection.on(`connected`, ()=>console.log('database connected'))
        await mongoose.connect(`${process.env.MONGODB_URI}/quickgpt`) //it'll create a db with a cluster named quickgpt
    } catch (error) {
        console.log(error.message)
    }
}

export default connectDb