let productName = document.getElementById("productName");
let productPrice = document.getElementById("productPrice");
let productImage = document.getElementById("productImage");

let productCategory = document.getElementById("productCategory");
let productDescription = document.getElementById("productDescription");

let addProductBtn = document.getElementById("addProductBtn");


addProductBtn.addEventListener("click", function(event) {

    event.preventDefault();

    let name = productName.value;
    let price = productPrice.value;
    let image = productImage.value;
    let category = productCategory.value;
    let description = productDescription.value;


    if (
        name === "" ||
        price === "" ||
        image === "" ||
        category === "" ||
        description === ""
    ) {

        alert("Please fill all fields");

        return;
    }


    let product = {

        name: name,

        price: price,

        image: image,

        category: category,

        description: description

    };


    let products = JSON.parse(
        localStorage.getItem("movite_products")
    ) || [];


    products.push(product);


    localStorage.setItem(
        "movite_products",
        JSON.stringify(products)
    );


    alert("Product published successfully");


    productName.value = "";
    productPrice.value = "";
    productImage.value = "";
    productCategory.value = "";
    productDescription.value = "";

    window.location.href = "so9.html"

});