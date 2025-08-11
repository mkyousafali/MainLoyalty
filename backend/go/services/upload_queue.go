package services

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UploadJob struct {
	ID          string                 `json:"id"`
	UserID      string                 `json:"user_id"`
	BranchID    string                 `json:"branch_id"`
	FileName    string                 `json:"file_name"`
	Status      string                 `json:"status"` // pending, processing, completed, failed
	Progress    UploadProgress         `json:"progress"`
	Data        []TransactionRecord    `json:"data"`
	ErrorMsg    string                 `json:"error_msg,omitempty"`
	CreatedAt   time.Time              `json:"created_at"`
	StartedAt   *time.Time             `json:"started_at,omitempty"`
	CompletedAt *time.Time             `json:"completed_at,omitempty"`
}

type UploadProgress struct {
	Processed int `json:"processed"`
	Total     int `json:"total"`
	Failed    int `json:"failed"`
	Skipped   int `json:"skipped"`
}

type TransactionRecord struct {
	CustomerMobile string  `json:"customer_mobile"`
	Amount         float64 `json:"amount"`
	TransactionID  string  `json:"transaction_id,omitempty"`
	Date           string  `json:"date,omitempty"`
	Notes          string  `json:"notes,omitempty"`
}

type UploadQueue struct {
	db *gorm.DB
}

func NewUploadQueue(db *gorm.DB) *UploadQueue {
	return &UploadQueue{db: db}
}

// QueueUpload adds a new upload job to the queue
func (uq *UploadQueue) QueueUpload(userID, branchID, fileName string, data []TransactionRecord) (string, error) {
	jobID := uuid.New().String()
	
	job := UploadJob{
		ID:        jobID,
		UserID:    userID,
		BranchID:  branchID,
		FileName:  fileName,
		Status:    "pending",
		Progress:  UploadProgress{Total: len(data), Processed: 0, Failed: 0, Skipped: 0},
		Data:      data,
		CreatedAt: time.Now(),
	}
	
	dataJSON, err := json.Marshal(data)
	if err != nil {
		return "", fmt.Errorf("failed to marshal data: %v", err)
	}
	
	progressJSON, err := json.Marshal(job.Progress)
	if err != nil {
		return "", fmt.Errorf("failed to marshal progress: %v", err)
	}
	
	// Use raw SQL for now since upload_jobs table structure is known
	err = uq.db.Exec(`
		INSERT INTO upload_jobs (id, user_id, branch_id, file_name, status, progress, data, created_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
	`, jobID, userID, branchID, fileName, "pending", string(progressJSON), string(dataJSON), job.CreatedAt).Error
	
	if err != nil {
		return "", fmt.Errorf("failed to insert upload job: %v", err)
	}
	
	log.Printf("✅ Queued upload job: %s (%s) with %d transactions", jobID, fileName, len(data))
	return jobID, nil
}

// GetJobStatus returns the current status of an upload job
func (uq *UploadQueue) GetJobStatus(jobID string) (*UploadJob, error) {
	var job UploadJob
	var progressJSON string
	
	err := uq.db.Raw(`
		SELECT id, user_id, branch_id, file_name, status, progress, error_msg, created_at, started_at, completed_at
		FROM upload_jobs 
		WHERE id = ?
	`, jobID).Row().Scan(
		&job.ID, &job.UserID, &job.BranchID, &job.FileName, 
		&job.Status, &progressJSON, &job.ErrorMsg, &job.CreatedAt,
		&job.StartedAt, &job.CompletedAt,
	)
	
	if err != nil {
		return nil, fmt.Errorf("failed to get job status: %v", err)
	}
	
	err = json.Unmarshal([]byte(progressJSON), &job.Progress)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal progress: %v", err)
	}
	
	return &job, nil
}

