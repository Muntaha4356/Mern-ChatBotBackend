import User from "../models/user.js";
import jwt from 'jsonwebtoken'
import bcrypt from "bcryptjs";
//Generate token
const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {
        expiresIn: '30d'
    })
}

//Api to register User
export const registerUser = async (req, res) => {
    const {name, email, password} = req.body;

    try {
        const userExist = await User.findOne({email})
        if(userExist){
            return res.json({success:false, message:"User already exist"})
        }
        const user = await User.create({name,email, password})
        // Generating the web token
        const token = generateToken(user._id)
        res.json({success:true, token})
    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}

//API TO LOGIN 
export const loginUser = async (req, res) => {
    const {email, password} = req.body;
    try {
        const userExist = await User.findOne({email})
        if(!userExist){
            console.log("entere")
            return res.status(404).json({success:false, message:"User Doesn't exist"})
        }
        const isMatch = await bcrypt.compare(password, userExist.password);
        if(!isMatch){
            return res.json({success: false, message:"Password is incorrect"})
        }
        const token = generateToken(userExist._id)
        return res.json({success: true, token})
    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}


//api to get user data
export const getUser = async(req, res) => {
    try {
        const user = req.user;
        return res.json({success: true, user})
    } catch (error) {
        return res.json({success:false, message: error.message})
    }
}