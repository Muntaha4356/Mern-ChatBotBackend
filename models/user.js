import mongoose from "mongoose";
import bcrypt from 'bcryptjs'
const userSchema = new mongoose.Schema({
    name: {
        type:String,
        required:true
    },
    email: {
        type: String,
        required: true,
        unique:true,
    },
    password: {
        type: String,
        required: true,
    },
    credits: {
        type: Number,
        default:20,
    },


})
//Hash Passwird before saving
userSchema.pre('save', async function(next){
    if(!this.isModified('password')){
        return next()
    } //this refers to the document being saved (the user object).
    //Checks if the password field was modified.
    //Because if you’re updating the user’s email, username, etc., you don’t want to re-hash an already-hashed password.
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next();
})

const User = mongoose.model('User', userSchema);
export default User
