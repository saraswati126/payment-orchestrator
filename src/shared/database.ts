import * as fs from 'fs';
import * as path from 'path';
// Import the official AWS SDK tools we just installed
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';

export interface PaymentRecord {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'VALIDATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  transactionId?: string;
  updatedAt: string;
}

// --------------------------------------------------------
// 1. DATABASE CONFIGURATION (Local vs AWS Cloud)
// --------------------------------------------------------
const isAwsEnvironment = !!process.env.AWS_REGION; // AWS automatically sets this variable in the cloud
const TABLE_NAME = process.env.PAYMENTS_TABLE_NAME || 'PaymentsTable';

// Initialize the AWS DynamoDB Client ONLY if we are in AWS
const ddbClient = isAwsEnvironment ? new DynamoDBClient({}) : null;
const docClient = ddbClient ? DynamoDBDocumentClient.from(ddbClient) : null;

// Local file database path fallback
const dbFilePath = path.join(process.cwd(), 'local-db-snapshot.json');

// Helper function to read the local file history safely
function readLocalFileDB(): Record<string, PaymentRecord> {
  try {
    if (!fs.existsSync(dbFilePath)) return {};
    const rawData = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(rawData || '{}');
  } catch (error) {
    return {};
  }
}

// --------------------------------------------------------
// 2. UNIFIED DATABASE ACTIONS
// --------------------------------------------------------
export const DB = {
 savePayment: async (record: Partial<PaymentRecord> & { paymentId: string }): Promise<void> => {
    const updatedAt = new Date().toISOString();

    // ---- OPTION A: RUNNING IN AWS CLOUD (DynamoDB) ----
    if (isAwsEnvironment && docClient) {
      // Fetch existing record first to mimic the merge behavior
      const existing = await DB.getPayment(record.paymentId);
      
      const updatedRecord = {
        customerId: '',
        amount: 0,
        currency: '',
        status: 'PENDING' as const,
        ...existing,
        ...record, // This spread safely provides paymentId dynamically without duplication
        updatedAt
      };

      await docClient.send(
        new PutCommand({
          TableName: TABLE_NAME,
          Item: updatedRecord,
        })
      );
      console.log(`☁️ [AWS DynamoDB] Saved/Updated Record for: ${record.paymentId}`);
      return;
    }

    // ---- OPTION B: RUNNING ON YOUR LAPTOP (Local File) ----
    const allRecords = readLocalFileDB();
    const existing = allRecords[record.paymentId] || {
      paymentId: record.paymentId,
      customerId: '',
      amount: 0,
      currency: '',
      status: 'PENDING',
      updatedAt: ''
    };

    const updatedRecord: PaymentRecord = {
      ...existing,
      ...record,
      updatedAt
    } as PaymentRecord;

    allRecords[record.paymentId] = updatedRecord;
    fs.writeFileSync(dbFilePath, JSON.stringify(allRecords, null, 2), 'utf-8');
    console.log(`💾 [File DB -> local-db-snapshot.json] Saved/Updated Record for: ${record.paymentId}`);
  },

  getPayment: async (paymentId: string): Promise<PaymentRecord | undefined> => {
    // ---- OPTION A: RUNNING IN AWS CLOUD (DynamoDB) ----
    if (isAwsEnvironment && docClient) {
      const result = await docClient.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: { paymentId },
        })
      );
      return result.Item as PaymentRecord | undefined;
    }

    // ---- OPTION B: RUNNING ON YOUR LAPTOP (Local File) ----
    const allRecords = readLocalFileDB();
    return allRecords[paymentId];
  }
};