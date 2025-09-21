const mongoose = require('mongoose');

require("dotenv").config();
const dbConnect = () => {
    mongoose.connect(process.env.DATABASE_URL)
    .then(() => { console.log("db ka connection sucessfull");})
    .catch((error) => {
    console.log("Issue in db connection");
    console.error(error.message);
    process.exit(1);
});
    
}

module.exports = dbConnect;