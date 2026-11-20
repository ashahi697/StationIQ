
const inventoryForm = document.getElementById("inventoryForm");
const inventoryHistory = document.getElementById("inventoryHistory");
const inventoryMessage = document.getElementById("inventoryMessage");

const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productCost = document.getElementById("productCost");

let editingProductId = null;
let inventoryProducts = [];

function money(value) {
    return Number(value).toLocaleString("en-US", {
        style: "currency",
        currency: "USD"
    });
}

function percent(value) {
    return Number(value).toFixed(1) + "%";
}

function calculateMargin(price, cost) {
    return price > 0 ? ((price - cost) / price) * 100 : 0;
}

function updateProductPreview() {
    const price = Number(productPrice.value);
    const cost = Number(productCost.value);

    document.getElementById("productProfitPreview").textContent =
        money(price - cost);

    document.getElementById("productMarginPreview").textContent =
        percent(calculateMargin(price, cost));
}

[productPrice, productCost].forEach(input => {
    input.addEventListener("input", updateProductPreview);
});

function showInventoryMessage(text, error = false) {
    inventoryMessage.textContent = text;
    inventoryMessage.style.color = error ? "#b52525" : "#247b49";
}

function openProductForm(product = null) {
    inventoryForm.hidden = false;
    inventoryForm.reset();

    editingProductId = product ? product.id : null;

    document.getElementById("inventoryFormTitle").textContent =
        product ? "Edit Product" : "New Product";

    document.getElementById("saveProductButton").textContent =
        product ? "Update Product" : "Save Product";

    if (product) {
        productName.value = product.name;
        productPrice.value = product.price;
        productCost.value = product.cost;
    }

    updateProductPreview();
    productName.focus();
}

function closeProductForm() {
    inventoryForm.hidden = true;
    inventoryForm.reset();
    editingProductId = null;
    updateProductPreview();
}

document.getElementById("addProductButton")
    .addEventListener("click", () => openProductForm());

document.getElementById("cancelProductButton")
    .addEventListener("click", closeProductForm);

async function inventoryRequest(url, options = {}) {
    const response = await fetch(url, options);
    const result = await response.json();

    if (!response.ok) {
        throw new Error(
            typeof result.detail === "string"
                ? result.detail
                : "Inventory request failed"
        );
    }

    return result;
}

function addInventoryCell(row, value) {
    const cell = row.insertCell();
    cell.textContent = value;
    return cell;
}

function renderInventory() {
    inventoryHistory.replaceChildren();

    document.getElementById("productCount").textContent =
        inventoryProducts.length;

    const totalMargin = inventoryProducts.reduce((sum, product) => {
        return sum + calculateMargin(
            Number(product.price),
            Number(product.cost)
        );
    }, 0);

    document.getElementById("averageProductMargin").textContent =
        percent(
            inventoryProducts.length
                ? totalMargin / inventoryProducts.length
                : 0
        );

    if (!inventoryProducts.length) {
        const row = inventoryHistory.insertRow();
        const cell = row.insertCell();

        cell.colSpan = 6;
        cell.textContent = "Your inventory is empty. Click + Add Product to get started.";
        cell.style.textAlign = "center";
        cell.style.padding = "35px";
        cell.style.color = "#8792a0";
        return;
    }

    inventoryProducts.forEach(product => {
        const row = inventoryHistory.insertRow();

        const price = Number(product.price);
        const cost = Number(product.cost);

        addInventoryCell(row, product.name);
        addInventoryCell(row, money(price));
        addInventoryCell(row, money(cost));
        addInventoryCell(row, money(price - cost));
        addInventoryCell(row, percent(calculateMargin(price, cost)));

        const actions = row.insertCell();

        const editButton = document.createElement("button");
        editButton.className = "inventory-edit";
        editButton.textContent = "Edit";

        editButton.addEventListener("click", () => {
            openProductForm(product);
        });

        const deleteButton = document.createElement("button");
        deleteButton.className = "inventory-delete";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", async () => {
            if (!confirm(`Delete ${product.name}?`)) {
                return;
            }

            try {
                await inventoryRequest(
                    `/api/inventory/${product.id}`,
                    { method: "DELETE" }
                );

                await loadInventory();
                showInventoryMessage("Product deleted.");

            } catch (error) {
                showInventoryMessage(error.message, true);
            }
        });

        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
    });
}

async function loadInventory() {
    try {
        inventoryProducts = await inventoryRequest("/api/inventory");
        renderInventory();

    } catch (error) {
        showInventoryMessage(error.message, true);
    }
}

inventoryForm.addEventListener("submit", async event => {
    event.preventDefault();

    const product = {
        name: productName.value.trim(),
        price: Number(productPrice.value),
        cost: Number(productCost.value)
    };

    if (!product.name) {
        showInventoryMessage("Enter a product name.", true);
        return;
    }

    const button = document.getElementById("saveProductButton");
    button.disabled = true;

    try {
        const editing = editingProductId !== null;

        const url = editing
            ? `/api/inventory/${editingProductId}`
            : "/api/inventory";

        await inventoryRequest(url, {
            method: editing ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(product)
        });

        closeProductForm();
        await loadInventory();

        showInventoryMessage(
            editing ? "Product updated." : "Product added successfully."
        );

    } catch (error) {
        showInventoryMessage(error.message, true);

    } finally {
        button.disabled = false;
    }
});

loadInventory();
