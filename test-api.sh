#!/bin/bash

# API Testing Script for Health District Application
# This script tests the authentication and external submission endpoints

# Configuration
BASE_URL="https://health-dist-app.vercel.app"
# For local testing, use: BASE_URL="http://localhost:3000"

echo "🧪 Testing Health District Application API"
echo "=========================================="
echo ""

# Test 1: Get API Information
echo "📋 Test 1: Get External API Information"
echo "--------------------------------------"
curl -X GET "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 2: Test Authentication with Wrong Password
echo "🔐 Test 2: Authentication with Wrong Password"
echo "--------------------------------------------"
curl -X POST "${BASE_URL}/api/auth/check-password" \
  -H "Content-Type: application/json" \
  -d '{"password": "wrongpassword"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 3: Test Authentication with Correct Password
echo "🔐 Test 3: Authentication with Correct Password"
echo "-----------------------------------------------"
curl -X POST "${BASE_URL}/api/auth/check-password" \
  -H "Content-Type: application/json" \
  -d '{"password": "demo2024"}' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 4: Submit Application with Minimal Data
echo "📝 Test 4: Submit Application (Minimal Data)"
echo "-------------------------------------------"
curl -X POST "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentName": "Test Restaurant",
    "streetAddress": "123 Test St, Test City, TC 12345",
    "establishmentPhone": "5551234567",
    "establishmentEmail": "test@restaurant.com",
    "ownerName": "John Doe",
    "ownerPhone": "5559876543",
    "ownerEmail": "john.doe@email.com",
    "establishmentType": "restaurant",
    "plannedOpeningDate": "2024-06-01"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 5: Submit Application with External System Metadata
echo "📝 Test 5: Submit Application (With External Metadata)"
echo "-----------------------------------------------------"
curl -X POST "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentName": "Joe'\''s Pizza",
    "streetAddress": "456 Main St, Riverside, CA 92501",
    "establishmentPhone": "5551234567",
    "establishmentEmail": "joe@pizza.com",
    "ownerName": "Joe Smith",
    "ownerPhone": "5559876543",
    "ownerEmail": "joe.smith@email.com",
    "establishmentType": "restaurant",
    "plannedOpeningDate": "2024-07-15",
    "externalId": "EXT-2024-001",
    "sourceSystem": "City Permits System",
    "submissionNotes": "Submitted via automated integration test"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 6: Submit Application with Validation Errors
echo "❌ Test 6: Submit Application (Validation Errors)"
echo "-----------------------------------------------"
curl -X POST "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentName": "",
    "streetAddress": "123 Test St",
    "establishmentPhone": "123",
    "establishmentEmail": "invalid-email",
    "ownerName": "John",
    "ownerPhone": "456",
    "ownerEmail": "invalid",
    "establishmentType": "invalid_type",
    "plannedOpeningDate": "invalid-date"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

# Test 7: Submit Application with Different Establishment Types
echo "🏪 Test 7: Submit Application (Food Truck)"
echo "----------------------------------------"
curl -X POST "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentName": "Mario'\''s Mobile Pizza",
    "streetAddress": "789 Food Truck Lane, Riverside, CA 92502",
    "establishmentPhone": "5555551234",
    "establishmentEmail": "mario@mobilepizza.com",
    "ownerName": "Mario Rossi",
    "ownerPhone": "5555559876",
    "ownerEmail": "mario.rossi@email.com",
    "establishmentType": "food_truck",
    "plannedOpeningDate": "2024-08-01",
    "externalId": "FT-2024-001",
    "sourceSystem": "Mobile Vendor System",
    "submissionNotes": "Food truck permit application"
  }' \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"
echo ""

echo "✅ API Testing Complete!"
echo "========================"
echo ""
echo "Note: If you're testing locally, make sure to:"
echo "1. Set PAGE_PASSWORD environment variable"
echo "2. Update BASE_URL to 'http://localhost:3000'"
echo "3. Ensure the database is running"
echo ""
echo "For production testing, the PAGE_PASSWORD should be set in Vercel environment variables."
