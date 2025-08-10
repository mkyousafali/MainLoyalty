#!/bin/bash

# Nightly Card Type Upgrade Script
# This script runs the batch card upgrade API endpoint
# Add this to your crontab to run nightly: 
# 0 2 * * * /path/to/nightly_upgrade.sh

# Configuration
API_BASE_URL="http://localhost:8080"  # Change this to your API URL
LOG_FILE="/var/log/loyalty/card_upgrades.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# Create log directory if it doesn't exist
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$DATE] Starting nightly card type upgrade process..." >> "$LOG_FILE"

# Make API call to batch upgrade all customers
response=$(curl -s -X POST "$API_BASE_URL/api/admin/card-upgrades/batch" \
  -H "Content-Type: application/json" \
  -w "HTTP_STATUS:%{http_code}")

# Extract HTTP status code and response body
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d: -f2)
response_body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

if [ "$http_status" = "200" ]; then
    echo "[$DATE] ✅ Card upgrade batch process completed successfully" >> "$LOG_FILE"
    echo "[$DATE] Response: $response_body" >> "$LOG_FILE"
else
    echo "[$DATE] ❌ Card upgrade batch process failed with HTTP status: $http_status" >> "$LOG_FILE"
    echo "[$DATE] Error response: $response_body" >> "$LOG_FILE"
    
    # Optional: Send email notification on failure
    # echo "Card upgrade failed: $response_body" | mail -s "Loyalty System Alert" admin@yourcompany.com
fi

echo "[$DATE] Nightly card type upgrade process finished." >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Optional: Clean up old log files (keep only last 30 days)
find "$(dirname "$LOG_FILE")" -name "*.log" -mtime +30 -delete 2>/dev/null || true
