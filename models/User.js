const mongoose = require("mongoose")
const { Schema } = mongoose

const userSchema = new Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: Number,
        default: 0 // 0 is for user and 1 is for admin
    },
    avatar: {
        type: String,
       default: "https://asset.cloudinary.com/sarafaman21212/7632a2e96b7e7b0bb5c9398c5e6aa790"
    },
    created_At: {
        type: Date,
        default: Date.now
    }

})

module.exports = mongoose.model("User", userSchema)