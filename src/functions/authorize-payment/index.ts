import { Handler } from 'aws-lambda';
import { DB } from '../../shared/database';
import Razorpay from 'razorpay';

// 1. Safe runtime configuration fetching from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

// Fail-fast guard clause to ensure secrets are injected properly
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('ConfigurationError: Missing Razorpay credentials in environment configuration.');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

interface AuthorizeEvent {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: string;
}

export const handler: Handler<AuthorizeEvent, any> = async (event) => {
  console.log('📥 [Lambda - AuthorizePayment] Live Razorpay Processing:', JSON.stringify(event, null, 2));

  const { paymentId, customerId, amount, currency } = event;

  try {
    console.log(`📡 Communication initiated with Razorpay API for ${amount} ${currency}...`);

    // 2. Instantiate a verified Order entity inside Razorpay's staging servers
    // (Amounts are processed as the base fractional integer: e.g. Paise for INR)
    const order = await razorpay.orders.create({
      amount: amount, 
      currency: currency.toUpperCase(),
      receipt: paymentId, 
      notes: {
        internalCustomerId: customerId,
        environment: 'Serverless-Payment-Orchestrator'
      }
    });

    console.log(`✅ Live Razorpay Authorization Success! Order ID: ${order.id}`);

    // 3. Persist the generated Order entity ID reference directly into the database snapshot
    await DB.savePayment({
      paymentId,
      status: 'AUTHORIZED',
      transactionId: order.id 
    });

    // 4. Bubble tracking metadata up to forward it to the Capture phase 
    return {
      paymentId,
      customerId,
      amount,
      currency,
      transactionId: order.id,
      status: 'AUTHORIZED'
    };

  } catch (error: any) {
    // CRITICAL DEBUG: Stringify the entire object to read what Razorpay rejected
    console.error(`❌ [Live Razorpay Error Deep Log]:`, JSON.stringify(error, null, 2));
    
    await DB.savePayment({
      paymentId,
      status: 'FAILED'
    });

    // Bubble up a clear message string
    const description = error.error?.description || error.message || 'Failed to authorize payment';
    throw new Error(`RazorpayGatewayException: ${description}`);
  }
};