const mongoose = require("mongoose")

const connectDb = () => {
    mongoose.connect( process.env.MONGO_URI, () => {
        console.log(` Database connection successfully !!! `. bgBlack)
    } )
}

module.exports = connectDb