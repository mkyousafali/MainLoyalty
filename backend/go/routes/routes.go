package routes

import (
	"loyalty-system/handlers"
	"loyalty-system/services"

	"github.com/labstack/echo/v4"
	"gorm.io/gorm"
)

// SetupRoutes configures all API routes
func SetupRoutes(e *echo.Echo, db *gorm.DB, apiPrefix string, uploadQueue *services.UploadQueue) {
	// Create route group with API prefix
	api := e.Group(apiPrefix)

	// Add CORS and other middleware
	api.Use(func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			c.Response().Header().Set("Access-Control-Allow-Origin", "*")
			c.Response().Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			c.Response().Header().Set("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			
			if c.Request().Method == "OPTIONS" {
				return c.NoContent(204)
			}
			
			return next(c)
		}
	})

	// Initialize handlers
	customerHandler := &handlers.CustomerHandler{DB: db}
	transactionHandler := &handlers.TransactionHandler{DB: db}
	uploadHandler := handlers.NewUploadHandler(uploadQueue)

	// Health check endpoint
	api.GET("/health", func(c echo.Context) error {
		return c.JSON(200, map[string]string{
			"status":  "healthy",
			"message": "Loyalty System API is running",
		})
	})

	// Upload queue routes
	uploads := api.Group("/uploads")
	{
		uploads.POST("/queue", uploadHandler.QueueUpload)
		uploads.GET("/status/:job_id", uploadHandler.GetJobStatus)
		uploads.GET("/jobs", uploadHandler.GetUserJobs)
		uploads.DELETE("/cancel/:job_id", uploadHandler.CancelJob)
	}

	// Customer routes
	customers := api.Group("/customers")
	{
		customers.GET("", customerHandler.GetCustomers)
		customers.GET("/:id", customerHandler.GetCustomer)
		customers.POST("", customerHandler.CreateCustomer)
		customers.PUT("/:id", customerHandler.UpdateCustomer)
		customers.DELETE("/:id", customerHandler.DeleteCustomer)
	}

	// Transaction routes
	transactions := api.Group("/transactions")
	{
		transactions.GET("", transactionHandler.GetTransactions)
		transactions.GET("/:id", transactionHandler.GetTransaction)
		transactions.POST("", transactionHandler.CreateTransaction)
		transactions.DELETE("/clear", transactionHandler.ClearTransactions)
	}

	// Additional utility routes
	api.GET("/stats", getSystemStats(db))
}

// getSystemStats returns system statistics
func getSystemStats(db *gorm.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var customerCount int64
		var transactionCount int64
		var totalAmount float64

		// Count customers
		db.Raw("SELECT COUNT(*) FROM customer_numbers").Scan(&customerCount)

		// Count transactions
		db.Raw("SELECT COUNT(*) FROM customer_transactions").Scan(&transactionCount)

		// Sum total amount
		db.Raw("SELECT COALESCE(SUM(amount), 0) FROM customer_transactions").Scan(&totalAmount)

		return c.JSON(200, map[string]interface{}{
			"customers": map[string]interface{}{
				"total": customerCount,
			},
			"transactions": map[string]interface{}{
				"total":        transactionCount,
				"total_amount": totalAmount,
			},
		})
	}
}
