import { Handler } from 'aws-lambda';
import { PaymentRequest } from '../../types/payment';

interface AuthorizationResponse {
  statusCode: number;
  transactionId?: string;
  status: 'AUTHORIZED' | 'FAILED';
  errorMessage?: string;
}

export const handler: Handler<PaymentRequest, AuthorizationResponse> = async (event) => {
  console.log('--- AUTHORIZATION STEP STARTED ---');
  console.log('Received Payload:', JSON.stringify(event, null, 2));

  try {
    const { amount, currency, customerId } = event;

    // Simulate an external API call to an upstream acquirer bank (e.g., Stripe/Adyen)
    console.log(`Requesting a credit hold of ${amount} ${currency} for Customer: ${customerId}`);
    
    // Mocking an external gateway network round-trip delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simple risk evaluation simulation rule
    if (amount > 10000) {
      throw new Error('Transaction limit exceeded. Potential fraud flag triggered.');
    }

    // Generate a simulated mock financial transaction track token
    const mockTxnId = `auth_txn_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Authorization successful. Transaction reference ID: ${mockTxnId}`);

    return {
      statusCode: 200,
      transactionId: mockTxnId,
      status: 'AUTHORIZED'
    };

  } catch (error: any) {
    console.error('Authorization processing failure:', error.message);
    return {
      statusCode: 400,
      status: 'FAILED',
      errorMessage: error.message
    };
  }
};