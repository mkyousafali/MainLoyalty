package models

import (
	"time"
	"gorm.io/gorm"
)

// BaseModel contains common columns for all tables
type BaseModel struct {
	ID        uint           `json:"id" gorm:"primarykey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at" gorm:"index"`
}

// Customer represents the customers table
type Customer struct {
	BaseModel
	CustomerCode         string     `json:"customer_code" gorm:"uniqueIndex;size:20;not null"`
	FirstName           string     `json:"first_name" gorm:"size:50;not null"`
	LastName            string     `json:"last_name" gorm:"size:50;not null"`
	FullName            string     `json:"full_name" gorm:"size:100;->;<-:create"`
	Email               *string    `json:"email" gorm:"uniqueIndex;size:100"`
	Phone               string     `json:"phone" gorm:"uniqueIndex;size:20;not null"`
	DateOfBirth         *time.Time `json:"date_of_birth" gorm:"type:date"`
	Gender              *string    `json:"gender" gorm:"size:10;check:gender IN ('male','female','other')"`
	Nationality         *string    `json:"nationality" gorm:"size:50"`
	IDNumber            *string    `json:"id_number" gorm:"uniqueIndex;size:20"`
	Address             *string    `json:"address" gorm:"type:text"`
	City                *string    `json:"city" gorm:"size:50"`
	Region              *string    `json:"region" gorm:"size:50"`
	PostalCode          *string    `json:"postal_code" gorm:"size:20"`
	RegistrationBranchID *uint     `json:"registration_branch_id"`
	PreferredLanguage   string     `json:"preferred_language" gorm:"size:2;default:ar;check:preferred_language IN ('en','ar')"`
	IsActive            bool       `json:"is_active" gorm:"default:true"`
	IsVerified          bool       `json:"is_verified" gorm:"default:false"`
	VerificationCode    *string    `json:"verification_code" gorm:"size:10"`
	VerificationExpiresAt *time.Time `json:"verification_expires_at"`
	TotalPoints         float64    `json:"total_points" gorm:"type:decimal(15,3);default:0.000"`
	LifetimePoints      float64    `json:"lifetime_points" gorm:"type:decimal(15,3);default:0.000"`
	LastTransactionDate *time.Time `json:"last_transaction_date"`

	// Relationships
	RegistrationBranch *Branch            `json:"registration_branch,omitempty" gorm:"foreignKey:RegistrationBranchID"`
	Cards             []CustomerCard     `json:"cards,omitempty" gorm:"foreignKey:CustomerID"`
	Transactions      []CustomerTransaction `json:"transactions,omitempty" gorm:"foreignKey:CustomerID"`
}

// BeforeCreate hook to generate full name
func (c *Customer) BeforeCreate(tx *gorm.DB) error {
	c.FullName = c.FirstName + " " + c.LastName
	return nil
}

// BeforeUpdate hook to update full name
func (c *Customer) BeforeUpdate(tx *gorm.DB) error {
	if tx.Statement.Changed("FirstName") || tx.Statement.Changed("LastName") {
		c.FullName = c.FirstName + " " + c.LastName
	}
	return nil
}

// Branch represents the branches table
type Branch struct {
	BaseModel
	BranchCode   string  `json:"branch_code" gorm:"uniqueIndex;size:20;not null"`
	NameEn       string  `json:"name_en" gorm:"size:100;not null"`
	NameAr       string  `json:"name_ar" gorm:"size:100;not null"`
	AddressEn    *string `json:"address_en" gorm:"type:text"`
	AddressAr    *string `json:"address_ar" gorm:"type:text"`
	City         *string `json:"city" gorm:"size:50"`
	Region       *string `json:"region" gorm:"size:50"`
	PostalCode   *string `json:"postal_code" gorm:"size:20"`
	Country      string  `json:"country" gorm:"size:50;default:'Saudi Arabia'"`
	Phone        *string `json:"phone" gorm:"size:20"`
	Email        *string `json:"email" gorm:"size:100"`
	ManagerName  *string `json:"manager_name" gorm:"size:100"`
	Latitude     *float64 `json:"latitude" gorm:"type:decimal(10,8)"`
	Longitude    *float64 `json:"longitude" gorm:"type:decimal(11,8)"`
	WorkingHours *string `json:"working_hours" gorm:"type:json"`
	IsActive     bool    `json:"is_active" gorm:"default:true"`

	// Relationships
	Customers    []Customer    `json:"customers,omitempty" gorm:"foreignKey:RegistrationBranchID"`
	Transactions []CustomerTransaction `json:"transactions,omitempty" gorm:"foreignKey:BranchID"`
}

