import React, { useState, useEffect, useRef } from 'react'
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
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
        )
    },
    {
        id: 'new', label: 'New Plan', path: '/',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
        )
    },
]

const Sidebar = ({ open, onClose }) => {
    const { user, handleLogout } = useAuth()
    const { reports }            = useInterview()
    const navigate               = useNavigate()
    const location               = useLocation()
    const [tipOpen, setTipOpen]  = useState(false)
    const [pinned,  setPinned]   = useState(false)   // expanded when true
    const sidebarRef             = useRef(null)

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

    // Any click on the collapsed sidebar → expand it
    const expand = () => { if (!pinned) setPinned(true) }

    const goTo = (path) => {
        expand()
        navigate(path)
        onClose?.()
    }

    // Click outside while expanded → collapse
    useEffect(() => {
        if (!pinned) return
        const handler = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setPinned(false)
            }
        }
        // slight delay so the click that opened doesn't immediately close it
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
    }, [pinned])

    const cls = ['sidebar', open ? 'sidebar--open' : '', pinned ? 'sidebar--pinned' : ''].filter(Boolean).join(' ')

    return (
        <>
            {open && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside className={cls} ref={sidebarRef}>

                {/* ── Profile ── */}
                <div className="sidebar__profile" onClick={expand}>
                    <button
                        className="sidebar__avatar"
                        aria-label="Expand sidebar"
                        tabIndex={-1}  // parent handles click
                    >
                        {initials}
                    </button>

                    {/* Shown only when expanded */}
                    <div className="sidebar__user-info sidebar__expandable">
                        <p className="sidebar__username">{user?.username || 'User'}</p>
                        <p className="sidebar__email">{user?.email || ''}</p>
                    </div>

                    {/* Collapse button — only shown when expanded */}
                    <button
                        className="sidebar__collapse-btn sidebar__expandable-inline"
                        onClick={(e) => { e.stopPropagation(); setPinned(false) }}
                        title="Minimise sidebar"
                        aria-label="Minimise sidebar"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                    </button>

                    {/* Mobile close */}
                    <button className="sidebar__close" onClick={onClose} aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                <div className="sidebar__divider" />

                {/* ── Navigation ── */}
                <nav className="sidebar__nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar__nav-item ${location.pathname === item.path && item.id === 'dashboard' ? 'sidebar__nav-item--active' : ''}`}
                            onClick={() => goTo(item.path)}
                            data-tip={item.label}
                        >
                            <span className="sidebar__nav-icon">{item.icon}</span>
                            <span className="sidebar__label-text">{item.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="sidebar__divider" />

                {/* ── Stats ── */}
                {reports !== null && (
                    <div className="sidebar__section" onClick={expand}>
                        {/* Collapsed: icon dots with tooltips */}
                        <div className="sidebar__compact-col">
                            <span className="sidebar__stat-dot" data-tip={`${reports?.length ?? 0} Plans`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </span>
                            <span className="sidebar__stat-dot sidebar__stat-dot--avg" data-tip={`Avg Score: ${avgScore ?? '–'}%`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                            </span>
                            <span className="sidebar__stat-dot sidebar__stat-dot--best" data-tip={`Best: ${bestScore ?? '–'}%`}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </span>
                        </div>

                        {/* Expanded: full stats */}
                        <div className="sidebar__expandable sidebar__stats-body">
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
                )}

                <div className="sidebar__divider" />

                {/* ── Skill Tracker ── */}
                <div className="sidebar__section" onClick={expand}>
                    <div className="sidebar__compact-col">
                        <span className="sidebar__stat-dot" data-tip="Skill Tracker">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </span>
                    </div>
                    <div className="sidebar__expandable">
                        <SkillTracker />
                    </div>
                </div>

                <div className="sidebar__divider" />

                {/* ── Tip of the Day ── */}
                <div className="sidebar__section" onClick={expand}>
                    <div className="sidebar__compact-col">
                        <span className="sidebar__stat-dot sidebar__stat-dot--tip" data-tip="Tip of the Day">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </span>
                    </div>
                    <div className="sidebar__expandable sidebar__tip">
                        <button className="sidebar__tip-toggle" onClick={(e) => { e.stopPropagation(); setTipOpen(o => !o) }}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                Tip of the Day
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                style={{ transform: tipOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        <div className={`sidebar__tip-body ${tipOpen ? 'sidebar__tip-body--open' : ''}`}>
                            <p>{todayTip}</p>
                        </div>
                    </div>
                </div>

                <div className="sidebar__divider" />

                {/* ── Recent Plans ── */}
                {reports && reports.length > 0 && (
                    <div className="sidebar__expandable sidebar__recent">
                        <p className="sidebar__section-label">Recent Plans</p>
                        {reports.slice(0, 3).map(r => (
                            <button key={r._id} className="sidebar__recent-item" onClick={() => navigate(`/interview/${r._id}`)}>
                                <span className="sidebar__recent-title">{r.title || 'Untitled'}</span>
                                <span className={`sidebar__recent-score ${r.matchScore >= 80 ? 'score--high' : r.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>
                                    {r.matchScore}%
                                </span>
                            </button>
                        ))}
                        <div className="sidebar__divider" />
                    </div>
                )}

                <div className="sidebar__spacer" />

                {/* ── Theme Toggle ── */}
                <div className="sidebar__section" onClick={expand}>
                    <div className="sidebar__compact-col">
                        <span className="sidebar__stat-dot sidebar__stat-dot--theme" data-tip="Toggle Theme">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                        </span>
                    </div>
                    <div className="sidebar__expandable sidebar__theme-row">
                        <p className="sidebar__section-label">Appearance</p>
                        <ThemeToggle />
                    </div>
                </div>

                <div className="sidebar__divider" />

                {/* ── Logout ── */}
                <button className="sidebar__logout" onClick={doLogout} data-tip="Sign Out">
                    <span className="sidebar__nav-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                            <polyline points="16 17 21 12 16 7"/>
                            <line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </span>
                    <span className="sidebar__label-text">Sign Out</span>
                </button>

            </aside>
        </>
    )
}

export default Sidebar
