import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main className="loading-screen">
                <div className="loading-screen__content">
                    <div className="loading-screen__ring" />
                    <h2>JobStand</h2>
                    <p>Signing you in<span className="loading-screen__dots"><span>.</span><span>.</span><span>.</span></span></p>
                </div>
            </main>
        )
    }

    if (!user) {
        return <Navigate to={'/login'} />
    }

    return children
}

export default Protected