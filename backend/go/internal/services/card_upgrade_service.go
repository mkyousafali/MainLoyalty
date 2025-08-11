package services

import (
	"fmt"
	"loyalty-system/models"
	"gorm.io/gorm"
)

type CardUpgradeService struct {
	db *gorm.DB
}

func NewCardUpgradeService(db *gorm.DB) *CardUpgradeService {
	return &CardUpgradeService{db: db}
}

// GetEligibleCardType finds the highest card type a customer is eligible for based on points
func (cus *CardUpgradeService) GetEligibleCardType(customerPoints float64) (*models.CardType, error) {
	var cardType models.CardType
	
	err := cus.db.Where("is_active = ? AND min_points_required <= ?", true, customerPoints).
		Order("min_points_required DESC").
		First(&cardType).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// If no card type found, get the default one (lowest points requirement)
			err = cus.db.Where("is_active = ?", true).
				Order("min_points_required ASC").
				First(&cardType).Error
		}
		return nil, err
	}
	
	return &cardType, nil
}

// UpdateCustomerCardType updates a customer's card type based on their current points
func (cus *CardUpgradeService) UpdateCustomerCardType(customerID uint, currentPoints float64) error {
	// Get eligible card type
	eligibleCardType, err := cus.GetEligibleCardType(currentPoints)
	if err != nil {
		return fmt.Errorf("failed to get eligible card type: %w", err)
	}
	
	// Get customer's current card
	var currentCard models.CustomerCard
	err = cus.db.Where("customer_id = ? AND status = ?", customerID, "active").
		First(&currentCard).Error
	
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Customer doesn't have a card, create one
			return cus.createNewCard(customerID, eligibleCardType.ID)
		}
		return fmt.Errorf("failed to get current card: %w", err)
	}
	
	// Check if upgrade is needed
	if currentCard.CardTypeID != eligibleCardType.ID {
		// Update the card type
		err = cus.db.Model(&currentCard).Update("card_type_id", eligibleCardType.ID).Error
		if err != nil {
			return fmt.Errorf("failed to update card type: %w", err)
		}
		
		// Log the upgrade (you can extend this to create a notification/log entry)
		fmt.Printf("Customer %d upgraded from card type %d to %d\n", 
			customerID, currentCard.CardTypeID, eligibleCardType.ID)
	}
	
	return nil
}

// createNewCard creates a new card for a customer
func (cus *CardUpgradeService) createNewCard(customerID uint, cardTypeID uint) error {
	// Generate a unique card number
	cardNumber, err := cus.generateCardNumber()
	if err != nil {
		return fmt.Errorf("failed to generate card number: %w", err)
	}
	
	newCard := models.CustomerCard{
		CustomerID: customerID,
		CardTypeID: cardTypeID,
		CardNumber: cardNumber,
		Status:     "active",
	}
	
	err = cus.db.Create(&newCard).Error
	if err != nil {
		return fmt.Errorf("failed to create new card: %w", err)
	}
	
	return nil
}

// generateCardNumber generates a unique card number
func (cus *CardUpgradeService) generateCardNumber() (string, error) {
	// Simple implementation - you can make this more sophisticated
	var count int64
	cus.db.Model(&models.CustomerCard{}).Count(&count)
	return fmt.Sprintf("LC%08d", count+1), nil
}

// BatchUpdateAllCustomers updates card types for all customers based on their current points
// This can be used for nightly batch processing
func (cus *CardUpgradeService) BatchUpdateAllCustomers() error {
	var customers []models.Customer
	
	// Get all active customers with their current points
	err := cus.db.Where("status = ?", "active").Find(&customers).Error
	if err != nil {
		return fmt.Errorf("failed to get customers: %w", err)
	}
	
	successCount := 0
	errorCount := 0
	
	for _, customer := range customers {
		err := cus.UpdateCustomerCardType(customer.ID, float64(customer.TotalPoints))
		if err != nil {
			fmt.Printf("Failed to update card type for customer %d: %v\n", customer.ID, err)
			errorCount++
		} else {
			successCount++
		}
	}
	
	fmt.Printf("Batch update completed: %d success, %d errors\n", successCount, errorCount)
	return nil
}

// CheckAndUpgradeCustomer is a convenience method to be called after point updates
func (cus *CardUpgradeService) CheckAndUpgradeCustomer(customerID uint) error {
	var customer models.Customer
	err := cus.db.First(&customer, customerID).Error
	if err != nil {
		return fmt.Errorf("customer not found: %w", err)
	}
	
	return cus.UpdateCustomerCardType(customerID, float64(customer.TotalPoints))
}
