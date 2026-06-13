import { Handler } from 'aws-lambda';
import { AuthorizationRequest, AuthorizationResponse } from '../../types/payment';

export const handler: Handler<AuthorizationRequest, AuthorizationResponse> = async (event) => {
  console.log('--- AUTHORIZATION STEP STARTED ---');
  console.log('Received Payload:', JSON.stringify(event, null, 2));

  try {
    const { amount, currency, customerId, paymentId } = event;

    // Simulate an external API call to an upstream acquirer bank (e.g., Stripe)
    console.log(`[Payment: ${paymentId}] Requesting a credit hold of ${amount} ${currency} for Customer: ${customerId}`);
    
    // Mocking an external gateway network round-trip delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Simple risk evaluation simulation rule
    if (amount > 10000) {
      throw new Error('Transaction limit exceeded. Potential fraud flag triggered.');
    }

    // Generate a simulated mock financial transaction track token
    const mockTxnId = `auth_txn_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Authorization successful. Transaction reference ID: ${mockTxnId}`);

    // Matches the central AuthorizationResponse interface perfectly
    return {
      status: 'AUTHORIZED',
      transactionId: mockTxnId
    };

  } catch (error: any) {
    console.error('Authorization processing failure:', error.message);
    
    // Matches the central AuthorizationResponse interface perfectly
    return {
      status: 'DECLINED',
      error: error.message
    };
  }
};