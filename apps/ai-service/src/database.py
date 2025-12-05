from motor.motor_asyncio import AsyncIOMotorClient
from loguru import logger
from .config import get_settings

settings = get_settings()

class Database:
    client: AsyncIOMotorClient = None

    def connect(self):
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URL)
            logger.info("Connected to MongoDB")
        except Exception as e:
            logger.error(f"Could not connect to MongoDB: {e}")
            raise e

    def close(self):
        if self.client:
            self.client.close()
            logger.info("Closed MongoDB connection")

    def get_db(self):
        return self.client[settings.DB_NAME]

db = Database()

async def get_database():
    return db.get_db()