// GetUserJobs returns all upload jobs for a user
func (uq *UploadQueue) GetUserJobs(userID string) ([]UploadJob, error) {
	var jobs []UploadJob
	
	// Use raw SQL with GORM for complex queries
	rows, err := uq.db.Raw(`
		SELECT id, user_id, branch_id, file_name, status, progress, error_msg, created_at, started_at, completed_at
		FROM upload_jobs 
		WHERE user_id = ?
		ORDER BY created_at DESC
	`, userID).Rows()
	
	if err != nil {
		return nil, fmt.Errorf("failed to get user jobs: %v", err)
	}
	defer rows.Close()
	
	for rows.Next() {
		var job UploadJob
		var progressJSON string
		
		err := rows.Scan(
			&job.ID, &job.UserID, &job.BranchID, &job.FileName,
			&job.Status, &progressJSON, &job.ErrorMsg, &job.CreatedAt,
			&job.StartedAt, &job.CompletedAt,
		)
		if err != nil {
			continue
		}
		
		json.Unmarshal([]byte(progressJSON), &job.Progress)
		jobs = append(jobs, job)
	}
	
	return jobs, nil
}

// GetPendingJobs returns all pending upload jobs
func (uq *UploadQueue) GetPendingJobs() ([]UploadJob, error) {
	var jobs []UploadJob
	
	rows, err := uq.db.Raw(`
		SELECT id, user_id, branch_id, file_name, status, progress, data, created_at
		FROM upload_jobs 
		WHERE status = 'pending'
		ORDER BY created_at ASC
		LIMIT 10
	`).Rows()
	
	if err != nil {
		return nil, fmt.Errorf("failed to get pending jobs: %v", err)
	}
	defer rows.Close()
	
	for rows.Next() {
		var job UploadJob
		var progressJSON, dataJSON string
		
		err := rows.Scan(
			&job.ID, &job.UserID, &job.BranchID, &job.FileName,
			&job.Status, &progressJSON, &dataJSON, &job.CreatedAt,
		)
		if err != nil {
			continue
		}
		
		json.Unmarshal([]byte(progressJSON), &job.Progress)
		json.Unmarshal([]byte(dataJSON), &job.Data)
		jobs = append(jobs, job)
	}
	
	return jobs, nil
}

// UpdateJobStatus updates the status and progress of an upload job
func (uq *UploadQueue) UpdateJobStatus(jobID, status string, progress *UploadProgress, errorMsg string) error {
	progressJSON, _ := json.Marshal(progress)
	
	if status == "processing" {
		return uq.db.Exec(`
			UPDATE upload_jobs 
			SET status = ?, progress = ?, started_at = ?, error_msg = ?
			WHERE id = ?
		`, status, string(progressJSON), time.Now(), errorMsg, jobID).Error
	} else if status == "completed" || status == "failed" {
		return uq.db.Exec(`
			UPDATE upload_jobs 
			SET status = ?, progress = ?, completed_at = ?, error_msg = ?
			WHERE id = ?
		`, status, string(progressJSON), time.Now(), errorMsg, jobID).Error
	} else {
		return uq.db.Exec(`
			UPDATE upload_jobs 
			SET status = ?, progress = ?, error_msg = ?
			WHERE id = ?
		`, status, string(progressJSON), errorMsg, jobID).Error
	}
}

// StartWorker starts the background worker to process upload jobs
func (uq *UploadQueue) StartWorker() {
	log.Println("🚀 Starting upload queue worker...")
	
	go func() {
		for {
			jobs, err := uq.GetPendingJobs()
			if err != nil {
				log.Printf("❌ Error getting pending jobs: %v", err)
				time.Sleep(5 * time.Second)
				continue
			}
			
			for _, job := range jobs {
				go uq.processJob(job)
			}
			
			time.Sleep(2 * time.Second)
		}
	}()
}

