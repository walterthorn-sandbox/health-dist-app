# API Testing with cURL

This document provides cURL commands to test the Health District Application API endpoints.

## Base Configuration

```bash
# For production
BASE_URL="https://health-dist-app.vercel.app"

# For local development
BASE_URL="http://localhost:3000"
```

## 1. Authentication Endpoint

### Test with Wrong Password
```bash
curl -X POST "${BASE_URL}/api/auth/check-password" \
  -H "Content-Type: application/json" \
  -d '{"password": "wrongpassword"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Test with Correct Password
```bash
curl -X POST "${BASE_URL}/api/auth/check-password" \
  -H "Content-Type: application/json" \
  -d '{"password": "demo2024"}' \
  -w "\nHTTP Status: %{http_code}\n"
```

## 2. External API Information

### Get API Documentation
```bash
curl -X GET "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

## 3. Application Submission

### Minimal Application (Required Fields Only)
```bash
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
  -w "\nHTTP Status: %{http_code}\n"
```

### Complete Application with External Metadata
```bash
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
    "submissionNotes": "Submitted via automated integration"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

### Food Truck Application
```bash
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
  -w "\nHTTP Status: %{http_code}\n"
```

### Bakery Application
```bash
curl -X POST "${BASE_URL}/api/applications/submit" \
  -H "Content-Type: application/json" \
  -d '{
    "establishmentName": "Sweet Dreams Bakery",
    "streetAddress": "321 Baker St, Riverside, CA 92503",
    "establishmentPhone": "5551112222",
    "establishmentEmail": "info@sweetdreamsbakery.com",
    "ownerName": "Sarah Johnson",
    "ownerPhone": "5553334444",
    "ownerEmail": "sarah.johnson@email.com",
    "establishmentType": "bakery",
    "plannedOpeningDate": "2024-09-01",
    "externalId": "BAK-2024-001",
    "sourceSystem": "Bakery Licensing System",
    "submissionNotes": "Artisan bakery permit application"
  }' \
  -w "\nHTTP Status: %{http_code}\n"
```

## 4. Validation Error Testing

### Test with Invalid Data
```bash
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
  -w "\nHTTP Status: %{http_code}\n"
```

## 5. Other API Endpoints

### Get All Applications
```bash
curl -X GET "${BASE_URL}/api/applications" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

### Get Applications with Filters
```bash
curl -X GET "${BASE_URL}/api/applications?limit=10&submissionChannel=external_api" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

## Expected Responses

### Successful Authentication
```json
{
  "success": true
}
```

### Successful Application Submission
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "trackingId": "FP-2024-001234",
  "application": {
    "id": "FP-2024-001234",
    "establishmentName": "Joe's Pizza",
    "submissionChannel": "external_api",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "externalReference": {
    "externalId": "EXT-2024-001",
    "sourceSystem": "City Permits System"
  }
}
```

### Validation Error Response
```json
{
  "error": "Validation failed",
  "details": {
    "establishmentName": ["Establishment name is required"],
    "establishmentPhone": ["Phone number must be exactly 10 digits"],
    "establishmentEmail": ["Please enter a valid email address"]
  },
  "message": "Please check the request body and ensure all required fields are provided with valid values"
}
```

## Environment Setup

### For Local Testing
1. Set the `PAGE_PASSWORD` environment variable:
   ```bash
   export PAGE_PASSWORD="your-secure-password"
   ```

2. Update the BASE_URL in the commands:
   ```bash
   BASE_URL="http://localhost:3000"
   ```

### For Production Testing
1. Set `PAGE_PASSWORD` in Vercel environment variables
2. Use the production URL:
   ```bash
   BASE_URL="https://health-dist-app.vercel.app"
   ```

## Tips

- Use `jq` for pretty-printing JSON responses: `| jq '.'`
- Add `-v` flag to curl for verbose output
- Use `-s` flag to suppress progress meter
- The `-w` flag shows HTTP status codes
- Escape single quotes in JSON: `'\''`
