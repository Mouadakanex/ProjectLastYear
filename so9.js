let productsContainer =
    document.getElementById("Productcontainer");

let sellproduct = document.getElementById("sellproduct");
let signing = document.getElementById("signing");




sellproduct.addEventListener("click", function(){

    window.location.href = "index.html"
});
signing.addEventListener("click", function(){

    window.location.href = "auth/register.html"
});

async function Getproduct (){

    const response = await fetch("http://localhost:3000/api/products");

    const products = await response.json();
     console.log(products);

     Productcontainer.innerHTML = "";

    products.forEach(function(product) {
        Productcontainer.innerHTML += `
        
        <div class="CradInfo">

                <div class="product-photo">

                    <img
                        class="logox"
                        src="${product.image}"
                        alt="${product.name}"
                    >

                </div>

                <div class="card">

                    <h1>${product.name}</h1>

                    <h2>${product.price} DH</h2>

                    <p>Casablanca</p>

                </div>

            </div>

        `;
    })
}
Getproduct();

