
const form = document.getElementById("salesForm");
const historyTable = document.getElementById("salesHistory");
const message = document.getElementById("salesMessage");

const money = amount =>
    Number(amount).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });

async function getSales() {
    const response = await fetch("/api/sales");

    if (!response.ok) {
        throw new Error("Could not load sales records.");
    }

    return await response.json();
}

async function renderSales() {
    try {
        const sales = await getSales();

        historyTable.replaceChildren();

        if (!sales.length) {
            const row = historyTable.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 5;
            cell.textContent = "No sales entries yet.";
            return;
        }

        sales.sort((a, b) => b.date.localeCompare(a.date));

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

    } catch (error) {
        message.textContent = error.message;
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const entry = {
        date: document.getElementById("saleDate").value,
        inside: Number(document.getElementById("insideSales").value),
        fuel: Number(document.getElementById("fuelSales").value)
    };

    try {
        const response = await fetch("/api/sales", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(entry)
        });

        if (!response.ok) {
            throw new Error("Could not save sales entry.");
        }

        form.reset();
        message.textContent = "Sales entry saved successfully.";

        await renderSales();

    } catch (error) {
        message.textContent = error.message;
    }
});

renderSales();
