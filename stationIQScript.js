
const stationData = {
    today: {
        sales: 3200,
        gallons: 2800,
        profit: 850
    },
    week: {
        sales: 22500,
        gallons: 19000,
        profit: 5800
    },
    month: {
        sales: 90000,
        gallons: 80000,
        profit: 24000
    }
};

// Format numbers as currency
function formatMoney(amount) {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    });
}

// Update dashboard based on selected period
function updateDashboard(period) {
    const data = stationData[period];

    if (!data) return;

    document.getElementById("sales").textContent =
        formatMoney(data.sales);

    document.getElementById("gallons").textContent =
        data.gallons.toLocaleString() + " gal";

    document.getElementById("profit").textContent =
        formatMoney(data.profit);
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
    updateDashboard("today");

    document.getElementById("dateFilter")
        .addEventListener("change", (event) => {
            updateDashboard(event.target.value);
        });
});


const INSIDE_MARGIN = 0.295;

function calculateProfit(insideSales, fuelGallons, fuelMargin, expenses) {
    const insideGrossProfit = insideSales * INSIDE_MARGIN;

    const fuelGrossProfit = fuelGallons * fuelMargin;

    const totalGrossProfit = insideGrossProfit + fuelGrossProfit;

    const operatingProfit = totalGrossProfit - expenses;

    return {
        insideGrossProfit,
        fuelGrossProfit,
        totalGrossProfit,
        operatingProfit
    };
}

// Generate a demo fuel margin between 15 and 30 cents
function generateFuelMargin() {
    return Math.round((0.15 + Math.random() * 0.15) * 100) / 100;
}

// Example daily entry
const dailyReport = {
    insideSales: 3200,
    fuelGallons: 2800,
    fuelMargin: generateFuelMargin(),
    expenses: 450
};

const results = calculateProfit(
    dailyReport.insideSales,
    dailyReport.fuelGallons,
    dailyReport.fuelMargin,
    dailyReport.expenses
);

console.log("Daily report:", dailyReport);
console.log("Profit calculations:", results);


// Simulated daily operating data
const historicalData = [
    { day: "Mon", inside: 2900, gallons: 2500, fuelPrice: 3.05, margin: 0.19 },
    { day: "Tue", inside: 3100, gallons: 2700, fuelPrice: 3.05, margin: 0.21 },
    { day: "Wed", inside: 2800, gallons: 2400, fuelPrice: 3.09, margin: 0.17 },
    { day: "Thu", inside: 3400, gallons: 2900, fuelPrice: 3.09, margin: 0.24 },
    { day: "Fri", inside: 3900, gallons: 3300, fuelPrice: 3.15, margin: 0.26 },
    { day: "Sat", inside: 4200, gallons: 3500, fuelPrice: 3.15, margin: 0.28 },
    { day: "Sun", inside: 3600, gallons: 3000, fuelPrice: 3.12, margin: 0.22 }
];

const days = historicalData.map(d => d.day);

// Calculate values
const insideSales = historicalData.map(d => d.inside);

const fuelRevenue = historicalData.map(
    d => d.gallons * d.fuelPrice
);

const fuelGallons = historicalData.map(d => d.gallons);

const insideProfit = historicalData.reduce(
    (sum, d) => sum + d.inside * 0.295, 0
);

const fuelProfit = historicalData.reduce(
    (sum, d) => sum + d.gallons * d.margin, 0
);

// Sales trend
new Chart(document.getElementById("salesChart"), {
    type: "line",
    data: {
        labels: days,
        datasets: [
            {
                label: "Inside Sales",
                data: insideSales,
                borderColor: "#2563eb",
                tension: 0.3
            },
            {
                label: "Fuel Revenue",
                data: fuelRevenue,
                borderColor: "#16a34a",
                tension: 0.3
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

// Gross profit breakdown
new Chart(document.getElementById("profitChart"), {
    type: "doughnut",
    data: {
        labels: ["Inside Profit", "Fuel Profit"],
        datasets: [{
            data: [insideProfit, fuelProfit],
            backgroundColor: ["#2563eb", "#16a34a"]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});

// Fuel volume
new Chart(document.getElementById("fuelChart"), {
    type: "bar",
    data: {
        labels: days,
        datasets: [{
            label: "Gallons Sold",
            data: fuelGallons,
            backgroundColor: "#0ea5e9"
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});