// CardType represents the card_types table
type CardType struct {
	BaseModel
	NameEn              string   `json:"name_en" gorm:"size:50;not null"`
	NameAr              string   `json:"name_ar" gorm:"size:50;not null"`
	DescriptionEn       *string  `json:"description_en" gorm:"type:text"`
	DescriptionAr       *string  `json:"description_ar" gorm:"type:text"`
	ColorCode           string   `json:"color_code" gorm:"size:7;default:#000000"`
	Icon                *string  `json:"icon" gorm:"size:50"`
	MinPointsRequired   float64  `json:"min_points_required" gorm:"type:decimal(15,3);default:0.000"`
	MaxPointsLimit      *float64 `json:"max_points_limit" gorm:"type:decimal(15,3)"`
	PointsMultiplier    float64  `json:"points_multiplier" gorm:"type:decimal(5,3);default:1.000"`
	ValidityMonths      int      `json:"validity_months" gorm:"default:12"`
	Benefits            *string  `json:"benefits" gorm:"type:json"`
	IsActive            bool     `json:"is_active" gorm:"default:true"`
	SortOrder           int      `json:"sort_order" gorm:"default:0"`

	// Relationships
	CustomerCards []CustomerCard `json:"customer_cards,omitempty" gorm:"foreignKey:CardTypeID"`
}

// CustomerCard represents the customer_cards table
type CustomerCard struct {
	BaseModel
	CustomerID       uint      `json:"customer_id" gorm:"not null"`
	CardTypeID       uint      `json:"card_type_id" gorm:"not null"`
	CardNumber       string    `json:"card_number" gorm:"uniqueIndex;size:20;not null"`
	IssueDate        time.Time `json:"issue_date" gorm:"type:date;not null"`
	ExpiryDate       time.Time `json:"expiry_date" gorm:"type:date;not null"`
	Status           string    `json:"status" gorm:"size:20;default:active;check:status IN ('active','expired','suspended','cancelled')"`
	IssuedBy         *uint     `json:"issued_by"`
	IssuedAtBranchID *uint     `json:"issued_at_branch_id"`
	Notes            *string   `json:"notes" gorm:"type:text"`

	// Relationships
	Customer        Customer  `json:"customer" gorm:"foreignKey:CustomerID"`
	CardType        CardType  `json:"card_type" gorm:"foreignKey:CardTypeID"`
	IssuedAtBranch  *Branch   `json:"issued_at_branch,omitempty" gorm:"foreignKey:IssuedAtBranchID"`
	Transactions    []CustomerTransaction `json:"transactions,omitempty" gorm:"foreignKey:CardID"`
}

// RewardCategory represents the reward_categories table
type RewardCategory struct {
	BaseModel
	NameEn        string  `json:"name_en" gorm:"size:50;not null"`
	NameAr        string  `json:"name_ar" gorm:"size:50;not null"`
	DescriptionEn *string `json:"description_en" gorm:"type:text"`
	DescriptionAr *string `json:"description_ar" gorm:"type:text"`
	Icon          *string `json:"icon" gorm:"size:50"`
	ColorCode     string  `json:"color_code" gorm:"size:7;default:#000000"`
	PointsRate    float64 `json:"points_rate" gorm:"type:decimal(5,3);default:1.000"`
	IsActive      bool    `json:"is_active" gorm:"default:true"`
	SortOrder     int     `json:"sort_order" gorm:"default:0"`

	// Relationships
	Transactions []CustomerTransaction `json:"transactions,omitempty" gorm:"foreignKey:CategoryID"`
}