// processJob processes a single upload job
func (uq *UploadQueue) processJob(job UploadJob) {
	log.Printf("🔄 Processing job: %s (%s)", job.ID, job.FileName)
	
	// Mark as processing
	progress := job.Progress
	uq.UpdateJobStatus(job.ID, "processing", &progress, "")
	
	// Process in batches
	batchSize := 100
	for i := 0; i < len(job.Data); i += batchSize {
		end := i + batchSize
		if end > len(job.Data) {
			end = len(job.Data)
		}
		
		batch := job.Data[i:end]
		processed, failed, err := uq.processBatch(job.BranchID, batch)
		
		progress.Processed += processed
		progress.Failed += failed
		
		var errorMsg string
		if err != nil {
			errorMsg = err.Error()
			log.Printf("⚠️ Batch error for job %s: %v", job.ID, err)
		}
		
		// Update progress
		uq.UpdateJobStatus(job.ID, "processing", &progress, errorMsg)
		
		log.Printf("📊 Job %s progress: %d/%d (failed: %d)", 
			job.ID, progress.Processed, progress.Total, progress.Failed)
	}
	
	// Mark as completed
	finalStatus := "completed"
	if progress.Failed > 0 && progress.Processed == 0 {
		finalStatus = "failed"
	}
	
	uq.UpdateJobStatus(job.ID, finalStatus, &progress, "")
	log.Printf("✅ Job completed: %s - Status: %s (Processed: %d, Failed: %d)", 
		job.ID, finalStatus, progress.Processed, progress.Failed)
}

// processBatch processes a batch of transactions
func (uq *UploadQueue) processBatch(branchID string, transactions []TransactionRecord) (processed, failed int, err error) {
	for _, transaction := range transactions {
		err := uq.processTransaction(branchID, transaction)
		if err != nil {
			failed++
			log.Printf("❌ Failed to process transaction for mobile %s: %v", 
				transaction.CustomerMobile, err)
		} else {
			processed++
		}
		
		// Small delay to prevent overwhelming the database
		time.Sleep(10 * time.Millisecond)
	}
	
	return processed, failed, nil
}

// processTransaction processes a single transaction
func (uq *UploadQueue) processTransaction(branchID string, transaction TransactionRecord) error {
	// First, check if customer exists or create them
	customerID, err := uq.getOrCreateCustomer(transaction.CustomerMobile, branchID)
	if err != nil {
		return fmt.Errorf("failed to get/create customer: %v", err)
	}
	
	// Insert transaction
	err = uq.db.Exec(`
		INSERT INTO customer_transactions 
		(customer_id, branch_id, amount, transaction_date, notes, created_at)
		VALUES (?, ?, ?, COALESCE(?, NOW()), ?, NOW())
	`, customerID, branchID, transaction.Amount, transaction.Date, transaction.Notes).Error
	
	if err != nil {
		return fmt.Errorf("failed to insert transaction: %v", err)
	}
	
	return nil
}

// getOrCreateCustomer gets existing customer or creates a new one
func (uq *UploadQueue) getOrCreateCustomer(mobile, branchID string) (string, error) {
	// Check if customer exists
	var customerID string
	err := uq.db.Raw(`
		SELECT customer_id FROM customer_numbers 
		WHERE mobile_number = ? AND branch_id = ?
	`, mobile, branchID).Scan(&customerID).Error
	
	if err == nil && customerID != "" {
		return customerID, nil
	}
	
	if err != nil && err != gorm.ErrRecordNotFound {
		return "", fmt.Errorf("error checking customer: %v", err)
	}
	
	// Customer doesn't exist, create new one
	customerID = uuid.New().String()
	
	// Insert into customer_numbers table
	err = uq.db.Exec(`
		INSERT INTO customer_numbers (customer_id, mobile_number, branch_id, created_at)
		VALUES (?, ?, ?, NOW())
	`, customerID, mobile, branchID).Error
	
	if err != nil {
		return "", fmt.Errorf("failed to create customer: %v", err)
	}
	
	return customerID, nil
}
