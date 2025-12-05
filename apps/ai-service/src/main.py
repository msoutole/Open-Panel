from fastapi import FastAPI
from contextlib import asynccontextmanager
from loguru import logger
from .database import db
from .routers import resources
from .config import get_settings

settings = get_settings()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up AI Service...")
    db.connect()
    yield
    logger.info("Shutting down AI Service...")
    db.close()

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
    description="Microservice for AI Logic and Resource Management using MongoDB"
)

app.include_router(resources.router, tags=["resources"], prefix="/resources")

@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "ai-service"}
