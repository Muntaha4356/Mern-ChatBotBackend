import Transaction from "../models/transaction.js"
import Stripe from 'stripe'

const plans = [
    {
        _id: "basic",
        name: "Basic",
        price: 10,
        credits: 100,
        features: ['100 text generations', '50 image generations', 'Standard support', 'Access to basic models']
    },
    {
        _id: "pro",
        name: "Pro",
        price: 20,
        credits: 500,
        features: ['500 text generations', '200 image generations', 'Priority support', 'Access to pro models', 'Faster response time']
    },
    {
        _id: "premium",
        name: "Premium",
        price: 30,
        credits: 1000,
        features: ['1000 text generations', '500 image generations', '24/7 VIP support', 'Access to premium models', 'Dedicated account manager']
    }
]


//API Controller for getting all plans
export const getPlans = async(req,res) => {
    try {
        res.json({success: true, plans})
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

//API Controller for purchasing a plan
export const purchasePlans = async(req,res) => {
    try {
        const { planId } = req.body
        const userId = req.user._id
        const plan = plans.find(plan=> plan._id === planId)

        if(!plan){
            return res.json({success: false,message: "Invalid Plan"})

        }

        //Create a transaction: Creates a new transaction record in MongoDB (assuming you have a Transaction model).
        const transaction = await Transaction.create({
            userId:userId,
            planId: plan._id,
            amount: plan.price,
            credits: plan.credits,
            isPaid: false
        })

        // Extracts the origin (where the request came from).
        // Example: if frontend runs on http://localhost:3000, then origin = "http://localhost:3000".
        const {origin} = req.headers;

        //make online payment
        // Creates a new Stripe Checkout session.
        const session = await stripe.checkout.sessions.create({
            // line_items: What the user is buying.
            line_items: [
                {
                price_data: {
                    currency: "usd",
                    // unit_amount: plan.price * 100 → Stripe uses cents, so multiply price by 100. (If price = $10, it becomes 1000 cents).
                    unit_amount: plan.price * 100,
                    // product_data.name → shows plan name in checkout.
                    product_data: {
                        name: plan.name
                    }
                },
                quantity: 1,
                },
            ],
            // Checkout mode: 'payment' → one-time payment (not subscription).
            mode: 'payment',
            // success_url → payment success (here goes to /loading page first).
            success_url: `${origin}/loading`,
            // cancel_url → user cancels payment (goes back to homepage).
            cancel_url: `${origin}` ,
            // Adds extra metadata to Stripe session.
            // Here: attaches transactionId and appId.
            // Very useful: when Stripe webhook sends a payment confirmation, you can link it back to your transaction.
            metadata: {transactionId: transaction._id.toString(), appId:`quickgpt`} ,
            expires_at: Math.floor(Date.now() / 1000 + 30 * 60 )
        });

        res.json({success: true, url: session.url})


    } catch (error) {
        res.json({success:false, message: error.message})
    }
}