// CustomerTransaction represents the customer_transactions table
type CustomerTransaction struct {
	BaseModel
	TransactionID       string    `json:"transaction_id" gorm:"uniqueIndex;size:50;not null"`
	CustomerID          uint      `json:"customer_id" gorm:"not null"`
	BranchID            uint      `json:"branch_id" gorm:"not null"`
	CardID              *uint     `json:"card_id"`
	TransactionType     string    `json:"transaction_type" gorm:"size:30;not null;check:transaction_type IN ('purchase','return','points_redemption','points_adjustment')"`
	Amount              float64   `json:"amount" gorm:"type:decimal(15,3);not null;default:0.000"`
	PointsEarned        float64   `json:"points_earned" gorm:"type:decimal(15,3);default:0.000"`
	PointsRedeemed      float64   `json:"points_redeemed" gorm:"type:decimal(15,3);default:0.000"`
	PointsBalanceBefore float64   `json:"points_balance_before" gorm:"type:decimal(15,3);default:0.000"`
	PointsBalanceAfter  float64   `json:"points_balance_after" gorm:"type:decimal(15,3);default:0.000"`
	PaymentMethod       *string   `json:"payment_method" gorm:"size:50"`
	ReceiptNumber       *string   `json:"receipt_number" gorm:"size:50"`
	CashierID           *uint     `json:"cashier_id"`
	CategoryID          *uint     `json:"category_id"`
	Items               *string   `json:"items" gorm:"type:json"`
	Notes               *string   `json:"notes" gorm:"type:text"`
	ProcessedAt         time.Time `json:"processed_at" gorm:"default:CURRENT_TIMESTAMP"`

	// Relationships
	Customer Customer        `json:"customer" gorm:"foreignKey:CustomerID"`
	Branch   Branch          `json:"branch" gorm:"foreignKey:BranchID"`
	Card     *CustomerCard   `json:"card,omitempty" gorm:"foreignKey:CardID"`
	Category *RewardCategory `json:"category,omitempty" gorm:"foreignKey:CategoryID"`
}

// AdminUser represents the admin_users table (simplified)
type AdminUser struct {
	BaseModel
	Username     string     `json:"username" gorm:"uniqueIndex;size:50;not null"`
	Email        string     `json:"email" gorm:"uniqueIndex;size:100;not null"`
	PasswordHash string     `json:"-" gorm:"size:255;not null"`
	FullName     string     `json:"full_name" gorm:"size:100;not null"`
	Phone        *string    `json:"phone" gorm:"size:20"`
	RoleID       uint       `json:"role_id" gorm:"not null"`
	IsActive     bool       `json:"is_active" gorm:"default:true"`
	LastLogin    *time.Time `json:"last_login"`
	LoginAttempts int       `json:"login_attempts" gorm:"default:0"`
	LockedUntil  *time.Time `json:"locked_until"`
}

// Role represents the roles table (simplified)
type Role struct {
	BaseModel
	Name          string `json:"name" gorm:"uniqueIndex;size:50;not null"`
	DisplayName   string `json:"display_name" gorm:"size:100;not null"`
	Description   *string `json:"description" gorm:"type:text"`
	IsMasterAdmin bool   `json:"is_master_admin" gorm:"default:false"`
	IsActive      bool   `json:"is_active" gorm:"default:true"`

	// Relationships
	AdminUsers []AdminUser `json:"admin_users,omitempty" gorm:"foreignKey:RoleID"`
}
