
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from pathlib import Path
from datetime import date
import json

app = FastAPI()

BASE_DIR = Path(__file__).resolve().parent
RECORDS_FILE = BASE_DIR / "records.json"


class SalesEntry(BaseModel):
    date: date
    inside: float = Field(ge=0)
    fuel: float = Field(ge=0)


class FuelEntry(BaseModel):
    date: date
    grade: str
    price: float = Field(ge=0)
    cost: float = Field(ge=0)
    gallons: float = Field(gt=0)


class InventoryEntry(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(ge=0)
    cost: float = Field(ge=0)


def read_records():
    if not RECORDS_FILE.exists():
        return {"sales": [], "fuel": [], "inventory": []}

    with open(RECORDS_FILE, "r") as file:
        data = json.load(file)

    data.setdefault("sales", [])
    data.setdefault("fuel", [])
    data.setdefault("inventory", [])

    return data


def save_records(data):
    with open(RECORDS_FILE, "w") as file:
        json.dump(data, file, indent=4)


def next_id(records):
    return max(
        (record["id"] for record in records),
        default=0
    ) + 1


@app.get("/")
def dashboard():
    return FileResponse(BASE_DIR / "stationIQ.html")


@app.get("/sales")
def sales_page():
    return FileResponse(BASE_DIR / "salesStationIQ-1.html")


@app.get("/fuel")
def fuel_page():
    return FileResponse(BASE_DIR / "fuel.html")


@app.get("/inventory")
def inventory_page():
    return FileResponse(BASE_DIR / "inventory.html")


@app.get("/api/sales")
def get_sales():
    return read_records()["sales"]


@app.post("/api/sales")
def add_sales(entry: SalesEntry):
    data = read_records()

    record = {
        "id": next_id(data["sales"]),
        "date": entry.date.isoformat(),
        "inside": entry.inside,
        "fuel": entry.fuel
    }

    data["sales"].append(record)
    save_records(data)

    return record


@app.delete("/api/sales/{record_id}")
def delete_sales(record_id: int):
    data = read_records()

    original_count = len(data["sales"])
    data["sales"] = [
        record for record in data["sales"]
        if record["id"] != record_id
    ]

    if len(data["sales"]) == original_count:
        raise HTTPException(404, "Sales record not found")

    save_records(data)
    return {"message": "Sales entry deleted"}


@app.get("/api/fuel")
def get_fuel():
    return read_records()["fuel"]


@app.post("/api/fuel")
def add_fuel(entry: FuelEntry):
    if entry.grade not in ["85", "87", "91", "Diesel"]:
        raise HTTPException(400, "Invalid fuel grade")

    data = read_records()

    margin = round(entry.price - entry.cost, 4)
    profit = round(margin * entry.gallons, 2)

    record = {
        "id": next_id(data["fuel"]),
        "date": entry.date.isoformat(),
        "grade": entry.grade,
        "price": entry.price,
        "cost": entry.cost,
        "gallons": entry.gallons,
        "margin": margin,
        "profit": profit
    }

    data["fuel"].append(record)
    save_records(data)

    return record


@app.delete("/api/fuel/{record_id}")
def delete_fuel(record_id: int):
    data = read_records()

    original_count = len(data["fuel"])
    data["fuel"] = [
        record for record in data["fuel"]
        if record["id"] != record_id
    ]

    if len(data["fuel"]) == original_count:
        raise HTTPException(404, "Fuel record not found")

    save_records(data)
    return {"message": "Fuel entry deleted"}


@app.get("/api/inventory")
def get_inventory():
    return read_records()["inventory"]


@app.post("/api/inventory")
def add_inventory(entry: InventoryEntry):
    data = read_records()

    record = {
        "id": next_id(data["inventory"]),
        "name": entry.name.strip(),
        "price": entry.price,
        "cost": entry.cost
    }

    if not record["name"]:
        raise HTTPException(400, "Product name cannot be blank")

    data["inventory"].append(record)
    save_records(data)

    return record


@app.put("/api/inventory/{record_id}")
def update_inventory(record_id: int, entry: InventoryEntry):
    data = read_records()

    if not entry.name.strip():
        raise HTTPException(400, "Product name cannot be blank")

    for record in data["inventory"]:
        if record["id"] == record_id:
            record["name"] = entry.name.strip()
            record["price"] = entry.price
            record["cost"] = entry.cost

            save_records(data)
            return record

    raise HTTPException(404, "Product not found")


@app.delete("/api/inventory/{record_id}")
def delete_inventory(record_id: int):
    data = read_records()

    original_count = len(data["inventory"])
    data["inventory"] = [
        record for record in data["inventory"]
        if record["id"] != record_id
    ]

    if len(data["inventory"]) == original_count:
        raise HTTPException(404, "Product not found")

    save_records(data)
    return {"message": "Product deleted"}


app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR),
    name="static"
)
