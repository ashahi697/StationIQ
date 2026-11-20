
const form = document.getElementById("salesForm");
const historyTable = document.getElementById("salesHistory");
const message = document.getElementById("salesMessage");

const money = amount =>
    Number(amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });

function getSales() {
    return JSON.parse(localStorage.getItem("stationIQSales") || "[]");
}

function renderSales() {
    historyTable.replaceChildren();

    const sales = getSales();

    if (!sales.length) {
        const row = historyTable.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.textContent = "No sales entries yet.";
        return;
    }

    sales.forEach(entry => {
        const row = historyTable.insertRow();

        [
            entry.date,
            money(entry.inside),
            money(entry.fuel),
            money(entry.inside + entry.fuel),
            money(entry.inside * 0.295)
        ].forEach(value => {
            const cell = row.insertCell();
            cell.textContent = value;
        });
    });
}

form.addEventListener("submit", event => {
    event.preventDefault();

    const entry = {
        date: document.getElementById("saleDate").value,
        inside: Number(document.getElementById("insideSales").value),
        fuel: Number(document.getElementById("fuelSales").value)
    };

    const sales = getSales();
    sales.push(entry);

    localStorage.setItem("stationIQSales", JSON.stringify(sales));

    form.reset();
    message.textContent = "Sales entry saved successfully.";
    renderSales();
});

renderSales();
