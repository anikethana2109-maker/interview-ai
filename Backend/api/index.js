let app
let initError = null

try {
    app = require("../src/app")
} catch (err) {
    console.error("Failed to load app:", err)
    initError = err
}

module.exports = (req, res) => {
    if (initError) {
        return res.status(500).json({
            error: "Initialization Error",
            message: initError.message,
            stack: initError.stack
        })
    }
    return app(req, res)
}
