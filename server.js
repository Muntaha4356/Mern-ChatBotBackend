import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDb from './configs/db.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import messageRouter from './routes/messageRoutes.js';

const app = express();


await connectDb();

//middleware
app.use(cors())
app.use(express.json())

//Routes
app.get('/', (req, res)=> res.send('Server is Live'))

app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)

const port = process.env.PORT ||  3000;

app.listen(port, ()=>{
    console.log(`Server is running on the port ${port}`)
})
