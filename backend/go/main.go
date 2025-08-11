package main

import (
	"log"
	"os"
	"loyalty-system/config"
	"loyalty-system/migrations"
	"loyalty-system/routes"
	"loyalty-system/services"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	// Load configuration and connect to database
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Run database migrations only if we have a database connection and migrations are not skipped
	skipMigrations := os.Getenv("SKIP_MIGRATIONS") == "true"
	if cfg.DB != nil && !skipMigrations {
		log.Println("Running database migrations...")
		if err := migrations.Migrate(cfg.DB); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
	} else if skipMigrations {
		log.Println("Skipping migrations - using existing database tables")
	} else {
		log.Println("Skipping migrations - no database connection")
	}

	// Initialize Upload Queue Service
	uploadQueue := services.NewUploadQueue(cfg.DB)
	if cfg.DB != nil {
		// Start background worker for processing upload jobs
		uploadQueue.StartWorker()
		log.Println("✅ Upload queue worker started - transactions will process in background")
	}

	// Initialize Echo
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORSWithConfig(middleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{echo.GET, echo.POST, echo.PUT, echo.DELETE, echo.OPTIONS},
		AllowHeaders: []string{echo.HeaderOrigin, echo.HeaderContentType, echo.HeaderAccept, echo.HeaderAuthorization},
	}))

	// Setup routes
	routes.SetupRoutes(e, cfg.DB, cfg.APIPrefix, uploadQueue)

	// Root endpoint
	e.GET("/", func(c echo.Context) error {
		return c.JSON(200, map[string]interface{}{
			"message": "Urban Market Loyalty System API",
			"version": "1.0.0",
			"status":  "running",
			"endpoints": map[string]string{
				"health":       cfg.APIPrefix + "/health",
				"customers":    cfg.APIPrefix + "/customers",
				"transactions": cfg.APIPrefix + "/transactions",
				"stats":        cfg.APIPrefix + "/stats",
			},
		})
	})

	// Start server
	log.Printf("🚀 Server starting on port %s", cfg.Port)
	log.Printf("📊 API endpoints available at: http://localhost:%s%s", cfg.Port, cfg.APIPrefix)
	log.Printf("💾 Database connected successfully")
	
	if err := e.Start(":" + cfg.Port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
