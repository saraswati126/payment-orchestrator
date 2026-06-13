import { Handler } from 'aws-lambda';

interface CaptureRequest {
  transactionId: string;
  amount: number;
  currency: string;
}

interface CaptureResponse {
  statusCode: number;
  captureId?: string;
  status: 'CAPTURED' | 'RECONCILIATION_REQUIRED';
  errorMessage?: string;
}

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

    return {
      statusCode: 200,
      captureId: mockCaptureId,
      status: 'CAPTURED'
    };

  } catch (error: any) {
    console.error('Settlement capture failure event logged:', error.message);
    return {
      statusCode: 500,
      status: 'RECONCILIATION_REQUIRED',
      errorMessage: error.message
    };
  }
};