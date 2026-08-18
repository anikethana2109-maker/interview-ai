const mongoose = require("mongoose")


let isConnected = false

async function connectToDB() {

    if (isConnected) {
        console.log("Using existing database connection")
        return
    }

    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not defined in environment variables")
        return
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)
        isConnected = true
        console.log("Connected to Database")
    }
    catch (err) {
        console.error("Database connection error:", err.message)
    }
}

module.exports = connectToDB