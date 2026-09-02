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
                    <div className="mobile-topbar__brand-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
                            <line x1="12" y1="12" x2="12" y2="16"/>
                            <line x1="10" y1="14" x2="14" y2="14"/>
                        </svg>
                    </div>
                    <div className="mobile-topbar__brand-text">
                        <span className="mobile-topbar__brand-name">Job<span className="mobile-topbar__brand-accent">Stand</span></span>
                        <span className="mobile-topbar__brand-slogan">Your career, elevated.</span>
                    </div>
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
