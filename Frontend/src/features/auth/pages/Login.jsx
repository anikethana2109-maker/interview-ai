import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {
    const { loading, handleLogin } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError("")
        setSubmitting(true)
        const result = await handleLogin({ email, password })
        setSubmitting(false)
        if (result?.success) {
            navigate("/")
        } else {
            setError(result?.message || "Login failed. Please try again.")
        }
    }

    if (loading && !submitting) {
        return (
            <main className="auth-loading">
                <div className="spinner" />
                <p>Checking session...</p>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">
                <h1>Welcome Back</h1>
                <p className="form-subtitle">Sign in to your account</p>

                {error && <div className="form-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email" id="email" name="email"
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
                            type="password" id="password" name="password"
                            placeholder="Enter password"
                            required
                        />
                    </div>
                    <button className="button primary-button" disabled={submitting}>
                        {submitting ? "Signing in..." : "Login"}
                    </button>
                </form>
                <p>Don't have an account? <Link to="/register">Register</Link></p>
            </div>
        </main>
    )
}

export default Login