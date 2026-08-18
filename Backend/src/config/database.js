const mongoose = require("mongoose")

let cachedPromise = null

async function connectToDB() {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection
    }

    if (!process.env.MONGO_URI) {
        console.error("MONGO_URI is not defined in environment variables")
        return null
    }

    if (!cachedPromise) {
        cachedPromise = mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
        }).then((mongooseInstance) => {
            console.log("Connected to MongoDB successfully")
            return mongooseInstance
        }).catch((err) => {
            cachedPromise = null
            console.error("MongoDB connection error:", err.message)
            throw err
        })
    }

    try {
        return await cachedPromise
    } catch (err) {
        cachedPromise = null
        throw err
    }
}

module.exports = connectToDB