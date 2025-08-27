import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDb from './configs/db.js';
import userRouter from './routes/userRoutes.js';
import chatRouter from './routes/chatRoutes.js';
import messageRouter from './routes/messageRoutes.js';
import creditRouter from './routes/creditRoutes.js';
import { stripeWebHooks } from './controllers/webhook.js';

const app = express();


await connectDb();

// Stripe Webhooks
app.post('/api/stripe', express.raw({type: 'application/json'}), 
stripeWebHooks)

//middleware
app.use(cors())
app.use(express.json())

//Routes
app.get('/', (req, res)=> res.send('Server is Live'))

app.use('/api/user', userRouter)
app.use('/api/chat', chatRouter)
app.use('/api/message', messageRouter)
app.use('/api/credit', creditRouter)

const port = process.env.PORT ||  3000;

app.listen(port, ()=>{
    console.log(`Server is running on the port ${port}`)
})
