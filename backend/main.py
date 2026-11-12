
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
import backend.models  # Register all SQLAlchemy models
from backend.routes.districts import router as districts_router
from backend.routes.rankings import router as rankings_router
from backend.routes.allocations import router as allocations_router
from backend.routes.policy import router as policy_router
from backend.routes.auth import router as auth_router
from backend.routes.scenarios import router as scenarios_router
from backend.routes.reports import router as reports_router
from backend.routes.feedback import router as feedback_router

# Create any missing database tables.
# Existing tables and their data are not deleted.
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="GovOpt API",
    description=(
        "Uttarakhand Government Resource Allocation "
        "and Optimisation Platform"
    ),
    version="1.3.0"
)

# Allow the local development frontend and deployed Vercel website.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://gov-opt.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(districts_router)
app.include_router(rankings_router)
app.include_router(allocations_router)
app.include_router(policy_router)
app.include_router(auth_router)
app.include_router(scenarios_router)
app.include_router(reports_router)
app.include_router(feedback_router)


@app.get("/")
def home():
    return {
        "project": "GovOpt",
        "message": "GovOpt backend is running!",
        "status": "success"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "GovOpt Backend"
    }
