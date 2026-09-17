import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload = os.environ.get("ENVIRONMENT", "development").lower() == "development"
    uvicorn.run("app.main:app", host=host, port=port, reload=reload)
