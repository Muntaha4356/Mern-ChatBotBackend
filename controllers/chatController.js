import Chat from "../models/chat.js";


//Api controller for creating a new chat
export const createChat = async(req, res) => {
    try {
        const userId = req.user._id;
        const chatData = {
            userId,
            messages: [],
            name:"New Chat",
            userName: req.user.name
        }

        await Chat.create(chatData)
        res.json({success: true, message: "Chat Created"})


    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

//API controller for getting all the chats
export const getAllChat = async(req, res) => {
    try {
        const userId = req.user._id;
        const chats = await Chat.find({userId}).sort({updatedAt: -1})


        res.json({success: true, chats})


    } catch (error) {
        res.json({success:false, message:error.message})
    }
}

//API Controller for deleting a chat
export const deleteChat = async(req, res) => {
    try {
        const userId = req.user._id;
        const {chatId} = req.body

        await Chat.deleteOne({_id: chatId, userId: userId})

        


        res.json({success: true, message:"Deleted Successfully"})


    } catch (error) {
        res.json({success:false, message:error.message})
    }
}


