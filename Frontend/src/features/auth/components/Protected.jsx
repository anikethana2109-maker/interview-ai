import { useAuth } from "../hooks/useAuth";
import { Navigate } from "react-router";
import React from 'react'

const Protected = ({children}) => {
    const { loading, user } = useAuth()

    if (loading) {
        return (
            <main className="loading-screen">
                <div className="loading-screen__orbs">
                    <div className="loading-screen__orb loading-screen__orb--1" />
                    <div className="loading-screen__orb loading-screen__orb--2" />
                    <div className="loading-screen__orb loading-screen__orb--3" />
                </div>
                <div className="loading-screen__content">
                    <div className="loading-screen__logo">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <h2>InterviewAI<span className="loading-screen__dots"><span>.</span><span>.</span><span>.</span></span></h2>
                    <p>Signing you in</p>
                    <div className="loading-screen__bar">
                        <div className="loading-screen__bar-fill" />
                    </div>
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