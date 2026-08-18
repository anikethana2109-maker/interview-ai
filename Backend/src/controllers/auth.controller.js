const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blacklist.model")

const getCookieOptions = () => {
    // Always use cross-site settings for production (different domains on Vercel)
    return {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}

/**
 * @name registerUserController
 * @description register a new user
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please provide username, email and password" })
        }

        const isUserAlreadyExists = await userModel.findOne({ $or: [{ username }, { email }] })

        if (isUserAlreadyExists) {
            return res.status(400).json({ message: "Account already exists with this email address or username" })
        }

        const hash = await bcrypt.hash(password, 10)
        const user = await userModel.create({ username, email, password: hash })

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("token", token, getCookieOptions())
        res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("Register error:", err)
        res.status(500).json({ message: err.message || "Registration failed" })
    }
}

/**
 * @name loginUserController
 * @description login a user
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("token", token, getCookieOptions())
        res.status(200).json({
            message: "User logged in successfully.",
            token,
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("Login error:", err)
        res.status(500).json({ message: err.message || "Login failed" })
    }
}

/**
 * @name logoutUserController
 * @description logout user and blacklist token
 * @access Public
 */
async function logoutUserController(req, res) {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization
        let token = req.cookies?.token
        if (!token && authHeader && authHeader.startsWith("Bearer ")) {
            token = authHeader.split(" ")[1]
        }

        if (token) {
            await tokenBlacklistModel.create({ token })
        }

        res.clearCookie("token", getCookieOptions())
        res.status(200).json({ message: "User logged out successfully" })
    } catch (err) {
        console.error("Logout error:", err)
        res.status(500).json({ message: err.message || "Logout failed" })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details
 * @access Private
 */
async function getMeController(req, res) {
    try {
        const user = await userModel.findById(req.user.id).select("-password")

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        res.status(200).json({
            message: "User details fetched successfully",
            user: { id: user._id, username: user.username, email: user.email }
        })
    } catch (err) {
        console.error("GetMe error:", err)
        res.status(500).json({ message: err.message || "Failed to fetch user" })
    }
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController }