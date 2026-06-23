import { Handler } from 'aws-lambda';
import { CaptureRequest, CaptureResponse } from '../../types/payment';
import { DB } from '../../shared/database';

export const handler: Handler<CaptureRequest, CaptureResponse> = async (event) => {
  console.log('--- CAPTURE STEP STARTED ---');
  console.log('Received Authorization Context:', JSON.stringify(event, null, 2));

  // Destructure paymentId along with the other fields so we know which record to update
  const { paymentId, transactionId, amount, currency } = event;

  try {
    if (!transactionId) {
      throw new Error('Missing transactionId. Cannot settle payment without an authorization hold.');
    }

    console.log(`Executing settlement for authorization token: ${transactionId} for value: ${amount} ${currency}`);
    
    // Simulate payment clearing network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockCaptureId = `cap_settle_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Settlement finalized successfully. Capture ID: ${mockCaptureId}`);

    // Persist finalized success state to Mock DynamoDB
    await DB.savePayment({
      paymentId,
      status: 'CAPTURED'
    });

    return {
      settlementStatus: 'SUCCEEDED',
      capturedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Settlement capture failure event logged:', error.message);
    
    // Persist failed state to Mock DynamoDB
    await DB.savePayment({
      paymentId,
      status: 'FAILED'
    });

    return {
      settlementStatus: 'FAILED',
      error: error.message
    };
  }
};