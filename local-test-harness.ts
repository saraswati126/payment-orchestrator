// local-test-harness.ts
import * as dotenv from 'dotenv';
import * as path from 'path';

// 1. Core Environment Bootstrapping (Must execute before loading your lambda handlers)
dotenv.config({ path: path.resolve(process.cwd(), '.env.dev') });
console.log('🔌 Loaded Environment Key ID:', process.env.RAZORPAY_KEY_ID ? '✅ FOUND' : '❌ MISSING');

import { handler as validateHandler } from './src/functions/validate-payment/index';
import { handler as authorizeHandler } from './src/functions/authorize-payment/index';
import { handler as captureHandler } from './src/functions/capture-payment/index';
import { PaymentRequest } from './src/types/payment';
import { Context } from 'aws-lambda';

// Define the mock AWS background context objects
const mockContext = {} as Context;
const mockCallback = () => {};

async function runSimulationPipeline() {
  console.log("🚀 Starting Local Payment Orchestrator Simulation...\n");

  // Mock initial incoming payload 
  // (Using INR for standard Razorpay India testing; 15000 paise = 150.00 INR)
  const incomingPayload: PaymentRequest = {
    paymentId: `pay_order_${Math.random().toString(36).substr(2, 5)}`,
    customerId: "cust_enterprise_8892",
    amount: 15000, 
    currency: "INR"
  };

  // --- STEP 1: Validate Payment State ---
  console.log("Executing State: ValidatePaymentState...");
  const validationResult = await validateHandler(incomingPayload, mockContext, mockCallback);
  console.log("Output:", JSON.stringify(validationResult, null, 2));

  // The updated validate handler throws errors on failure or returns the payload object on success
  if (!validationResult || validationResult.status !== 'VALIDATED') {
    console.error("\n❌ Pipeline Routed to: TransactionFailedState (Validation Rejected)");
    return;
  }
  console.log("✅ Choice State Passed: $.status === VALIDATED. Routing to AuthorizePaymentState.\n");

  // --- STEP 2: Authorize Payment State ---
  console.log("Executing State: AuthorizePaymentState...");
  // Pass the output of validationResult forward to replicate Step Functions behavior
  const authorizationOutput = await authorizeHandler(validationResult, mockContext, mockCallback);
  
  // Step Functions stores the handler response under the key "authResult"
  const stepFunctionStateMemory = {
    ...validationResult,
    authResult: authorizationOutput
  };
  console.log("State Memory Stack:", JSON.stringify(stepFunctionStateMemory, null, 2));

  if (!stepFunctionStateMemory.authResult || stepFunctionStateMemory.authResult.status !== 'AUTHORIZED') {
    console.error("\n❌ Pipeline Routed to: TransactionFailedState (Authorization Declined)");
    return;
  }
  console.log("✅ Choice State Passed: $.authResult.status === AUTHORIZED. Routing to PrepareCapturePayloadState.\n");

  // --- STEP 3: Prepare Capture Payload State (Pass State Context Transformer) ---
  console.log("Executing State: PrepareCapturePayloadState (Transforming Context)...");
  const captureLambdaInput = {
    paymentId: stepFunctionStateMemory.paymentId,
    transactionId: stepFunctionStateMemory.authResult.transactionId!,
    amount: stepFunctionStateMemory.amount,
    currency: stepFunctionStateMemory.currency
  };
  console.log("Transformed Input Payload for Capture:", JSON.stringify(captureLambdaInput, null, 2));

  // --- STEP 4: Capture Payment State ---
  console.log("\nExecuting State: CapturePaymentState...");
  const captureOutput = await captureHandler(captureLambdaInput, mockContext, mockCallback);
  
  const finalStateMemory = {
    ...stepFunctionStateMemory,
    captureResult: captureOutput
  };
  console.log("Final State Memory Stack:", JSON.stringify(finalStateMemory, null, 2));

  if (!finalStateMemory.captureResult || finalStateMemory.captureResult.settlementStatus !== 'SUCCEEDED') {
     console.error("\n❌ Pipeline Routed to: TransactionFailedState (Capture Settlement Failed)");
     return;
  }

  console.log("\n🏁 Pipeline Routed to: TransactionSuccessState. Execution completed flawlessly!");
}

runSimulationPipeline().catch(err => {
  console.error("Pipeline crashed due to unhandled runtime variance:", err);
});