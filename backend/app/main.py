from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router


app = FastAPI(
    title="Ramdhivakar AI Portfolio API",
    description="Backend API for an AI-powered professional portfolio.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(api_router)


@app.get("/")
async def root():
    return {
        "message": "Ramdhivakar AI Portfolio API",
        "status": "running",
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "portfolio-backend",
        "version": "0.1.0",
    }