/* Polyfills for Node serverless environment */
if (typeof global.DOMMatrix === "undefined") {
    global.DOMMatrix = class DOMMatrix {
        constructor() {
            this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
        }
    }
}

let app
let initError = null

try {
    app = require("../Backend/src/app")
} catch (err) {
    console.error("Failed to load app from root api handler:", err)
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
