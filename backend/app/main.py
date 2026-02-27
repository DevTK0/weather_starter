from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine, ensure_location_snapshot_columns
from app.routers.locations import router as locations_router

settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_location_snapshot_columns()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Minimal weather API starter with data.gov.sg integration",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

app.include_router(locations_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "healthy"}
