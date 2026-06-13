import { Handler } from 'aws-lambda';
import { PaymentRequest, ValidationResponse } from '../../types/payment';

export const handler: Handler<PaymentRequest, ValidationResponse> = async (event) => {
  console.log('Received payment validation request:', JSON.stringify(event, null, 2));

  // 1. Destructure fields from our request payload
  const { amount, customerId, currency } = event;

  // 2. Strict Enterprise Checks
  if (!customerId || customerId.trim() === '') {
    console.error('Validation Failed: Missing customerId');
    return { isValid: false };
  }

  if (!currency || currency.trim() === '') {
    console.error('Validation Failed: Missing currency');
    return { isValid: false };
  }

  if (amount <= 0) {
    console.error(`Validation Failed: Invalid amount ${amount}`);
    return { isValid: false };
  }

  // 3. Success Path
  console.log('Validation Successful');
  return {
    isValid: true
  };
};