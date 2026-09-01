import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useInterview } from '../features/interview/hooks/useInterview'
import ThemeToggle from './ThemeToggle'
import './sidebar.scss'

const TIPS = [
    "Research the company's recent news and product launches before your interview.",
    "Use the STAR method: Situation, Task, Action, Result for behavioral questions.",
    "Prepare 3–5 smart questions to ask your interviewer — it shows genuine interest.",
    "Practice speaking your answers aloud, not just in your head.",
    "Arrive (or log in) 10 minutes early to settle your nerves.",
    "It's okay to pause and think before answering — interviewers respect it.",
    "Follow up with a thank-you email within 24 hours after your interview.",
]

const NAV = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        )
    },
    {
        id: 'new',
        label: 'New Plan',
        path: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
            </svg>
        )
    },
]

const Sidebar = ({ open, onClose }) => {
    const { user, handleLogout } = useAuth()
    const { reports } = useInterview()
    const navigate = useNavigate()
    const location = useLocation()
    const [tipOpen, setTipOpen] = useState(false)

    const initials = user?.username
        ? user.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '??'

    const avgScore = reports && reports.length > 0
        ? Math.round(reports.reduce((s, r) => s + (r.matchScore || 0), 0) / reports.length)
        : null

    const bestScore = reports && reports.length > 0
        ? Math.max(...reports.map(r => r.matchScore || 0))
        : null

    const todayTip = TIPS[new Date().getDay() % TIPS.length]

    const doLogout = async () => {
        await handleLogout()
        navigate('/login')
    }

    const goTo = (path) => {
        navigate(path)
        onClose?.()
    }

    return (
        <>
            {/* Backdrop for mobile */}
            {open && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside className={`sidebar ${open ? 'sidebar--open' : ''}`}>

                {/* ── Profile ── */}
                <div className="sidebar__profile">
                    <div className="sidebar__avatar">{initials}</div>
                    <div className="sidebar__user-info">
                        <p className="sidebar__username">{user?.username || 'User'}</p>
                        <p className="sidebar__email">{user?.email || ''}</p>
                    </div>
                    {/* Close btn on mobile */}
                    <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="sidebar__divider" />

                {/* ── Navigation ── */}
                <nav className="sidebar__nav">
                    <p className="sidebar__section-label">Navigation</p>
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar__nav-item ${location.pathname === item.path && item.id === 'dashboard' ? 'sidebar__nav-item--active' : ''}`}
                            onClick={() => goTo(item.path)}
                        >
                            <span className="sidebar__nav-icon">{item.icon}</span>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="sidebar__divider" />

                {/* ── Stats ── */}
                {reports !== null && (
                    <div className="sidebar__stats">
                        <p className="sidebar__section-label">Your Stats</p>
                        <div className="sidebar__stat-grid">
                            <div className="sidebar__stat">
                                <span className="sidebar__stat-value">{reports?.length ?? 0}</span>
                                <span className="sidebar__stat-label">Plans Made</span>
                            </div>
                            <div className="sidebar__stat">
                                <span className="sidebar__stat-value">{avgScore !== null ? `${avgScore}%` : '—'}</span>
                                <span className="sidebar__stat-label">Avg Score</span>
                            </div>
                            <div className="sidebar__stat sidebar__stat--best">
                                <span className="sidebar__stat-value">{bestScore !== null ? `${bestScore}%` : '—'}</span>
                                <span className="sidebar__stat-label">Best Score</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Interview Tip ── */}
                <div className="sidebar__tip">
                    <button className="sidebar__tip-toggle" onClick={() => setTipOpen(o => !o)}>
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            Tip of the Day
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transform: tipOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.25s' }}>
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>
                    <div className={`sidebar__tip-body ${tipOpen ? 'sidebar__tip-body--open' : ''}`}>
                        <p>{todayTip}</p>
                    </div>
                </div>

                <div className="sidebar__divider" />

                {/* ── Theme Toggle ── */}
                <div className="sidebar__theme">
                    <p className="sidebar__section-label">Appearance</p>
                    <ThemeToggle />
                </div>

                {/* ── Spacer ── */}
                <div style={{ flex: 1 }} />

                {/* ── Recent Plans (mini list) ── */}
                {reports && reports.length > 0 && (
                    <div className="sidebar__recent">
                        <p className="sidebar__section-label">Recent Plans</p>
                        {reports.slice(0, 3).map(r => (
                            <button
                                key={r._id}
                                className="sidebar__recent-item"
                                onClick={() => goTo(`/interview/${r._id}`)}
                            >
                                <span className="sidebar__recent-title">{r.title || 'Untitled'}</span>
                                <span className={`sidebar__recent-score ${r.matchScore >= 80 ? 'score--high' : r.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                    {r.matchScore}%
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Logout ── */}
                <button className="sidebar__logout" onClick={doLogout}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                </button>
            </aside>
        </>
    )
}

export default Sidebar
