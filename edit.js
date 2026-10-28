const API_BASE = "http://localhost:3000/api";
const draft = JSON.parse(localStorage.getItem("movite-draft") || "null");
const form = document.querySelector("#editForm");

if (!draft) {
    location.replace("../so9.html");
} else {
    for (const key of ["title", "price", "city", "description"]) {
        form.elements[key].value = draft[key] ?? "";
    }

    const categories = ["Electronics", "Home", "Fashion", "Sports", "Cars", "Other"];
    form.elements.category.value = categories.includes(draft.category) ? draft.category : "Other";
    form.elements.condition.value = /^(new|جديد)$/i.test(draft.condition || "") ? "New" : "Used";

    if (draft.image) {
        const image = document.querySelector("#preview");
        image.src = draft.image;
        image.hidden = false;
    }

    if (draft.price_basis) {
        document.querySelector("#priceHint").textContent =
            `AI price note: ${draft.price_basis} Edit this estimate before publishing.`;
    }
}

form.addEventListener("submit", async event => {
    event.preventDefault();

    const data = new FormData(form);
    const item = {
        name: String(data.get("title")).trim(),
        price: Number(data.get("price")),
        description: String(data.get("description")).trim(),
        image: draft?.image || ""
    };

    if (!item.name || !item.price || !item.description || !item.image) {
        alert("Please add a product photo and complete the name, price, and description.");
        return;
    }

    const button = form.querySelector("[type=submit]");
    button.disabled = true;
    button.textContent = "Publishing…";

    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item)
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || "Could not publish the product.");
        }

        localStorage.removeItem("movite-draft");
        location.href = "../so9.html#products";
    } catch (error) {
        alert(error.message);
        button.disabled = false;
        button.textContent = "Publish listing →";
    }
});


