import Stripe from "stripe";
import Transaction from "../models/transaction.js";
import User from "../models/user.js";

//A webhook is like a notification system.

// Stripe uses it to tell your backend when something happens (like a payment success, refund, subscription cancel, etc.).
// Instead of your server asking Stripe “hey, did the payment succeed?”, Stripe itself calls your server when the event happens.
// 👉 You give Stripe a special URL (endpoint) in your backend.
// Whenever an event occurs, Stripe sends an HTTP POST request with event details (like transaction ID, payment status).
export const stripeWebHooks = async (req, res) => {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const sig = req.headers["stripe-signature"] //Intention: read the special Stripe-Signature header to verify authenticity.


    let event;// tostore the verified Stripe event object here.
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET) //constructEvent(rawBody, signature, webhookSecret):Ensures the payload truly came from Stripe and wasn’t tampered with.
        //Requirement: req.body here must be the raw bytes, not parsed JSON.
    } catch (error) {
        return res.status(400).send(`Webhook Error:  ${error.message}`)
    }


    //An example of webhook event sent by stripe to the server
    // {
    //   "id": "evt_1PabcXYZ123456",
    //   "object": "event",
    //   "api_version": "2023-10-16",
    //   "created": 1693158400,
    //   "data": {
    //     "object": {
    //       "id": "pi_3Nc4f4AbCdEf123456",
    //       "object": "payment_intent",
    //       "amount": 1000,
    //       "amount_received": 1000,
    //       "currency": "usd",
    //       "status": "succeeded",
    //       "payment_method": "pm_1Nc4f4AbCdEfXYZ",
    //       "metadata": {},
    //       "customer": "cus_123abcXYZ",
    //       "description": "Payment for QuickGPT Plan",
    //       "created": 1693158300
    //     }
    //   },
    //   "livemode": false,
    //   "pending_webhooks": 1,
    //   "request": {
    //     "id": "req_123abc456xyz",
    //     "idempotency_key": null
    //   },
    //   "type": "payment_intent.succeeded"
    // }

    // }




    // An Example of session list
//     {
//   "object": "list",
//   "data": [
//     {
//       "id": "cs_test_a1B2C3D4E5F6",
//       "object": "checkout.session",
//       "payment_status": "paid",
//       "amount_total": 1000,
//       "currency": "usd",
//       "mode": "payment",
//       "payment_intent": "pi_3Nc4f4AbCdEf123456",
//       "metadata": {
//         "transactionId": "64f2d0eac5e7b3d0b9f1a123",
//         "appId": "quickgpt"
//       },
//       "customer": "cus_123abcXYZ",
//       "success_url": "http://localhost:3000/loading",
//       "cancel_url": "http://localhost:3000/"
//     }
//   ],
//   "has_more": false,
//   "url": "/v1/checkout/sessions"
// }


    try {
        switch (event.type) {
            case "payment_intent.succeeded":{
                const paymentIntent = event.data.object;

                const sessionList = await stripe.checkout.sessions.list({
                    payment_intent: paymentIntent.id,

                })


                const session = sessionList.data[0];
                const {transactionId, appId} = session.metadata;


                if(appId == 'quickgpt'){
                    const transaction = await Transaction.findOne({_id: transactionId, isPaid: false})

                    //Update the credits in user account
                    await User.updateOne({_id: transaction.userId},{$inc: {
                        credits: transaction.credits
                    }})

                    // Update credit Payment status
                    transaction.isPaid = true;
                    await transaction.save();

                }else{
                    return res.json({received: true, message: "Ignored event Invalid app"})
                }
                break;
            }
            default:
                console.log("Unhandled Event Type:", event.type)
                break;
        }
        res.json({received: true})
    } catch (error) {
        console.error("WebHook Processing error: ",error )
        res.status(500).send("Internal Server ERROR")

    }
}
