import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useInterview } from '../features/interview/hooks/useInterview'
import ThemeToggle from './ThemeToggle'
import SkillTracker from './SkillTracker'
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
        id: 'dashboard', label: 'Dashboard', path: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
        )
    },
    {
        id: 'new', label: 'New Plan', path: '/',
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
    const navigate  = useNavigate()
    const location  = useLocation()
    const [tipOpen,  setTipOpen]  = useState(false)
    const [expanded, setExpanded] = useState(false)

    const initials = user?.username
        ? user.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '??'

    const avgScore  = reports?.length
        ? Math.round(reports.reduce((s, r) => s + (r.matchScore || 0), 0) / reports.length)
        : null

    const bestScore = reports?.length
        ? Math.max(...reports.map(r => r.matchScore || 0))
        : null

    const todayTip = TIPS[new Date().getDay() % TIPS.length]

    const doLogout = async () => { await handleLogout(); navigate('/login') }
    const goTo = (path) => { navigate(path); onClose?.() }

    const cls = ['sidebar', open ? 'sidebar--open' : '', expanded ? 'sidebar--expanded' : '']
        .filter(Boolean).join(' ')

    return (
        <>
            {open && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside
                className={cls}
                onMouseEnter={() => setExpanded(true)}
                onMouseLeave={() => setExpanded(false)}
            >

                {/* ── Profile ── */}
                <div className="sidebar__profile">
                    <div className="sidebar__avatar">{initials}</div>

                    <div className="sidebar__expandable">
                        <div className="sidebar__user-info">
                            <p className="sidebar__username">{user?.username || 'User'}</p>
                            <p className="sidebar__email">{user?.email || ''}</p>
                        </div>
                    </div>

                    <button className="sidebar__close" onClick={onClose} aria-label="Close sidebar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <div className="sidebar__divider" />

                {/* ── Navigation ── */}
                <nav className="sidebar__nav">
                    <div className="sidebar__expandable">
                        <p className="sidebar__section-label">Navigation</p>
                    </div>
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            title={item.label}
                            className={`sidebar__nav-item ${location.pathname === item.path && item.id === 'dashboard' ? 'sidebar__nav-item--active' : ''}`}
                            onClick={() => goTo(item.path)}
                        >
                            <span className="sidebar__nav-icon">{item.icon}</span>
                            <span className="sidebar__label-text">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar__divider" />

                {/* ── Stats ── */}
                {reports !== null && (
                    <div className="sidebar__stats">
                        {/* Collapsed: compact dots */}
                        <div className="sidebar__compact">
                            <span className="sidebar__stat-dot" title={`Plans: ${reports?.length ?? 0}`}>{reports?.length ?? 0}</span>
                            <span className="sidebar__stat-dot sidebar__stat-dot--avg" title={`Avg: ${avgScore ?? '—'}%`}>{avgScore ?? '—'}</span>
                            <span className="sidebar__stat-dot sidebar__stat-dot--best" title={`Best: ${bestScore ?? '—'}%`}>★</span>
                        </div>
                        {/* Expanded: full grid */}
                        <div className="sidebar__expandable">
                            <div className="sidebar__stats-body">
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
                        </div>
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Skill Tracker ── */}
                <div className="sidebar__expandable"><SkillTracker /></div>
                <div className="sidebar__compact">
                    <span className="sidebar__stat-dot" title="Skill Tracker" style={{ fontSize: '0.95rem' }}>⚡</span>
                </div>

                <div className="sidebar__divider" />

                {/* ── Tip of the Day ── */}
                <div className="sidebar__expandable">
                    <div className="sidebar__tip">
                        <button className="sidebar__tip-toggle" onClick={() => setTipOpen(o => !o)}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                Tip of the Day
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: tipOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        <div className={`sidebar__tip-body ${tipOpen ? 'sidebar__tip-body--open' : ''}`}>
                            <p>{todayTip}</p>
                        </div>
                    </div>
                </div>
                <div className="sidebar__compact">
                    <span className="sidebar__stat-dot" title="Tip of the Day" style={{ fontSize: '0.95rem' }}>💡</span>
                </div>

                <div className="sidebar__divider" />

                {/* ── Recent Plans ── */}
                {reports && reports.length > 0 && (
                    <div className="sidebar__expandable">
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
                        <div className="sidebar__divider" />
                    </div>
                )}

                {/* ── Spacer ── */}
                <div className="sidebar__spacer" />

                {/* ── Theme Toggle ── */}
                <div className="sidebar__expandable">
                    <div className="sidebar__theme">
                        <p className="sidebar__section-label">Appearance</p>
                        <ThemeToggle />
                    </div>
                </div>
                <div className="sidebar__compact">
                    <span className="sidebar__stat-dot" title="Toggle Theme" style={{ fontSize: '0.95rem' }}>🌙</span>
                </div>

                <div className="sidebar__divider" />

                {/* ── Logout ── */}
                <button className="sidebar__logout" onClick={doLogout} title="Sign Out">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span className="sidebar__logout-text">Sign Out</span>
                </button>

            </aside>
        </>
    )
}

export default Sidebar
