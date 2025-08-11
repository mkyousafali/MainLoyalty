package handlers

import (
	"net/http"
	"loyalty-system/internal/services"
	"strconv"

	"github.com/labstack/echo/v4"
)

type CardUpgradeHandler struct {
	cardUpgradeService *services.CardUpgradeService
}

func NewCardUpgradeHandler(cardUpgradeService *services.CardUpgradeService) *CardUpgradeHandler {
	return &CardUpgradeHandler{cardUpgradeService: cardUpgradeService}
}

// POST /api/admin/card-upgrades/batch - Run batch card type upgrades for all customers
func (cuh *CardUpgradeHandler) BatchUpgradeAllCustomers(c echo.Context) error {
	err := cuh.cardUpgradeService.BatchUpdateAllCustomers()
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to run batch upgrade: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Batch card type upgrade completed successfully",
	})
}

// POST /api/admin/card-upgrades/customer/:customer_id - Check and upgrade specific customer
func (cuh *CardUpgradeHandler) UpgradeCustomer(c echo.Context) error {
	customerIDStr := c.Param("customer_id")
	if customerIDStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Customer ID is required",
		})
	}

	// Convert string to uint
	customerID, err := strconv.ParseUint(customerIDStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid customer ID format",
		})
	}

	err = cuh.cardUpgradeService.CheckAndUpgradeCustomer(uint(customerID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to upgrade customer: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Customer card type checked and upgraded if eligible",
	})
}

// GET /api/admin/card-upgrades/eligible/:customer_id - Check what card type customer is eligible for
func (cuh *CardUpgradeHandler) GetEligibleCardType(c echo.Context) error {
	customerIDStr := c.Param("customer_id")
	if customerIDStr == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Customer ID is required",
		})
	}

	// Convert string to uint
	customerID, err := strconv.ParseUint(customerIDStr, 10, 64)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error": "Invalid customer ID format",
		})
	}

	// Check customer and upgrade
	err = cuh.cardUpgradeService.CheckAndUpgradeCustomer(uint(customerID))
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error": "Failed to upgrade customer: " + err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"customer_id": customerID,
		"message":     "Customer card upgrade processed successfully",
	})
}
