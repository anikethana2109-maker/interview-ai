import React, { useState } from 'react'
import Sidebar from './Sidebar'
import SkillTracker from './SkillTracker'
import './app-layout.scss'

const AppLayout = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="app-layout">
            {/* ── Mobile top bar ── */}
            <header className="mobile-topbar">
                <button
                    className="mobile-topbar__menu"
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Open menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className="mobile-topbar__brand">
                    <span className="mobile-topbar__brand-name">Job<span className="mobile-topbar__brand-accent">Stand</span></span>
                    <span className="mobile-topbar__brand-slogan">Your career, elevated.</span>
                </div>
                <div className="mobile-topbar__spacer" />
            </header>

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <main className="app-layout__content">
                {children}
            </main>

            {/* Floating Skill Tracker badge — top-right, always visible */}
            <SkillTracker />
        </div>
    )
}

export default AppLayout
