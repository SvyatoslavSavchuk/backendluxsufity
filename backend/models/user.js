import mongoose from "mongoose";

const Schema = mongoose.Schema;
const userSchema = Schema({
    name: String,
    userEmail: String,
    password: String 
})

export default mongoose.model('User', userSchema)