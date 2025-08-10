import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import * as XLSX from 'xlsx';

const BACKEND_URL = 'http://localhost:8080'; // Adjust based on your Go server port

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const branchId = formData.get('branchId') as string;

    if (!file || !branchId) {
      throw error(400, 'File and branch ID are required');
    }

    // Parse Excel file
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    // Transform data to match expected format
    const transactions = data.map((row: any) => ({
      mobile_number: row['Mobile Number'] || row['mobile_number'] || row['Mobile'] || '',
      amount: parseFloat(row['Amount'] || row['amount'] || '0'),
      transaction_date: row['Date'] || row['transaction_date'] || row['Transaction Date'] || new Date().toISOString().split('T')[0],
      description: row['Description'] || row['description'] || 'Excel Upload',
    }));

    // Send to Go backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/uploads/queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        branch_id: branchId,
        file_name: file.name,
        transactions: transactions,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw error(backendResponse.status, errorData.error || 'Backend upload failed');
    }

    const result = await backendResponse.json();
    return json({
      success: true,
      jobId: result.job_id,
      message: result.message,
    });

  } catch (err) {
    console.error('Upload error:', err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, 'Upload failed');
  }
};
