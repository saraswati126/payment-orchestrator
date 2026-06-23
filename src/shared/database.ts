import * as fs from 'fs';
import * as path from 'path';

export interface PaymentRecord {
  paymentId: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'VALIDATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED';
  transactionId?: string;
  updatedAt: string;
}

// Store the JSON database file in your root project directory
const dbFilePath = path.join(process.cwd(), 'local-db-snapshot.json');

// Helper function to read the existing file history safely
function readLocalFileDB(): Record<string, PaymentRecord> {
  try {
    if (!fs.existsSync(dbFilePath)) return {};
    const rawData = fs.readFileSync(dbFilePath, 'utf-8');
    return JSON.parse(rawData || '{}');
  } catch (error) {
    return {};
  }
}

export const DB = {
  savePayment: async (record: Partial<PaymentRecord> & { paymentId: string }): Promise<void> => {
    // 1. Read everything currently stored in our file database history
    const allRecords = readLocalFileDB();

    // 2. Look up if this payment already exists, or start fresh
    const existing = allRecords[record.paymentId] || {
      paymentId: record.paymentId,
      customerId: '',
      amount: 0,
      currency: '',
      status: 'PENDING',
      updatedAt: ''
    };

    // 3. Merge the new updates
    const updatedRecord: PaymentRecord = {
      ...existing,
      ...record,
      updatedAt: new Date().toISOString()
    } as PaymentRecord;

    allRecords[record.paymentId] = updatedRecord;

    // 4. Write ALL records back to the hard drive file
    fs.writeFileSync(dbFilePath, JSON.stringify(allRecords, null, 2), 'utf-8');

    console.log(`💾 [File DB -> local-db-snapshot.json] Saved/Updated Record for: ${record.paymentId}`);
  },

  getPayment: async (paymentId: string): Promise<PaymentRecord | undefined> => {
    const allRecords = readLocalFileDB();
    return allRecords[paymentId];
  }
};