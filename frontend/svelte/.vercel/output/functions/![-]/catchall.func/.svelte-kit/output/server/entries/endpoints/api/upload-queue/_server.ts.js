import { error, json } from "@sveltejs/kit";
import * as XLSX from "xlsx";
const BACKEND_URL = "http://localhost:8080";
const POST = async ({ request, fetch }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const branchId = formData.get("branchId");
    if (!file || !branchId) {
      throw error(400, "File and branch ID are required");
    }
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    const transactions = data.map((row) => ({
      mobile_number: row["Mobile Number"] || row["mobile_number"] || row["Mobile"] || "",
      amount: parseFloat(row["Amount"] || row["amount"] || "0"),
      transaction_date: row["Date"] || row["transaction_date"] || row["Transaction Date"] || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      description: row["Description"] || row["description"] || "Excel Upload"
    }));
    const backendResponse = await fetch(`${BACKEND_URL}/api/uploads/queue`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        branch_id: branchId,
        file_name: file.name,
        transactions
      })
    });
    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw error(backendResponse.status, errorData.error || "Backend upload failed");
    }
    const result = await backendResponse.json();
    return json({
      success: true,
      jobId: result.job_id,
      message: result.message
    });
  } catch (err) {
    console.error("Upload error:", err);
    if (err instanceof Error) {
      throw error(500, err.message);
    }
    throw error(500, "Upload failed");
  }
};
export {
  POST
};
