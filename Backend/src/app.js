/* Polyfills for Node serverless environment */
if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        }
    }
}

const path = require("path")
require("dotenv").config({ path: path.resolve(__dirname, "../.env") })
const express = require("express")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const connectToDB = require("./config/database")

const app = express()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true)
        return callback(null, true)
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"]
}))

/* Lazy DB connection middleware — connects on first request, reuses after */
app.use(async (req, res, next) => {
    try {
        await connectToDB()
        next()
    } catch (err) {
        console.error("DB connection failed:", err.message)
        res.status(500).json({ message: "Database connection failed" })
    }
})

/* require all the routes here */
const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")


/* root routes for health check */
app.get("/", (req, res) => {
    res.status(200).json({ status: "ok", message: "Interview AI Backend is running" })
})

app.get("/api", (req, res) => {
    res.status(200).json({ status: "ok", message: "Interview AI Backend API is running" })
})

/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* Global error handler */
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message)
    res.status(500).json({ message: "Internal server error" })
})

module.exports = app