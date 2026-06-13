import { Handler } from 'aws-lambda';
import { CaptureRequest, CaptureResponse } from '../../types/payment';

export const handler: Handler<CaptureRequest, CaptureResponse> = async (event) => {
  console.log('--- CAPTURE STEP STARTED ---');
  console.log('Received Authorization Context:', JSON.stringify(event, null, 2));

  try {
    const { transactionId, amount, currency } = event;

    if (!transactionId) {
      throw new Error('Missing transactionId. Cannot settle payment without an authorization hold.');
    }

    console.log(`Executing settlement for authorization token: ${transactionId} for value: ${amount} ${currency}`);
    
    // Simulate payment clearing network delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const mockCaptureId = `cap_settle_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Settlement finalized successfully. Capture ID: ${mockCaptureId}`);

    // Clean, structured return statement matching CaptureResponse interface
    return {
      settlementStatus: 'SUCCEEDED',
      capturedAt: new Date().toISOString()
    };

  } catch (error: any) {
    console.error('Settlement capture failure event logged:', error.message);
    
    // Fallback response matching CaptureResponse interface
    return {
      settlementStatus: 'FAILED',
      error: error.message
    };
  }
};