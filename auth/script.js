//register
let Moviteusername = document.getElementById("Moviteusername");
let Moviteemail = document.getElementById("Moviteemail");
let Movitepassword = document.getElementById("Movitepassword");
let siginbtn = document.getElementById("siginbtn");

//login
let loginbtn = document.getElementById("loginbtn");
let Loginemail = document.getElementById("Loginemail");
let Loginpassword = document.getElementById("Loginpassword");


siginbtn.addEventListener("click", async function(){

    let name = Moviteusername.value;
    let email = Moviteemail.value;
    let password = Movitepassword.value;

    if(name === ""|| email === "" || password === ""){
        alert("fill first")
        return;
    }
    
    let user = {
        username: name,
        password: password,
        email: email 
    }

    const response = await fetch("http://localhost:3000/api/register",
    {
        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(user)
    }
    );

    const data = await response.json();

    alert(data.message);

    if(response.ok){
        
        Moviteusername.value = "";
        Moviteemail.value = "";
        Movitepassword.value = "";

        window.location.href = "login.html"
    }
});

loginbtn.addEventListener("click", async function(){

    let email = Loginemail.value;
    let password = Loginpassword.value;

    if(email === "" || password === "" ){
        alert("fill first")
        return;
    }

    let user = {
        password: password,
        email: email 
    }

    const response = await fetch("http://localhost:3000/api/login",
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(user)
    }
    );

    const data = await response.json();

    if (response.ok){

        Loginpassword.value = "";
        Loginemail.value = "";

        window.location.href = "../so9.html"

        
    }

});