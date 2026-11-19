
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent

# Serve HTML dashboard
@app.get("/")
def dashboard():
    return FileResponse(BASE_DIR / "stationIQ.html")

# Serve CSS, JavaScript, and JSON
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR),
    name="static"
)

