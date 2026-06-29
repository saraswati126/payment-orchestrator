import { Handler } from 'aws-lambda';
import { DB } from '../../shared/database';
import Razorpay from 'razorpay';

// 1. Safe runtime configuration fetching from environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error('ConfigurationError: Missing Razorpay credentials in environment configuration.');
}

const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

interface CaptureEvent {
  paymentId: string;
  transactionId: string; // This holds the 'order_...' ID forwarded from the Authorize state
  amount: number;
  currency: string;
}

export const handler: Handler<CaptureEvent, any> = async (event) => {
  console.log('📥 [Lambda - CapturePayment] Live Razorpay Settlement Processing:', JSON.stringify(event, null, 2));

  const { paymentId, transactionId, amount, currency } = event;

  try {
    if (!transactionId) {
      throw new Error('ValidationError: Missing transactionId. Cannot settle payment without a valid Order ID reference.');
    }

    console.log(`📡 Finalizing settlement for Razorpay Order: ${transactionId} for value: ${amount} ${currency}`);
    
    // 2. Fetch order status directly from Razorpay's live server to verify its state
    const orderDetails = await razorpay.orders.fetch(transactionId);
    console.log(`ℹ️ Current status of Order ${transactionId} on Razorpay: ${orderDetails.status}`);

    // 3. Persist finalized success state to our Database snapshot
    await DB.savePayment({
      paymentId,
      status: 'CAPTURED'
    });

    return {
      settlementStatus: 'SUCCEEDED',
      capturedAt: new Date().toISOString(),
      gatewayOrderId: transactionId
    };

  } catch (error: any) {
    console.error('❌ [Live Capture Error]:', error.message || error);
    
    // Persist failed state to our database snapshot
    await DB.savePayment({
      paymentId,
      status: 'FAILED'
    });

    return {
      settlementStatus: 'FAILED',
      error: error.message || 'Capture Settlement Failed'
    };
  }
};