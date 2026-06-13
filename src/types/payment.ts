// src/types/payment.ts

// ============================================================================
// 1. VALIDATION LAYER CONTRACTS
// ============================================================================
/**
 * Represents the raw incoming payload hitting our API.
 */
export interface PaymentRequest {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
}

/**
 * The response contract returned by the ValidatePayment Lambda handler.
 */
export interface ValidationResponse {
  isValid: boolean;
}

// ============================================================================
// 2. AUTHORIZATION LAYER CONTRACTS
// ============================================================================
/**
 * Represents the data injected into the AuthorizePayment Lambda.
 */
export interface AuthorizationRequest {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
}

/**
 * The structural contract returned from your simulated Stripe authorization loop.
 */
export interface AuthorizationResponse {
  status: 'AUTHORIZED' | 'DECLINED';
  transactionId?: string;
  error?: string;
}

// ============================================================================
// 3. CAPTURE LAYER CONTRACTS
// ============================================================================
/**
 * Input schema required to finalize the transaction.
 */
export interface CaptureRequest {
  transactionId: string;
  amount: number;
  currency: string;
}

/**
 * The final settlement status tracking object confirming funds capture.
 */
export interface CaptureResponse {
  settlementStatus: 'SUCCEEDED' | 'FAILED';
  capturedAt?: string;
  error?: string;
}

// ============================================================================
// 4. FINAL PIPELINE OUTCOME CONTRACT (Your Core Interface)
// ============================================================================
/**
 * The ultimate consolidated response returned to the client application 
 * after the Step Function finishes execution entirely.
 */
export interface PaymentResponse {
  paymentId: string;
  status: 'SUCCESS' | 'FAILED';
  transactionId?: string;
}