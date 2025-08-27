import axios from "axios";
import Chat from "../models/chat.js";
import User from "../models/user.js";
import imagekit from "../configs/imagekit.js";
import openai from "../configs/openAi.js";
//Text Based AI Chat Message Controller
export const textMessageController = async(req, res) => {
    try {
        const userId = req.user._id;


        if(req.user.credits < 1){
            return res.json({success:false,message:"You don'thave enough credits to use this feature"})
        }
        const {chatId, prompt} = req.body;
        

        const chat = await Chat.findOne({userId, _id:chatId})
        chat.messages.push({role: "user", content: prompt, timestamp: Date.now(), isImage: false})
        const {choices} = await openai.chat.completions.create({
            model: "gemini-2.0-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });
        //Choice[0] roughly looks like this

        //    {
        //   "id": "chatcmpl-123",
        //   "object": "chat.completion",
        //   "created": 1724698654,
        //   "model": "gemini-2.0-flash",
        //   "choices": [
        //     {
        //       "index": 0,
        //       "message": {
        //         "role": "assistant",
        //         "content": "Here is the answer to your prompt..."
        //       },
        //       "finish_reason": "stop"
        //     }
        //   ],
        //   "usage": {
        //     "prompt_tokens": 10,
        //     "completion_tokens": 20,
        //     "total_tokens": 30
        //   }
        // }



        const reply = {...choices[0].message, timestamp: Date.now(), isImage: false}
        res.json({success: true, reply})

        chat.messages.push(reply)
        await chat.save()

        await User.updateOne({_id : userId}, {$inc : {credits: -1}})
        


    } catch (error) {
        res.json({success:false, message: error.message})
    }
}



//Image generationMESSGAE controller
export const imageMessageController = async(req, res) =>{
    try {
        const userId = req.user._id;
        //check credits
        if(req.user.credits < 2){
            return res.json({success:false,message:"You don'thave enough credits to use this feature"})
        }

        const {prompt, chatId, isPublished} = req.body
        //findthe chat
        const chat = await Chat.findOne({userId, _id:chatId})
        //push user message
        chat.messages.push({role: "user", 
            content: prompt, 
            timestamp: Date.now(), 
            isImage: false}) //because the prompt is text

        //Encode the prompt: The model first encodes your prompt into smaller pieces called tokens
        const encodedPrompt = encodeURIComponent(prompt);

        // Construct the AI Image Generation URL and headers
        // const aiImageGenEndpoint = "https://imagekit.io/ai-image-gen/ik-genimg-prompt"; // The base endpoint for AI generation

            //Construct Image generation URL
        const generatedImageUrl = `${process.env.IMAGEKIT_URL_ENDPOINT}/
        ik-genimg-prompt-${encodedPrompt}/quickgpt/${Date.now()}.png?tr=w-800,
        h-800`; 

        //Trigger generation by fetching from ImageKit
        const aiImageResponse = await axios.get(generatedImageUrl, {responseType: "arraybuffer"})
        //Give me the raw binary data of the response as an ArrayBuffer (a low-level object for handling bytes in JavaScript)

        
        //Convert to Base64: It’s a way to represent binary data (like images, files, audio) using only ASCII text (letters, numbers, +, /, =).

        const base64Image = `data:image/png;base64,${Buffer.from(aiImageResponse.data,
            "binary").toString('base64')}`

        //Upload to IMageKit media library
        const uploadResponse = await imagekit.upload({
            file: base64Image,
            fileName: `${Date.now()}.png`,
            folder: "quickgpt"
        })

        // 
        const reply = {role: 'assistant', 
            content: uploadResponse.url,
            timestamp: Date.now(), 
            isImage: true,
        isPublished}

        res.json({success: true, reply})


        //update data in the database
        chat.messages.push(reply)
        await chat.save()

        //deduct 2 credits
        await User.updateOne({_id : userId}, {$inc : {credits: -2}})

    } catch (error) {
        res.json({success: false, message:error.message})
    }
}