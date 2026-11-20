
const form = document.getElementById("fuelForm");
const historyTable = document.getElementById("fuelHistory");
const message = document.getElementById("fuelMessage");

const priceInput = document.getElementById("fuelPrice");
const costInput = document.getElementById("fuelCost");
const gallonsInput = document.getElementById("fuelGallons");

let chart;

function money(number) {
    return "$" + Number(number.toFixed(2)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function updatePreview() {
    const price = Number(priceInput.value);
    const cost = Number(costInput.value);
    const gallons = Number(gallonsInput.value);

    const margin = price - cost;
    const profit = margin * gallons;

    document.getElementById("previewMargin").textContent =
        "$" + Number(margin.toFixed(10));

    document.getElementById("previewProfit").textContent =
        money(profit);
}

priceInput.addEventListener("input", updatePreview);
costInput.addEventListener("input", updatePreview);
gallonsInput.addEventListener("input", updatePreview);

async function loadFuel() {
    const response = await fetch("/api/fuel");
    const records = await response.json();

    historyTable.innerHTML = "";

    let totalGallons = 0;
    let totalRevenue = 0;
    let totalProfit = 0;

    const profits = {
        "85": 0,
        "87": 0,
        "91": 0,
        "Diesel": 0
    };

    records.forEach(record => {
        const margin = record.price - record.cost;
        const profit = margin * record.gallons;

        totalGallons += record.gallons;
        totalRevenue += record.price * record.gallons;
        totalProfit += profit;

        profits[record.grade] += profit;

        const row = historyTable.insertRow();

        const values = [
            record.date,
            record.grade,
            "$" + record.price,
            "$" + record.cost,
            record.gallons,
            "$" + Number(margin.toFixed(10)),
            money(profit)
        ];

        values.forEach(value => {
            row.insertCell().textContent = value;
        });

        const button = document.createElement("button");
        button.textContent = "Delete";
        button.className = "fuel-delete";

        button.onclick = async () => {
            await fetch("/api/fuel/" + record.id, {
                method: "DELETE"
            });
            loadFuel();
        };

        row.insertCell().appendChild(button);
    });

    document.getElementById("totalGallons").textContent =
        totalGallons.toLocaleString() + " gal";

    document.getElementById("totalRevenue").textContent =
        money(totalRevenue);

    document.getElementById("totalFuelProfit").textContent =
        money(totalProfit);

    document.getElementById("averageMargin").textContent =
        "$" + (totalGallons ? Number((totalProfit / totalGallons).toFixed(10)) : 0);

    if (chart) {
        chart.destroy();
    }

    chart = new Chart(document.getElementById("fuelProfitChart"), {
        type: "bar",
        data: {
            labels: ["85", "87", "91", "Diesel"],
            datasets: [{
                label: "Gross Profit ($)",
                data: [
                    profits["85"],
                    profits["87"],
                    profits["91"],
                    profits["Diesel"]
                ],
                backgroundColor: [
                    "#2563eb",
                    "#16a34a",
                    "#eab308",
                    "#d52b1e"
                ],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const entry = {
        date: document.getElementById("fuelDate").value,
        grade: document.getElementById("fuelGrade").value,
        price: Number(priceInput.value),
        cost: Number(costInput.value),
        gallons: Number(gallonsInput.value)
    };

    if (!entry.date) {
        message.textContent = "Enter a date.";
        return;
    }

    if (entry.gallons <= 0) {
        message.textContent = "Enter gallons sold greater than zero.";
        return;
    }

    const response = await fetch("/api/fuel", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(entry)
    });

    if (response.ok) {
        form.reset();
        document.getElementById("fuelDate").value =
            new Date().toLocaleDateString("en-CA");

        message.textContent = "Fuel entry saved.";
        updatePreview();
        loadFuel();
    } else {
        message.textContent = "Could not save fuel entry.";
    }
});

document.getElementById("fuelDate").value =
    new Date().toLocaleDateString("en-CA");

updatePreview();
loadFuel();
