import { Handler } from 'aws-lambda';
import { PaymentRequest, ValidationResponse } from '../../types/payment';
import { DB } from '../../shared/database';

export const handler: Handler<PaymentRequest, any> = async (event) => {
  console.log('📥 Received payment validation request:', JSON.stringify(event, null, 2));

  // 1. Destructure fields from our request payload
  const { paymentId, amount, customerId, currency } = event;

  // 2. Strict Enterprise Checks
  if (!customerId || customerId.trim() === '') {
    console.error('❌ Validation Failed: Missing customerId');
    throw new Error('ValidationError: Missing customerId');
  }

  if (!currency || currency.trim() === '') {
    console.error('❌ Validation Failed: Missing currency');
    throw new Error('ValidationError: Missing currency');
  }

  if (amount <= 0) {
    console.error(`❌ Validation Failed: Invalid amount ${amount}`);
    throw new Error(`ValidationError: Invalid amount ${amount}`);
  }

  // 3. Persist State to our Database (Automatically handles local JSON or Cloud DynamoDB!)
  await DB.savePayment({
    paymentId,
    customerId,
    amount,
    currency,
    status: 'VALIDATED'
  });

  // 4. Success Path
  console.log('✅ Validation Successful');
  
  // CRITICAL: We return the entire payload so the next state (Authorize) 
  // has access to the paymentId, amount, and currency!
  return {
    paymentId,
    customerId,
    amount,
    currency,
    status: 'VALIDATED'
  };
};