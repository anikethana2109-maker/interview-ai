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
    origin: [
        "http://localhost:5173",
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
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


/* using all the routes here */
app.use("/api/auth", authRouter)
app.use("/api/interview", interviewRouter)

/* Global error handler */
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err.message)
    res.status(500).json({ message: "Internal server error" })
})

module.exports = app