let productsContainer =
    document.getElementById("productsContainer");

let sellproduct = document.getElementById("sellproduct");
let signing = document.getElementById("signing");


sellproduct.addEventListener("click", function(){

    window.location.href = "index.html"
});
signing.addEventListener("click", function(){

    window.location.href = "auth/register.html"
});


function displayProducts() {

    productsContainer.innerHTML = "";


    let products = JSON.parse(
        localStorage.getItem("movite_products")
    ) || [];


    products.forEach(function(product) {

        productsContainer.innerHTML += `

            <div class="CradInfo">

                <div class="product-photo">

                    <img
                        class="logox"
                        src="${product.image}"
                        alt="${product.name}"
                    >

                    <span class="product-badge">
                        ${product.category}
                    </span>

                </div>


                <div class="card">

                    <h1>${product.name}</h1>

                    <h2>${product.price} DH</h2>

                    <p>Casablanca</p>

                </div>

            </div>

        `;

    });

}


displayProducts();