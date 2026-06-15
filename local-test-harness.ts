// local-test-harness.ts
import { handler as validateHandler } from './src/functions/validate-payment/index';
import { handler as authorizeHandler } from './src/functions/authorize-payment/index';
import { handler as captureHandler } from './src/functions/capture-payment/index';
import { PaymentRequest, ValidationResponse, AuthorizationResponse, CaptureResponse } from './src/types/payment';
import { Context } from 'aws-lambda';

// Define the mock AWS background context objects
const mockContext = {} as Context;
const mockCallback = () => {};

async function runSimulationPipeline() {
  console.log("🚀 Starting Local Payment Orchestrator Simulation...\n");

  // 1. Mock initial incoming payload containing your core tracking property
  const incomingPayload: PaymentRequest = {
    paymentId: `pay_order_${Math.random().toString(36).substr(2, 5)}`,
    customerId: "cust_enterprise_8892",
    amount: -3000, 
    currency: "USD"
  };

  // --- STEP 1: Validate Payment State ---
  console.log("Executing State: ValidatePaymentState...");
  const validationResult = await validateHandler(incomingPayload, mockContext, mockCallback) as ValidationResponse;
  console.log("Output:", JSON.stringify(validationResult, null, 2));

  if (!validationResult || validationResult.isValid !== true) {
    console.error("\n❌ Pipeline Routed to: TransactionFailedState (Validation Rejected)");
    return;
  }
  console.log("✅ Choice State Passed: $.isValid === true. Routing to AuthorizePaymentState.\n");

  // --- STEP 2: Authorize Payment State ---
  console.log("Executing State: AuthorizePaymentState...");
  const authorizationOutput = await authorizeHandler(incomingPayload, mockContext, mockCallback) as AuthorizationResponse;
  
  // Step Functions stores the handler response under the key "authResult"
  const stepFunctionStateMemory = {
    ...incomingPayload,
    authResult: authorizationOutput
  };
  console.log("State Memory Stack:", JSON.stringify(stepFunctionStateMemory, null, 2));

  if (stepFunctionStateMemory.authResult.status !== 'AUTHORIZED') {
    console.error("\n❌ Pipeline Routed to: TransactionFailedState (Authorization Declined)");
    return;
  }
  console.log("✅ Choice State Passed: $.authResult.status === AUTHORIZED. Routing to PrepareCapturePayloadState.\n");

  // --- STEP 3: Prepare Capture Payload State (Pass State Context Transformer) ---
  console.log("Executing State: PrepareCapturePayloadState (Transforming Context)...");
  const captureLambdaInput = {
    transactionId: stepFunctionStateMemory.authResult.transactionId!,
    amount: stepFunctionStateMemory.amount,
    currency: stepFunctionStateMemory.currency
  };
  console.log("Transformed Input Payload for Capture:", JSON.stringify(captureLambdaInput, null, 2));

  // --- STEP 4: Capture Payment State ---
  console.log("\nExecuting State: CapturePaymentState...");
  const captureOutput = await captureHandler(captureLambdaInput, mockContext, mockCallback) as CaptureResponse;
  
  const finalStateMemory = {
    ...stepFunctionStateMemory,
    captureResult: captureOutput
  };
  console.log("Final State Memory Stack:", JSON.stringify(finalStateMemory, null, 2));

  if (finalStateMemory.captureResult.settlementStatus !== 'SUCCEEDED') {
     console.error("\n❌ Pipeline Routed to: TransactionFailedState (Capture Settlement Failed)");
     return;
  }

  console.log("\n🏁 Pipeline Routed to: TransactionSuccessState. Execution completed flawlessly!");
}

runSimulationPipeline().catch(err => {
  console.error("Pipeline crashed due to unhandled runtime variance:", err);
});