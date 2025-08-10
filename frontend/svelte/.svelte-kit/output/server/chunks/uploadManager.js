import { w as writable } from "./index2.js";
import { s as supabase } from "./supabase.js";
import * as XLSX from "xlsx";
class UploadManager {
  activeUploads = writable(/* @__PURE__ */ new Map());
  completedUploads = writable([]);
  pausedUploads = writable(/* @__PURE__ */ new Map());
  // Store paused upload data
  pollingInterval = null;
  isPolling = false;
  processingJobs = /* @__PURE__ */ new Map();
  // Track which jobs are actively processing
  constructor() {
    this.loadFromStorage();
    console.log("📋 UploadManager initialized (in-memory tracking mode)");
  }
  loadFromStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      console.log("localStorage not available (SSR environment)");
      return;
    }
    try {
      const stored = localStorage.getItem("uploadManager_state");
      if (stored) {
        const state = JSON.parse(stored);
        if (state.completedUploads) {
          this.completedUploads.set(state.completedUploads);
        }
      }
    } catch (error) {
      console.error("Failed to load upload manager state:", error);
    }
  }
  saveToStorage() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return;
    }
    try {
      this.completedUploads.subscribe((completed) => {
        const state = {
          completedUploads: completed.slice(-20)
          // Keep last 20 uploads
        };
        localStorage.setItem("uploadManager_state", JSON.stringify(state));
      })();
    } catch (error) {
      console.error("Failed to save upload manager state:", error);
    }
  }
  async startUpload(file, branchId) {
    try {
      const jobId = crypto.randomUUID();
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      const transactions = data.map((row, index) => {
        const billNo = row["Bill No"] || row["bill_no"] || `AUTO-${Date.now()}-${index}`;
        let billDate = row["Bill Date (YYYY-MM-DD)"] || row["Bill Date (YYYY-MM)"] || row["Bill Date"] || row["bill_date"];
        if (billDate && typeof billDate === "string" && billDate.match(/^\d{4}-\d{2}$/)) {
          billDate = billDate + "-01";
        } else if (!billDate) {
          billDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        }
        const billAmount = parseFloat(row["Bill Amount"] || row["bill_amount"] || "0");
        const customerMobile = row["Customer Mobile"] || row["customer_mobile"] || row["Mobile Number"] || row["mobile_number"] || "";
        const pointsToAdd = parseFloat(row["Points to Add"] || row["points_to_add"] || "0");
        const pointsToRedeem = parseFloat(row["Points to Redeem"] || row["points_to_redeem"] || "0");
        console.log(`Row ${index + 1}:`, {
          billNo,
          billDate,
          billAmount,
          customerMobile,
          pointsToAdd,
          pointsToRedeem
        });
        return {
          bill_no: billNo,
          mobile_number: customerMobile.toString(),
          amount: billAmount,
          points_to_add: pointsToAdd,
          points_to_redeem: pointsToRedeem,
          transaction_date: billDate,
          description: `Bill #${billNo} - Upload`
        };
      }).filter(
        (transaction) => (
          // Filter out empty rows
          transaction.mobile_number && transaction.mobile_number.trim() !== "" && transaction.amount > 0
        )
      );
      const uploadJob = {
        id: jobId,
        user_id: "system_user",
        branch_id: branchId,
        file_name: file.name,
        status: "pending",
        total_transactions: transactions.length,
        processed_transactions: 0,
        failed_transactions: 0,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      console.log("Using in-memory tracking only for upload status (upload_jobs table not available)");
      const uploadProgress = {
        jobId,
        fileName: file.name,
        status: "pending",
        progress: {
          total: transactions.length,
          processed: 0,
          failed: 0
        }
      };
      this.activeUploads.update((map) => {
        map.set(jobId, uploadProgress);
        return map;
      });
      this.processUploadInBackground(jobId, transactions, branchId);
      console.log(`📊 Upload job ${jobId} started (in-memory mode)`);
      return jobId;
    } catch (error) {
      console.error("Failed to start upload:", error);
      throw error;
    }
  }
  async pauseUpload(jobId) {
    try {
      this.processingJobs.set(jobId, false);
      console.log("Upload paused (in-memory tracking only)");
      this.activeUploads.update((map) => {
        const existing = map.get(jobId);
        if (existing) {
          existing.status = "paused";
          existing.can_resume = true;
        }
        return map;
      });
      return true;
    } catch (error) {
      console.error("Failed to pause upload:", error);
      return false;
    }
  }
  async resumeUpload(jobId) {
    try {
      let job;
      this.activeUploads.subscribe((map) => {
        job = map.get(jobId);
      })();
      if (!job || job.status !== "paused") {
        console.error("Job not found or not paused:", jobId);
        return false;
      }
      let pausedData = null;
      this.pausedUploads.subscribe((map) => {
        pausedData = map.get(jobId);
      })();
      if (!pausedData) {
        console.error("No paused data found for job:", jobId);
        return false;
      }
      this.processingJobs.set(jobId, true);
      console.log("Resuming upload (in-memory tracking only)");
      this.activeUploads.update((map) => {
        const existing = map.get(jobId);
        if (existing) {
          existing.status = "processing";
          existing.can_resume = false;
        }
        return map;
      });
      this.resumeProcessingFromIndex(jobId, pausedData.transactions, pausedData.branchId, job.progress.processed);
      return true;
    } catch (error) {
      console.error("Failed to resume upload:", error);
      return false;
    }
  }
  async cancelUpload(jobId) {
    try {
      this.processingJobs.set(jobId, false);
      console.log("Upload cancelled (in-memory tracking only)");
      this.activeUploads.update((map) => {
        map.delete(jobId);
        return map;
      });
      this.pausedUploads.update((map) => {
        map.delete(jobId);
        return map;
      });
      return true;
    } catch (error) {
      console.error("Failed to cancel upload:", error);
      return false;
    }
  }
  async processUploadInBackground(jobId, transactions, branchId) {
    try {
      this.processingJobs.set(jobId, true);
      this.pausedUploads.update((map) => {
        map.set(jobId, { transactions, branchId });
        return map;
      });
      console.log("Processing upload in memory only (upload_jobs table not available)");
      this.activeUploads.update((map) => {
        const existing = map.get(jobId);
        if (existing) {
          existing.status = "processing";
        }
        return map;
      });
      await this.processTransactionsFromIndex(jobId, transactions, branchId, 0);
    } catch (error) {
      console.error("Upload processing failed:", error);
      this.activeUploads.update((map) => {
        const existing = map.get(jobId);
        if (existing) {
          existing.status = "failed";
          existing.error = error instanceof Error ? error.message : "Unknown error occurred";
        }
        return map;
      });
      this.processingJobs.set(jobId, false);
    }
  }
  async resumeProcessingFromIndex(jobId, transactions, branchId, startIndex) {
    await this.processTransactionsFromIndex(jobId, transactions, branchId, startIndex);
  }
  async processTransactionsFromIndex(jobId, transactions, branchId, startIndex) {
    let processed = startIndex;
    let failed = 0;
    if (startIndex > 0) {
      const currentJob = await this.getUploadStatus(jobId);
      if (currentJob) {
        failed = currentJob.progress.failed;
      }
    }
    const batchSize = 5;
    console.log(`🚀 Starting batch processing: ${transactions.length} total transactions, batch size: ${batchSize}`);
    for (let i = startIndex; i < transactions.length; i += batchSize) {
      const shouldContinue = this.processingJobs.get(jobId);
      if (!shouldContinue) {
        console.log(`⏸️ Upload ${jobId} paused or cancelled at index ${i}`);
        return;
      }
      const batch = transactions.slice(i, Math.min(i + batchSize, transactions.length));
      const batchEnd = Math.min(i + batchSize, transactions.length);
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}: transactions ${i + 1}-${batchEnd} of ${transactions.length}`);
      for (const [batchIndex, transaction] of batch.entries()) {
        const overallIndex = i + batchIndex + 1;
        if (!this.processingJobs.get(jobId)) {
          console.log(`⏸️ Upload stopped during transaction ${overallIndex}`);
          return;
        }
        console.log(`📝 Processing transaction ${overallIndex}/${transactions.length}:`);
        console.log(`   Bill No: ${transaction.bill_no}`);
        console.log(`   Amount: ${transaction.amount}`);
        console.log(`   Mobile: ${transaction.mobile_number}`);
        console.log(`   Points to Add: ${transaction.points_to_add}`);
        console.log(`   Points to Redeem: ${transaction.points_to_redeem}`);
        try {
          let normalizedMobile = transaction.mobile_number.toString().replace(/\D/g, "");
          console.log(`📱 Original mobile: ${transaction.mobile_number} -> digits only: ${normalizedMobile} (length: ${normalizedMobile.length})`);
          if (normalizedMobile.length > 10) {
            if (normalizedMobile.startsWith("962") && normalizedMobile.length === 12) {
              normalizedMobile = "0" + normalizedMobile.substring(3);
              console.log(`🔄 Converted from 962 format: ${normalizedMobile}`);
            } else {
              normalizedMobile = normalizedMobile.substring(normalizedMobile.length - 10);
              console.log(`✂️ Truncated to last 10 chars: ${normalizedMobile}`);
            }
          }
          if (normalizedMobile.length === 9) {
            if (normalizedMobile.startsWith("7") || normalizedMobile.startsWith("5")) {
              normalizedMobile = "0" + normalizedMobile;
              console.log(`➕ Added leading 0: ${normalizedMobile}`);
            }
          }
          if (normalizedMobile.length !== 10 || !normalizedMobile.startsWith("0")) {
            if (normalizedMobile.length < 10) {
              normalizedMobile = ("0000000000" + normalizedMobile).slice(-10);
              console.log(`🔧 Padded short number: ${normalizedMobile}`);
            } else {
              normalizedMobile = "0" + normalizedMobile.substring(1, 10);
              console.log(`🔧 Fixed invalid format: ${normalizedMobile}`);
            }
          }
          console.log(`📱 Final normalized mobile: ${normalizedMobile} (length: ${normalizedMobile.length})`);
          if (normalizedMobile.length !== 10) {
            console.error(`❌ Invalid mobile number format: ${transaction.mobile_number} -> ${normalizedMobile} (length: ${normalizedMobile.length})`);
            failed++;
            continue;
          }
          if (!normalizedMobile.match(/^0[75]\d{8}$/)) {
            console.warn(`⚠️ Warning: Mobile number may not be valid Jordan format: ${normalizedMobile} (should be 07XXXXXXXX or 05XXXXXXXX)`);
          }
          let customer = null;
          console.log(`🔍 Looking up customer for mobile: ${normalizedMobile}`);
          const { data: existingCustomers, error: customerLookupError } = await supabase.from("customers").select("id, customer_code, mobile, branch_id").eq("mobile", normalizedMobile).limit(1);
          if (customerLookupError) {
            console.error("❌ Customer lookup error:", customerLookupError);
            console.error("📊 Query details - Table: customers, Mobile:", normalizedMobile);
            failed++;
            continue;
          }
          if (existingCustomers && existingCustomers.length > 0) {
            customer = existingCustomers[0];
            console.log(`✅ Found existing customer: ${customer.id} for mobile: ${normalizedMobile}`);
          } else {
            console.log(`➕ Creating new customer for mobile: ${normalizedMobile}, branch: ${branchId}`);
            const { data: defaultCardType } = await supabase.from("card_types").select("id").eq("name", "bronze").single();
            const newCustomerData = {
              customer_code: normalizedMobile,
              mobile: normalizedMobile,
              branch_id: branchId,
              card_type_id: defaultCardType?.id,
              status: "active",
              card_status: "unregistered",
              points: 0,
              total_points: 0,
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            console.log("📝 Customer data to insert:", newCustomerData);
            const { data: newCustomer, error: customerError } = await supabase.from("customers").insert([newCustomerData]).select("id, customer_code, mobile, branch_id").single();
            if (customerError) {
              console.error("❌ Failed to create customer:", customerError);
              console.error("💾 Data attempted:", newCustomerData);
              console.error("🔧 Error details:", {
                code: customerError.code,
                message: customerError.message,
                details: customerError.details,
                hint: customerError.hint
              });
              failed++;
              continue;
            }
            customer = newCustomer;
            console.log(`✅ Created new customer: ${customer.id} for mobile: ${normalizedMobile}`);
          }
          const rawPointsEarned = transaction.points_to_add || transaction.amount || 0;
          const rawPointsRedeemed = transaction.points_to_redeem || 0;
          const pointsEarned = parseFloat(rawPointsEarned.toString()) || 0;
          const pointsRedeemed = parseFloat(rawPointsRedeemed.toString()) || 0;
          console.log(`🔢 Points conversion: ${rawPointsEarned} → ${pointsEarned} earned, ${rawPointsRedeemed} → ${pointsRedeemed} redeemed`);
          const transactionData = {
            bill_no: transaction.bill_no,
            bill_date: transaction.transaction_date,
            bill_amount: transaction.amount,
            customer_id: customer.id,
            customer_mobile: normalizedMobile,
            branch_id: branchId,
            transaction_type: "upload",
            amount: transaction.amount,
            points_earned: pointsEarned,
            points_redeemed: pointsRedeemed,
            add_amt: pointsEarned,
            // Now preserves decimal values
            redeem: pointsRedeemed,
            // Now preserves decimal values
            notes: transaction.description || `Bill #${transaction.bill_no} - Excel Upload`,
            transaction_date: (/* @__PURE__ */ new Date()).toISOString(),
            status: "completed",
            created_at: (/* @__PURE__ */ new Date()).toISOString(),
            updated_at: (/* @__PURE__ */ new Date()).toISOString()
          };
          console.log(`💳 Creating transaction:`, transactionData);
          const { error: transactionError } = await supabase.from("customer_transactions").insert([transactionData]);
          if (transactionError) {
            console.error("❌ Failed to create transaction:", transactionError);
            console.error("💾 Transaction data attempted:", transactionData);
            console.error("🔧 Transaction error details:", {
              code: transactionError.code,
              message: transactionError.message,
              details: transactionError.details,
              hint: transactionError.hint
            });
            failed++;
          } else {
            processed++;
            console.log(`✅ Transaction created successfully for customer ${customer.id}`);
          }
        } catch (error) {
          console.error(`❌ Error processing transaction ${overallIndex}:`, error);
          failed++;
        }
        this.activeUploads.update((map) => {
          const existing = map.get(jobId);
          if (existing) {
            existing.progress = {
              total: transactions.length,
              processed,
              failed
            };
            console.log(`📊 Progress update: ${processed}/${transactions.length} processed, ${failed} failed`);
          }
          return map;
        });
      }
      console.log(`✅ Batch ${Math.floor(i / batchSize) + 1} completed. Progress: ${processed}/${transactions.length} (${Math.round(processed / transactions.length * 100)}%)`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (this.processingJobs.get(jobId)) {
      const finalStatus = failed === 0 ? "completed" : processed === 0 ? "failed" : "completed";
      console.log(`🏁 Upload ${finalStatus} in memory only (upload_jobs table not available)`);
      console.log(`📊 Final statistics: ${processed} processed, ${failed} failed, ${transactions.length} total`);
      console.log(`✅ Success rate: ${Math.round(processed / transactions.length * 100)}%`);
      this.activeUploads.update((map) => {
        map.delete(jobId);
        return map;
      });
      this.completedUploads.update((completed) => {
        const completedJob = {
          id: jobId,
          fileName: "Excel Upload",
          // You might want to pass the actual filename
          status: finalStatus,
          progress: {
            total: transactions.length,
            processed,
            failed
          },
          created_at: (/* @__PURE__ */ new Date()).toISOString(),
          completed_at: (/* @__PURE__ */ new Date()).toISOString(),
          error_msg: failed > 0 ? `${failed} transactions failed to process` : void 0
        };
        const updated = [completedJob, ...completed.slice(0, 19)];
        this.saveToStorage();
        return updated;
      });
      console.log(`📈 Upload completed: ${processed} processed, ${failed} failed`);
    } else {
      console.log(`⏸️ Upload processing was stopped before completion`);
    }
  }
  startPolling() {
    console.log("🚫 Upload polling skipped (using in-memory tracking only)");
    return;
  }
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isPolling = false;
  }
  async pollUploadStatus() {
    return;
  }
  async getUploadStatus(jobId) {
    let result = null;
    this.activeUploads.subscribe((map) => {
      const active = map.get(jobId);
      if (active) {
        result = {
          id: active.jobId,
          fileName: active.fileName,
          status: active.status,
          progress: active.progress,
          created_at: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
    })();
    return result;
  }
  async getRecentUploads(limit = 10) {
    try {
      let completed = [];
      this.completedUploads.subscribe((jobs) => {
        completed = jobs.slice(0, limit);
      })();
      return completed;
    } catch (error) {
      console.error("Failed to get recent uploads from storage:", error);
      return [];
    }
  }
  getStatusIcon(status) {
    switch (status) {
      case "completed":
        return "✅";
      case "failed":
        return "❌";
      case "processing":
        return "🔄";
      case "pending":
        return "⏳";
      case "paused":
        return "⏸️";
      case "cancelled":
        return "🚫";
      default:
        return "📄";
    }
  }
  getStatusColor(status) {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "failed":
        return "text-red-600";
      case "processing":
        return "text-blue-600";
      case "pending":
        return "text-yellow-600";
      case "paused":
        return "text-orange-600";
      case "cancelled":
        return "text-gray-600";
      default:
        return "text-gray-600";
    }
  }
  getProgressPercentage(job) {
    if (job.progress.total === 0) return 0;
    return Math.round(job.progress.processed / job.progress.total * 100);
  }
  // Test method for mobile number normalization
  testMobileNormalization(testNumber) {
    let normalizedMobile = testNumber.toString().replace(/\D/g, "");
    console.log(`TEST: Original mobile: ${testNumber} -> digits only: ${normalizedMobile} (length: ${normalizedMobile.length})`);
    if (normalizedMobile.length > 10) {
      if (normalizedMobile.startsWith("962") && normalizedMobile.length === 12) {
        normalizedMobile = "0" + normalizedMobile.substring(3);
        console.log(`TEST: Converted from 962 format: ${normalizedMobile}`);
      } else {
        normalizedMobile = normalizedMobile.substring(normalizedMobile.length - 10);
        console.log(`TEST: Truncated to last 10 chars: ${normalizedMobile}`);
      }
    }
    if (normalizedMobile.length === 9) {
      if (normalizedMobile.startsWith("7") || normalizedMobile.startsWith("5")) {
        normalizedMobile = "0" + normalizedMobile;
        console.log(`TEST: Added leading 0: ${normalizedMobile}`);
      }
    }
    if (normalizedMobile.length !== 10 || !normalizedMobile.startsWith("0")) {
      if (normalizedMobile.length < 10) {
        normalizedMobile = ("0000000000" + normalizedMobile).slice(-10);
        console.log(`TEST: Padded short number: ${normalizedMobile}`);
      } else {
        normalizedMobile = "0" + normalizedMobile.substring(1, 10);
        console.log(`TEST: Fixed invalid format: ${normalizedMobile}`);
      }
    }
    console.log(`TEST: Final result: ${normalizedMobile} (length: ${normalizedMobile.length})`);
    return normalizedMobile;
  }
  // Store subscriptions
  get activeUploadsStore() {
    return this.activeUploads;
  }
  get completedUploadsStore() {
    return this.completedUploads;
  }
  // Clean up
  destroy() {
    this.stopPolling();
  }
}
const uploadManager = new UploadManager();
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    uploadManager.destroy();
  });
}
export {
  uploadManager as u
};
