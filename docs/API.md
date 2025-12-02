# 📡 Open Panel API Documentation

Complete API reference for Open Panel backend services.

**Base URL:** `http://localhost:3001` (development)
**API Version:** 1.0.0
**Authentication:** Bearer JWT tokens

---

## Table of Contents

- [Authentication](#authentication)
- [Onboarding](#onboarding)
- [Users](#users)
- [Projects](#projects)
- [Teams](#teams)
- [Metrics](#metrics)
- [Audit Logs](#audit-logs)
- [Statistics](#statistics)
- [WebSockets](#websockets)
- [Error Handling](#error-handling)

---

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

`http
Authorization: Bearer <your_jwt_token>
`

### POST /api/auth/login

Authenticate user and receive JWT tokens.

**Request:**
`http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@admin.com.br",
  "password": "admin123"
}
`

**Response (200 OK):**
`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "clr1234567890",
    "email": "admin@admin.com.br",
    "name": "Administrator"
  }
}
`

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `400 Bad Request` - Invalid request format

---

### POST /api/auth/refresh

Refresh expired access token using refresh token.

**Request:**
`http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
`

**Response (200 OK):**
`json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
`

---

### POST /api/auth/logout

Invalidate current tokens.

**Request:**
`http
POST /api/auth/logout
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "message": "Logged out successfully"
}
`

---

## Onboarding

Endpoints for first-time user setup and configuration.

### GET /api/onboarding/status

Check if user has completed onboarding.

**Authentication:** Required

**Request:**
`http
GET /api/onboarding/status
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "onboardingCompleted": false,
  "mustChangePassword": true
}
`

**Fields:**
- `onboardingCompleted` (boolean) - Whether user has finished onboarding wizard
- `mustChangePassword` (boolean) - Whether user needs to change default password

**Errors:**
- `401 Unauthorized` - Not authenticated

---

### POST /api/onboarding/complete

Complete onboarding process with user preferences and AI providers.

**Authentication:** Required

**Request:**
`http
POST /api/onboarding/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "theme": "dark",
  "newPassword": "SecurePass123!",
  "defaultProvider": "gemini",
  "aiProviders": [
    {
      "provider": "gemini",
      "apiKey": "AIzaSyD-...",
      "apiUrl": null
    },
    {
      "provider": "ollama",
      "apiKey": null,
      "apiUrl": "http://localhost:11434"
    }
  ]
}
`

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `theme` | enum | Yes | `"light"` or `"dark"` |
| `newPassword` | string | No | New password (min 8 chars, must contain uppercase, lowercase, number, special char) |
| `defaultProvider` | string | Yes | Default AI provider ID |
| `aiProviders` | array | Yes | Array of AI provider configurations (min 1) |
| `aiProviders[].provider` | enum | Yes | `"gemini"`, `"claude"`, `"github"`, or `"ollama"` |
| `aiProviders[].apiKey` | string | Conditional | Required for gemini, claude, github |
| `aiProviders[].apiUrl` | string | Conditional | Required for ollama |

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*)

**Response (200 OK):**
`json
{
  "message": "Onboarding completed successfully",
  "success": true
}
`

**Errors:**
- `400 Bad Request` - Invalid data, weak password, or API key validation failed
  ```json
  {
    "error": "Invalid API key for gemini",
    "details": "API key validation failed"
  }
  ```
- `401 Unauthorized` - Not authenticated

---

### POST /api/onboarding/validate-provider

Validate AI provider API key before saving.

**Authentication:** Required
**Rate Limit:** 10 requests per minute per user

**Request:**
`http
POST /api/onboarding/validate-provider
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider": "gemini",
  "apiKey": "AIzaSyD-...",
  "apiUrl": null
}
`

**Request Body Schema:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `provider` | enum | Yes | `"gemini"`, `"claude"`, `"github"`, or `"ollama"` |
| `apiKey` | string | Conditional | Required for gemini, claude, github |
| `apiUrl` | string | Conditional | Required for ollama (default: `http://localhost:11434`) |

**Response (200 OK) - Valid:**
`json
{
  "valid": true,
  "models": [
    {
      "id": "gemini-pro",
      "name": "Gemini Pro"
    },
    {
      "id": "gemini-pro-vision",
      "name": "Gemini Pro Vision"
    }
  ]
}
`

**Response (200 OK) - Invalid:**
`json
{
  "valid": false,
  "error": "Invalid API key"
}
`

**Errors:**
- `400 Bad Request` - Invalid provider or missing required fields
- `401 Unauthorized` - Not authenticated
- `429 Too Many Requests` - Rate limit exceeded

---

### GET /api/onboarding/providers

Get user's configured AI providers.

**Authentication:** Required

**Request:**
`http
GET /api/onboarding/providers
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "providers": [
    {
      "id": "clr9876543210",
      "provider": "gemini",
      "apiUrl": null,
      "isActive": true,
      "availableModels": [
        {
          "id": "gemini-pro",
          "name": "Gemini Pro"
        }
      ],
      "lastValidatedAt": "2025-01-27T10:30:00.000Z",
      "createdAt": "2025-01-27T10:00:00.000Z"
    }
  ]
}
`

**Note:** API keys are **never** returned in this response for security reasons.

**Errors:**
- `401 Unauthorized` - Not authenticated

---

## Users

### GET /api/users/me

Get current authenticated user's profile.

**Authentication:** Required

**Request:**
`http
GET /api/users/me
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "id": "clr1234567890",
  "email": "admin@admin.com.br",
  "name": "Administrator",
  "role": "OWNER",
  "createdAt": "2025-01-27T09:00:00.000Z",
  "mustChangePassword": false
}
`

---

### PATCH /api/users/me

Update current user's profile.

**Authentication:** Required

**Request:**
`http
PATCH /api/users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Name",
  "email": "newemail@example.com"
}
`

**Response (200 OK):**
`json
{
  "id": "clr1234567890",
  "email": "newemail@example.com",
  "name": "New Name",
  "role": "OWNER"
}
`

---

### POST /api/users/change-password

Change user password.

**Authentication:** Required

**Request:**
`http
POST /api/users/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecure456#"
}
`

**Response (200 OK):**
`json
{
  "message": "Password changed successfully"
}
`

**Errors:**
- `400 Bad Request` - Current password incorrect or new password too weak
- `401 Unauthorized` - Not authenticated

---

## Projects

### GET /api/projects

List all projects for current user.

**Authentication:** Required

**Request:**
`http
GET /api/projects
Authorization: Bearer <token>
`

**Query Parameters:**
- `status` (optional) - Filter by status: `ACTIVE`, `PAUSED`, `ERROR`, `DEPLOYING`, `STOPPED`
- `type` (optional) - Filter by type: `WEB`, `API`, `WORKER`, `CRON`, `DATABASE`, `REDIS`, `MONGODB`
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 20) - Items per page

**Response (200 OK):**
`json
{
  "projects": [
    {
      "id": "clr1111111111",
      "name": "My Web App",
      "type": "WEB",
      "status": "ACTIVE",
      "gitRepo": "https://github.com/user/repo",
      "domain": "myapp.example.com",
      "createdAt": "2025-01-27T08:00:00.000Z",
      "updatedAt": "2025-01-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
`

---

### POST /api/projects

Create a new project.

**Authentication:** Required
**Required Role:** OWNER, ADMIN, MEMBER

**Request:**
`http
POST /api/projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My New App",
  "type": "WEB",
  "gitRepo": "https://github.com/user/repo",
  "branch": "main",
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "envVars": {
    "NODE_ENV": "production",
    "API_URL": "https://api.example.com"
  }
}
`

**Response (201 Created):**
`json
{
  "id": "clr2222222222",
  "name": "My New App",
  "type": "WEB",
  "status": "DEPLOYING",
  "gitRepo": "https://github.com/user/repo",
  "branch": "main",
  "createdAt": "2025-01-27T11:00:00.000Z"
}
`

---

### GET /api/projects/:id

Get project details.

**Authentication:** Required

**Request:**
`http
GET /api/projects/clr1111111111
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "id": "clr1111111111",
  "name": "My Web App",
  "type": "WEB",
  "status": "ACTIVE",
  "gitRepo": "https://github.com/user/repo",
  "branch": "main",
  "domain": "myapp.example.com",
  "buildCommand": "npm run build",
  "startCommand": "npm start",
  "envVars": {
    "NODE_ENV": "production"
  },
  "container": {
    "id": "abc123...",
    "status": "running",
    "cpuUsage": "5.2%",
    "memoryUsage": "120MB"
  },
  "deployments": [
    {
      "id": "dep1",
      "status": "SUCCESS",
      "commit": "abc123...",
      "createdAt": "2025-01-27T10:00:00.000Z"
    }
  ],
  "createdAt": "2025-01-27T08:00:00.000Z",
  "updatedAt": "2025-01-27T10:00:00.000Z"
}
`

---

### DELETE /api/projects/:id

Delete a project.

**Authentication:** Required
**Required Role:** OWNER, ADMIN

**Request:**
`http
DELETE /api/projects/clr1111111111
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "message": "Project deleted successfully"
}
`

---

## Teams

### GET /api/teams

List user's teams.

**Authentication:** Required

**Request:**
`http
GET /api/teams
Authorization: Bearer <token>
`

**Response (200 OK):**
`json
{
  "teams": [
    {
      "id": "team1",
      "name": "My Team",
      "role": "OWNER",
      "members": 5,
      "createdAt": "2025-01-20T00:00:00.000Z"
    }
  ]
}
`

---

### POST /api/teams

Create a new team.

**Authentication:** Required

**Request:**
`http
POST /api/teams
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Team"
}
`

**Response (201 Created):**
`json
{
  "id": "team2",
  "name": "New Team",
  "role": "OWNER",
  "createdAt": "2025-01-27T11:00:00.000Z"
}
`

---

### POST /api/teams/:id/invite

Invite user to team.

**Authentication:** Required
**Required Role:** OWNER, ADMIN

**Request:**
`http
POST /api/teams/team1/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "role": "MEMBER"
}
`

**Roles:**
- `OWNER` - Full access, can delete team
- `ADMIN` - Manage projects and members
- `MEMBER` - Can deploy and manage projects
- `VIEWER` - Read-only access

**Response (200 OK):**
`json
{
  "message": "Invitation sent successfully",
  "inviteId": "inv123"
}
`

---

## Metrics

### GET /api/metrics/system

Get system-wide metrics (CPU, Memory, Disk, Network).

**Response (200 OK):**
```json
{
  "metrics": {
    "cpu": {
      "usage": 25.5,
      "cores": 8,
      "loadAverage": [1.2, 1.5, 1.8]
    },
    "memory": {
      "total": 34359738368,
      "used": 17179869184,
      "free": 17179869184,
      "usage": 50.0
    },
    "disk": {
      "total": 107374182400,
      "used": 53687091200,
      "free": 53687091200,
      "usage": 50.0
    },
    "network": {
      "rx": 1073741824,
      "tx": 2147483648,
      "rxRate": 1024000,
      "txRate": 2048000
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/metrics/containers

Get metrics for all containers.

**Response (200 OK):**
```json
{
  "metrics": [
    {
      "id": "container_id",
      "dockerId": "docker_container_id",
      "name": "container_name",
      "cpu": {
        "usage": 15.5,
        "cores": 2
      },
      "memory": {
        "used": 536870912,
        "limit": 2147483648,
        "usage": 25.0
      },
      "network": {
        "rx": 1073741824,
        "tx": 2147483648,
        "rxRate": 0,
        "txRate": 0
      },
      "blockIO": {
        "read": 536870912,
        "write": 1073741824
      },
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ],
  "total": 1
}
```

### GET /api/metrics/containers/:id

Get metrics for a specific container.

**Response (200 OK):**
```json
{
  "metrics": {
    "id": "container_id",
    "dockerId": "docker_container_id",
    "name": "container_name",
    "cpu": {
      "usage": 15.5,
      "cores": 2
    },
    "memory": {
      "used": 536870912,
      "limit": 2147483648,
      "usage": 25.0
    },
    "network": {
      "rx": 1073741824,
      "tx": 2147483648,
      "rxRate": 0,
      "txRate": 0
    },
    "blockIO": {
      "read": 536870912,
      "write": 1073741824
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

## Audit Logs

### GET /api/audit

List audit logs with pagination and filters.

**Query Parameters:**
- `userId` (optional): Filter by user ID
- `action` (optional): Filter by action type
- `resourceType` (optional): Filter by resource type
- `resourceId` (optional): Filter by resource ID
- `status` (optional): Filter by status (SUCCESS, FAILURE)
- `startDate` (optional): ISO 8601 datetime
- `endDate` (optional): ISO 8601 datetime
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": "log_id",
      "action": "SERVICE_STOP",
      "userId": "user_id",
      "userEmail": "user@example.com",
      "userName": "User Name",
      "resourceType": "container",
      "resourceId": "container_id",
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "metadata": {},
      "timestamp": "2024-01-01T12:00:00.000Z",
      "status": "Success"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/audit/:id

Get details of a specific audit log.

**Response (200 OK):**
```json
{
  "log": {
    "id": "log_id",
    "action": "SERVICE_STOP",
    "userId": "user_id",
    "userEmail": "user@example.com",
    "userName": "User Name",
    "resourceType": "container",
    "resourceId": "container_id",
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0...",
    "metadata": {},
    "timestamp": "2024-01-01T12:00:00.000Z",
    "status": "Success"
  }
}
```

### GET /api/audit/stats

Get statistics about audit logs.

**Response (200 OK):**
```json
{
  "stats": {
    "total": 1000,
    "recent24h": 150,
    "failed": 5,
    "successful": 995,
    "byAction": [
      {
        "action": "SERVICE_STOP",
        "count": 50
      }
    ],
    "byResourceType": [
      {
        "resourceType": "container",
        "count": 200
      }
    ]
  }
}
```

## Statistics

### GET /api/stats/dashboard

Get aggregated statistics for dashboard.

**Response (200 OK):**
```json
{
  "stats": {
    "system": {
      "cpu": {
        "usage": 25.5,
        "cores": 8
      },
      "memory": {
        "usage": 50.0,
        "total": 34359738368,
        "used": 17179869184
      },
      "disk": {
        "usage": 50.0,
        "total": 107374182400,
        "used": 53687091200
      },
      "network": {
        "rx": 1073741824,
        "tx": 2147483648,
        "rxRate": 1024000,
        "txRate": 2048000
      }
    },
    "projects": {
      "total": 10,
      "active": 8,
      "paused": 2
    },
    "containers": {
      "total": 25,
      "running": 20,
      "stopped": 5
    },
    "users": {
      "total": 5
    },
    "activity": {
      "deployments24h": 10,
      "auditLogs24h": 150
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

### GET /api/stats/projects

Get statistics about projects.

**Response (200 OK):**
```json
{
  "stats": {
    "total": 10,
    "byStatus": [
      {
        "status": "ACTIVE",
        "count": 8
      }
    ],
    "byType": [
      {
        "type": "app",
        "count": 5
      }
    ]
  }
}
```

### GET /api/stats/containers

Get statistics about containers.

**Response (200 OK):**
```json
{
  "stats": {
    "total": 25,
    "running": 20,
    "stopped": 5,
    "byStatus": [
      {
        "status": "RUNNING",
        "count": 20
      }
    ],
    "averages": {
      "cpu": 15.5,
      "memory": 536870912
    }
  }
}
```

## WebSockets

### ws://localhost:3001/ws/containers

WebSocket gateway for container logs and metrics.

**Authentication:**
Send a message with type `auth` and your JWT token:
```json
{
  "type": "auth",
  "token": "your_jwt_token"
}
```

**Subscribe to Container Logs:**
```json
{
  "type": "subscribe_logs",
  "containerId": "container_id"
}
```

**Subscribe to Container Stats:**
```json
{
  "type": "subscribe_stats",
  "containerId": "container_id",
  "interval": 2000
}
```

**Message Types:**
- `log`: Real-time log entry
- `stats`: Real-time container statistics
- `docker_event`: Docker events

### ws://localhost:3001/ws/logs

WebSocket gateway for system-wide Docker events.

**Authentication:**
Same as containers gateway.

**Message Types:**
- `docker_event`: Real-time Docker events

### ws://localhost:3001/ws/metrics

WebSocket gateway for system metrics.

**Authentication:**
Same as containers gateway.

**Subscribe:**
```json
{
  "type": "subscribe",
  "interval": 2000
}
```

**Message Types:**
- `metrics`: Real-time system metrics

## Error Handling

### Standard Error Response

All errors follow this format:

`json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
`

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required or failed |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server error |

### Common Error Codes

| Code | Description |
|------|-------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password |
| `AUTH_TOKEN_EXPIRED` | JWT token has expired |
| `AUTH_INSUFFICIENT_PERMISSIONS` | User lacks required role |
| `VALIDATION_ERROR` | Input validation failed |
| `RESOURCE_NOT_FOUND` | Requested resource doesn't exist |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `DATABASE_ERROR` | Database operation failed |

---

## Rate Limiting

Different endpoints have different rate limits:

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 5 requests per minute |
| `/api/onboarding/validate-provider` | 10 requests per minute |
| Most other endpoints | 100 requests per minute |

When rate limit is exceeded:

`http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Too many requests",
  "retryAfter": 60
}
`

---

## Webhooks

### Project Deployment Webhook

Configure webhook to receive deployment notifications.

**Request sent to your webhook URL:**

`http
POST https://your-webhook-url.com
Content-Type: application/json

{
  "event": "deployment.completed",
  "projectId": "clr1111111111",
  "deploymentId": "dep1",
  "status": "SUCCESS",
  "commit": "abc123...",
  "timestamp": "2025-01-27T10:00:00.000Z"
}
`

---

## WebSocket API

### Real-time Container Logs

Connect to WebSocket for real-time logs:

`javascript
const ws = new WebSocket('ws://localhost:3001/ws/containers/:containerId/logs');

ws.onmessage = (event) => {
  const log = JSON.parse(event.data);
  console.log(log.message);
};
`

**Message Format:**
`json
{
  "type": "log",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "message": "Server started on port 3000",
  "stream": "stdout"
}
`

---

## Examples

### cURL Examples

**Login:**
`bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com.br","password":"admin123"}'
`

**Get Onboarding Status:**
`bash
curl -X GET http://localhost:3001/api/onboarding/status \
  -H "Authorization: Bearer YOUR_TOKEN"
`

**Complete Onboarding:**
`bash
curl -X POST http://localhost:3001/api/onboarding/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme": "dark",
    "newPassword": "SecurePass123!",
    "defaultProvider": "gemini",
    "aiProviders": [
      {
        "provider": "gemini",
        "apiKey": "YOUR_API_KEY"
      }
    ]
  }'
`

---

### JavaScript/TypeScript Examples

**Using Fetch API:**

`typescript
// Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Login failed');
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.accessToken);
  return data;
};

// Check onboarding status
const checkOnboarding = async () => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('http://localhost:3001/api/onboarding/status', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  return response.json();
};

// Complete onboarding
const completeOnboarding = async (data: OnboardingData) => {
  const token = localStorage.getItem('access_token');

  const response = await fetch('http://localhost:3001/api/onboarding/complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return response.json();
};
`

---

## Changelog

### v1.0.0 (2025-01-27)

**Added:**
- ✨ Onboarding API endpoints
- ✨ AI provider validation
- ✨ Password strength requirements
- ✨ Rate limiting on sensitive endpoints
- ✨ AES-256-GCM encryption for API keys

**Security:**
- 🔐 Strong password enforcement
- 🔐 API key encryption at rest
- 🔐 Rate limiting to prevent abuse

---

**Last Updated:** 2025-01-27
**API Version:** 1.0.0
**Maintainer:** Matheus Souto Leal (msoutole@hotmail.com)

