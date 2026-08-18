import api from "../../../api"

export async function register({ username, email, password }) {
    const response = await api.post("/api/auth/register", { username, email, password })
    if (response.data?.token) {
        localStorage.setItem("token", response.data.token)
    }
    return response.data
}

export async function login({ email, password }) {
    const response = await api.post("/api/auth/login", { email, password })
    if (response.data?.token) {
        localStorage.setItem("token", response.data.token)
    }
    return response.data
}

export async function logout() {
    try {
        const response = await api.get("/api/auth/logout")
        return response.data
    } catch (err) {
        // ignore errors on logout
    } finally {
        localStorage.removeItem("token")
    }
}

export async function getMe() {
    const response = await api.get("/api/auth/get-me")
    return response.data
}