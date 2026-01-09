# API Missing Fixes and Documentation

## Luggage Services API Integration

### 1. Fetch Active Luggage Services
- **Endpoint**: `GET /api/public/services/luggage`
- **Method**: GET

#### Request Parameters (Query String)
```json
{
  "page": 0,
  "size": 10,
  "searchTerm": "string (optional)",
  "location": "string (optional)",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)",
  "maxWeight": "number (optional)",
  "serviceType": "string (optional)"
}
```

#### Successful Response (200 OK)
```json
{
  "content": [
    {
      "id": "uuid-string",
      "name": "Luggage Storage Service Name",
      "description": "Detailed description of the luggage storage service",
      "location": "City, Address",
      "price": 15.00,
      "serviceType": "STORAGE | TRANSFER | DELIVERY",
      "startDate": "2025-01-01",
      "endDate": "2025-12-31",
      "maxWeight": 30,
      "images": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "providerId": "uuid-string",
      "providerName": "Provider Company Name",
      "rating": 4.5,
      "reviewCount": 120,
      "isActive": true,
      "createdAt": "2025-01-01T10:00:00Z",
      "updatedAt": "2025-01-15T14:30:00Z"
    }
  ],
  "totalElements": 50,
  "totalPages": 5,
  "page": 0,
  "size": 10,
  "first": true,
  "last": false,
  "empty": false
}
```

---

### 2. Advanced Search Luggage Services
- **Endpoint**: `POST /api/public/services/luggage/search`
- **Method**: POST

#### Request Body
```json
{
  "location": "string (optional)",
  "startDate": "YYYY-MM-DD (optional)",
  "endDate": "YYYY-MM-DD (optional)",
  "minPrice": 0,
  "maxPrice": 100,
  "maxWeight": 50,
  "serviceType": "STORAGE | TRANSFER | DELIVERY (optional)",
  "sortBy": "price | rating | distance (optional)",
  "sortDirection": "ASC | DESC (optional)"
}
```

#### Query Parameters
- `page`: Page number (default: 0)
- `size`: Items per page (default: 10)

#### Successful Response (200 OK)
Same structure as "Fetch Active Luggage Services" response.

---

### 3. Get Luggage Service Details
- **Endpoint**: `GET /api/public/services/luggage/{id}`
- **Method**: GET

#### Path Parameters
- `id`: UUID of the luggage service

#### Successful Response (200 OK)
```json
{
  "id": "uuid-string",
  "name": "Luggage Storage Service Name",
  "description": "Detailed description of the luggage storage service",
  "location": "City, Address",
  "latitude": 41.9028,
  "longitude": 12.4964,
  "price": 15.00,
  "serviceType": "STORAGE | TRANSFER | DELIVERY",
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "maxWeight": 30,
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ],
  "provider": {
    "id": "uuid-string",
    "name": "Provider Company Name",
    "email": "provider@example.com",
    "phone": "+39 123 456 7890",
    "rating": 4.5,
    "reviewCount": 120,
    "verified": true
  },
  "amenities": [
    "24/7 Access",
    "Insurance Included",
    "Climate Controlled"
  ],
  "operatingHours": {
    "monday": "08:00-20:00",
    "tuesday": "08:00-20:00",
    "wednesday": "08:00-20:00",
    "thursday": "08:00-20:00",
    "friday": "08:00-20:00",
    "saturday": "09:00-18:00",
    "sunday": "Closed"
  },
  "policies": {
    "cancellationPolicy": "Free cancellation up to 24 hours before",
    "insuranceIncluded": true,
    "maxStorageDays": 30
  },
  "reviews": [
    {
      "id": "uuid-string",
      "userId": "uuid-string",
      "userName": "John D.",
      "rating": 5,
      "comment": "Excellent service!",
      "createdAt": "2025-01-10T12:00:00Z"
    }
  ],
  "isActive": true,
  "createdAt": "2025-01-01T10:00:00Z",
  "updatedAt": "2025-01-15T14:30:00Z"
}
```

---

### Error Responses (Common for all endpoints)

#### 400 Bad Request
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid request parameters",
  "path": "/api/public/services/luggage"
}
```

#### 404 Not Found
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "status": 404,
  "error": "Not Found",
  "message": "Luggage service not found with id: {id}",
  "path": "/api/public/services/luggage/{id}"
}
```

#### 500 Internal Server Error
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "status": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "path": "/api/public/services/luggage"
}
```

---

## Notes
- All date formats should be ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- Pagination is zero-indexed (first page is 0)
- All prices are in EUR
- Optional parameters can be omitted from the request
- Service types: STORAGE, TRANSFER, DELIVERY
- Sort options: price, rating, distance
