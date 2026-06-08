// src/types/payment.ts
export interface PaymentRequest {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: string;
  transactionId?: string;
}