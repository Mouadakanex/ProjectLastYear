const API_URL = "http://localhost:3000/api/products";

const productName = document.getElementById("productName");
const productPrice = document.getElementById("productPrice");
const productImage = document.getElementById("productImage");
const productDescription = document.getElementById("productDescription");
const productImagePreview = document.getElementById("productImagePreview");
const addProductBtn = document.getElementById("addProductBtn");
const draft = JSON.parse(localStorage.getItem("movite-draft") || "null");

if (draft) {
    productName.value = draft.title || "";
    productPrice.value = draft.price || "";
    productDescription.value = draft.description || "";

    if (draft.image) {
        productImage.value = draft.image;
        productImage.hidden = true;
        productImagePreview.src = draft.image;
        productImagePreview.hidden = false;
    }
}

addProductBtn.addEventListener("click", async event => {
    event.preventDefault();

    const product = {
        name: productName.value.trim(),
        price: Number(productPrice.value),
        image: productImage.value.trim(),
        description: productDescription.value.trim()
    };

    if (!product.name || !product.price || !product.image || !product.description) {
        alert("Check the product name, price, photo, and description before publishing.");
        return;
    }

    addProductBtn.disabled = true;
    addProductBtn.textContent = "Publishing…";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(product)
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || result.error || "Could not publish the product.");
        }

        localStorage.removeItem("movite-draft");
        alert("Product published.");
        location.href = "so9.html#products";
    } catch (error) {
        alert(error.message);
        addProductBtn.disabled = false;
        addProductBtn.textContent = "Publish Product";
    }
});

