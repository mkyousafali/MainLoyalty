package handlers

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"loyalty-system/services"
)

type UploadHandler struct {
	uploadQueue *services.UploadQueue
}

func NewUploadHandler(uploadQueue *services.UploadQueue) *UploadHandler {
	return &UploadHandler{
		uploadQueue: uploadQueue,
	}
}

type QueueUploadRequest struct {
	BranchID     string                        `json:"branch_id" binding:"required"`
	FileName     string                        `json:"file_name" binding:"required"`
	Transactions []services.TransactionRecord  `json:"transactions" binding:"required"`
}

type QueueUploadResponse struct {
	JobID   string `json:"job_id"`
	Status  string `json:"status"`
	Message string `json:"message"`
}

// QueueUpload queues a new upload job
func (h *UploadHandler) QueueUpload(c echo.Context) error {
	var req QueueUploadRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":   "Invalid request",
			"details": err.Error(),
		})
	}

	// For now, use a default user ID (TODO: implement proper auth)
	userID := "system_user"

	jobID, err := h.uploadQueue.QueueUpload(
		userID,
		req.BranchID,
		req.FileName,
		req.Transactions,
	)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "Failed to queue upload",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, QueueUploadResponse{
		JobID:   jobID,
		Status:  "queued",
		Message: "Upload job queued successfully",
	})
}

// GetJobStatus returns the status of an upload job
func (h *UploadHandler) GetJobStatus(c echo.Context) error {
	jobID := c.Param("job_id")
	if jobID == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Job ID is required",
		})
	}

	job, err := h.uploadQueue.GetJobStatus(jobID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error":   "Job not found",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, job)
}

// GetUserJobs returns all upload jobs for the authenticated user
func (h *UploadHandler) GetUserJobs(c echo.Context) error {
	// For now, use a default user ID (TODO: implement proper auth)
	userID := "system_user"

	jobs, err := h.uploadQueue.GetUserJobs(userID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "Failed to get user jobs",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"jobs":  jobs,
		"count": len(jobs),
	})
}

// CancelJob cancels a pending upload job
func (h *UploadHandler) CancelJob(c echo.Context) error {
	jobID := c.Param("job_id")
	if jobID == "" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error": "Job ID is required",
		})
	}

	// Check if job exists and is pending
	job, err := h.uploadQueue.GetJobStatus(jobID)
	if err != nil {
		return c.JSON(http.StatusNotFound, map[string]interface{}{
			"error": "Job not found",
		})
	}

	if job.Status != "pending" {
		return c.JSON(http.StatusBadRequest, map[string]interface{}{
			"error":  "Can only cancel pending jobs",
			"status": job.Status,
		})
	}

	// Update job status to cancelled
	err = h.uploadQueue.UpdateJobStatus(jobID, "cancelled", &job.Progress, "Cancelled by user")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]interface{}{
			"error":   "Failed to cancel job",
			"details": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"message": "Job cancelled successfully",
		"job_id":  jobID,
	})
}
