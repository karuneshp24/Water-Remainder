from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List
import datetime

app = FastAPI()

# Data model
class HydrationState(BaseModel):
    current_ml: int = 0
    goal_ml: int = 2500
    reminder_interval_minutes: int = 60
    logs: List[dict] = []

state = HydrationState()

@app.get("/api/state")
def get_state():
    return state

@app.post("/api/add")
def add_water(amount: int):
    state.current_ml += amount
    state.logs.append({
        "time": datetime.datetime.now().strftime("%H:%M"),
        "amount": amount
    })
    return state

@app.post("/api/set_interval")
def set_interval(minutes: int):
    state.reminder_interval_minutes = minutes
    return state

@app.post("/api/reset")
def reset_state():
    state.current_ml = 0
    state.logs = []
    return state

# Serve static files
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
