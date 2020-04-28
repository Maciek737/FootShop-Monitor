const axios = require('axios');
const Discord = require("discord.js")
const data = require('./data');

// Creates the webhook client that will be use to send data to. Can have multiple if you would like to send multiple at a time.
const webhookClient = new Discord.WebhookClient(data.id,data.token);
// Logos to make things pretty
const logo = data.footshopLogo;
const chuk = data.chukLogo;
// The SKU of the product you want to monitor. In this monitor I have it hard coded. In other monitors this updates at the start from user input. 
const sku = "50819"


// Setting myJSON to something random in order to compare it later. This can be anything to start with. 
var myJSON ="TESTING HOMIE THIS IS TESTING!";
// Sets the URL of the api to the product sku defined above. Created this way to later easily adapt to a changing sku via user input.
let url = "https://www.footshop.com/en/api/product/" + sku;
// Debug code to let you know what product you are monitoring.
console.log("Hello starting to monitor " + sku)

setInterval(function(){
axios.get(url)
    // Get the response 
  .then(function (response) {
    // Create a var to store the current data in the api.
    var difference = JSON.stringify(response.data.availability.data);
    // Grab the image of the shoe.
    var image = JSON.stringify(response.data.images.cover_image);
    // Grab the name of the shoe.
    var name = JSON.stringify(response.data.name);
    // Grab the product link.
    var productLink = JSON.stringify(response.data.url);
    // Grab the price of the product.
    var totalPrice = JSON.stringify(response.data.price.value);
    // Grabs the total stock of the product.
    var totalStockAPI = JSON.stringify(response.data.availability.quantity);

    // Function to check the difference between myJSON and the current data in the api
    function jsonEqual(a,b) {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    
    // If there IS A DIFFERENCE between api and stored data execute this
    if(jsonEqual(myJSON,difference) == false){
        // Set stored data to the new data
        myJSON = difference;
        // Parse the data, same data as above just parsed to be modfied and used with ease. Technically you could get around not doing this, I just prefer to have it here.
        const obj = JSON.parse(myJSON);
        const img = JSON.parse(image);
        const productName = JSON.parse(name);
        // Since the product link is retruned in a form /productLink, this is needed to construct a full URL
        const productURL = "https://www.footshop.com/" + JSON.parse(productLink);
        // Debug code, not needed, I like to have it to make sure its working right.
        console.log("INSIDE FUNC PRODUCT LINK = " + productURL)
        const price = JSON.parse(totalPrice);
        const totalStock = JSON.parse(totalStockAPI);

        // More debug code that is not needed.
        console.log(productName);
        console.log(img);
        // Create an empty string to use for the webhook
        var sizes = ""
        var stock = ""
        var vars = ""
        var atcs = ""
        // Function to filter the data and select only the sizes that have stock above 0.
        const inStock = obj.filter(shoe => shoe.quantity > 0);
        // Debug code.
        console.log(inStock);
        // For loop to loop through the items filtered above.
        for(var i = 0; i<inStock.length; i++){
            // Debug code to make it easier to see the data in console
            console.log("=======================================");
            // Adds the US size to the list of sizes.
            sizes+=inStock[i].size_values.US;
            // Adds the quantity of the size.
            stock+=inStock[i].quantity;
            // Adds the ID of the product, aka the size SKU.
            vars+=inStock[i].id_product_attribute;
            // This line creates the add to cart (ATC) links. It uses data parsed above to create a unique ATC link for each in stock size of the shoe.
            // The format of this is created in such a way that when added to the discord webhook it will create a hyperlink.
            atcs += "["+inStock[i].size_values.US+"](https://www.footshop.com/?add=true&controller=cart&id_product="+sku+"&ipa="+inStock[i].id_product_attribute+"&qty=1)"
            // Adds new line character to each of the stored data sets. Not needed, but it makes things look nicer in the webhook.
            sizes += "\n"
            stock += "\n"
            atcs += "\n"
            // Debug code to see all the IN_STOCK sizes in the console, not needed but I like it.
            console.log("Size: " + inStock[i].size_values.US + " | " + inStock[i].quantity );
            // More debug code for better spacing.
            console.log("=======================================");
        }

        // This starts to create the discord webhook message that will be sent.
        const embed = new Discord.MessageEmbed()
                    // Title of the message is set to the name of the shoe.
                    .setTitle(productName)
                    // The title then gets changed into a hyperlink leading to the product url.
                    .setURL(productURL)
                    // Shows the total amount of stock for this shoe
                    .addField("TOTAL STOCK",totalStock)
                    // Shows the price of the shoe in USD
                    .addField("PRICE","$" + price)
                    // Color of the message. Right now selected blue, for "info", options can be added to change the color depending on the state. RED for OOS, Yellow for low stock etc
                    .setColor("#aabbcc")
                    // Creates INLINE text fields. This lines up 2 seprate text fields on 1 line. This will show the sizes column with ATC hyperlinks to each size
                    // and next to it, it will show the stock number for that given size. I like this format as its easy to read and you can quickly see the size
                    // you want to go for and quickly atc knowing what the stock number is.
                    .addField("SIZES",atcs, true)
                    .addField("STOCK", stock, true)
                    // Shows the image of the shoe in question. Done dynamically at the start and changes according to the sku.
                    .setThumbnail(img)
                    // Sets the avatar of the "User" to the YEEZY logo. Looks nice and will remain unchanged. 
                   // .setAvatar(logo)
                    // Sets the footer to credit me the creator :) my discord id and profile pic
                    .setFooter("Lil Chuk#0001" , chuk)
                    // Adds the time of the webhook
                    //.setTime()
                    .setTimestamp()

    // Crafts the client to send the webhook. Sets username to Footshop and the logo to the footshop logo.                
    webhookClient.send('', {
	    username: 'FootShop',
	    avatarURL: logo,
	    embeds: [embed],
});
        // Debug code to notify that the webhook was sent.
        console.log("Webhook sent!");
    }
    else{
        // Debug code showing there is no difference in the monitor status
        console.log("========================== NO DIFFERENCE ========================== ")
    }
})
// Set to arbitrary 5 seconds to monitor. This was the early version of this monitor and it has since been rewritten to use proxies.
// Footshop, like most other sites, will BAN you if you just keep spamming their apis with requests.
// This is more of a proof of concept and not to actaully be used to monitor. 
// The version I use to actaully monitor Footshop was a rewrite of this that adds proxy support as the main change.
// Using proxies allows to monitor the site with 0 delay to make sure any changes in the stock can be caught instantly. 
// I will not be uploading the rewritten better version of this monitor publiclly, sorry. 
// If you are an emplyer who wants to see that code, please contact me.
},5000)