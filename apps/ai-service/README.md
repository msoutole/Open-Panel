# AI Service (Python/FastAPI)

Microservice handling business logic and AI operations.

## Tech Stack
- Python 3.11
- FastAPI
- Uvicorn
- Motor (MongoDB Async Driver)
- Pydantic
- Loguru (Logging)

## Environment Variables
- `MONGODB_URL`: Connection string for MongoDB.
- `PORT`: Service port (default 8000).

## Running
```bash
docker compose up ai-service
```
