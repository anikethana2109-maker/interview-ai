import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router'
import { useAuth } from '../features/auth/hooks/useAuth'
import { useInterview } from '../features/interview/hooks/useInterview'
import { useTheme } from '../hooks/useTheme'
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
        id: 'dashboard', label: 'Dashboard', path: '/',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    },
    {
        id: 'new', label: 'New Plan', path: '/',
        icon: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
    },
]

// ── Floating Tooltip (portal — renders outside sidebar so overflow doesn't clip) ──
const SidebarTooltip = ({ text, top, visible }) =>
    createPortal(
        <div
            className={`sidebar-floatip ${visible ? 'sidebar-floatip--show' : ''}`}
            style={{ top, left: 72 }}   // 64px rail + 8px gap
        >
            <span className="sidebar-floatip__arrow" />
            {text}
        </div>,
        document.body
    )

// ── Sidebar ────────────────────────────────────────────────────────────────────
const Sidebar = ({ open, onClose }) => {
    const { user, handleLogout } = useAuth()
    const { reports }            = useInterview()
    const navigate               = useNavigate()
    const location               = useLocation()
    const sidebarRef             = useRef(null)

    const [tipOpen,  setTipOpen]  = useState(false)
    const [pinned,   setPinned]   = useState(false)

    // Floating tooltip state
    const [floatip, setFloatip] = useState({ text: '', top: 0, visible: false })

    const showTip = (e, text) => {
        if (pinned || open) return   // no tooltip when expanded
        const r = e.currentTarget.getBoundingClientRect()
        setFloatip({ text, top: r.top + r.height / 2, visible: true })
    }
    const hideTip = () => setFloatip(f => ({ ...f, visible: false }))

    // Computed values
    const initials  = user?.username
        ? user.username.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '??'
    const avgScore  = reports?.length
        ? Math.round(reports.reduce((s, r) => s + (r.matchScore || 0), 0) / reports.length)
        : null
    const bestScore = reports?.length
        ? Math.max(...reports.map(r => r.matchScore || 0))
        : null
    const todayTip  = TIPS[new Date().getDay() % TIPS.length]

    // Click any part of the rail → expand
    const expand = () => { if (!pinned) setPinned(true) }

    const { theme, toggleTheme } = useTheme()

    const goTo = (path, id) => {
        navigate(path)
        if (id === 'new') {
            setTimeout(() => {
                const el = document.getElementById('new-plan-form')
                    || document.querySelector('.home-form, form')
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }, 150)
        }
        // On mobile (drawer mode) close it; on desktop keep sidebar open
        if (open) onClose?.()
    }

    const doLogout = async () => { await handleLogout(); navigate('/login') }

    // Click outside → collapse
    useEffect(() => {
        if (!pinned) return
        const handler = (e) => {
            if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
                setPinned(false)
            }
        }
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 80)
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
    }, [pinned])

    const isExpanded = pinned || open
    const cls = ['sidebar', open ? 'sidebar--open' : '', pinned ? 'sidebar--pinned' : ''].filter(Boolean).join(' ')

    return (
        <>
            {/* Portal tooltip — lives outside the sidebar, no clipping */}
            <SidebarTooltip {...floatip} />

            {open && <div className="sidebar-backdrop" onClick={onClose} />}

            <aside className={cls} ref={sidebarRef} onClick={expand}>


                {/* ── Profile ── */}
                <div className="sidebar__profile">
                    <div
                        className="sidebar__avatar"
                        onMouseEnter={e => showTip(e, 'Expand sidebar')}
                        onMouseLeave={hideTip}
                    >
                        {initials}
                    </div>

                    {isExpanded && (
                        <div className="sidebar__user-info">
                            <p className="sidebar__username">{user?.username || 'User'}</p>
                            <p className="sidebar__email">{user?.email || ''}</p>
                        </div>
                    )}

                    {isExpanded && (
                        <button
                            className="sidebar__collapse-btn"
                            onClick={e => { e.stopPropagation(); setPinned(false); onClose?.() }}
                            title="Collapse"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6"/>
                            </svg>
                        </button>
                    )}
                </div>

                <div className="sidebar__divider" />

                {/* ── Navigation ── */}
                <nav className="sidebar__nav">
                    {NAV.map(item => (
                        <button
                            key={item.id}
                            className={`sidebar__nav-item ${location.pathname === '/' && item.id === 'dashboard' ? 'sidebar__nav-item--active' : ''} ${isExpanded ? 'sidebar__nav-item--expanded' : ''}`}
                            onClick={() => goTo(item.path, item.id)}
                            onMouseEnter={e => showTip(e, item.label)}
                            onMouseLeave={hideTip}
                        >
                            <span className="sidebar__nav-icon">{item.icon}</span>
                            {isExpanded && <span className="sidebar__label">{item.label}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar__divider" />

                {/* ── Stats ── */}
                {reports !== null && (
                    <>
                        {!isExpanded ? (
                            <div className="sidebar__rail-group">
                                <span className="sidebar__rail-icon" onMouseEnter={e => showTip(e, `${reports?.length ?? 0} Plans made`)} onMouseLeave={hideTip}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                </span>
                                <span className="sidebar__rail-icon sidebar__rail-icon--avg" onMouseEnter={e => showTip(e, `Avg Score: ${avgScore ?? '–'}%`)} onMouseLeave={hideTip}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                                </span>
                                <span className="sidebar__rail-icon sidebar__rail-icon--best" onMouseEnter={e => showTip(e, `Best Score: ${bestScore ?? '–'}%`)} onMouseLeave={hideTip}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                </span>
                            </div>
                        ) : (
                            <div className="sidebar__expanded-section" onClick={e => e.stopPropagation()}>
                                <p className="sidebar__section-label">Your Stats</p>
                                <div className="sidebar__stat-grid">
                                    <div className="sidebar__stat">
                                        <span className="sidebar__stat-value">{reports?.length ?? 0}</span>
                                        <span className="sidebar__stat-label">Plans Made</span>
                                    </div>
                                    <div className="sidebar__stat">
                                        <span className="sidebar__stat-value">{avgScore != null ? `${avgScore}%` : '—'}</span>
                                        <span className="sidebar__stat-label">Avg Score</span>
                                    </div>
                                    <div className="sidebar__stat sidebar__stat--wide">
                                        <span className="sidebar__stat-value">{bestScore != null ? `${bestScore}%` : '—'}</span>
                                        <span className="sidebar__stat-label">Best Score</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="sidebar__divider" />
                    </>
                )}

                {/* ── Skill Tracker — now a global floating badge (top-right) ── */}
                {!isExpanded ? (
                    <div className="sidebar__rail-group">
                        <span className="sidebar__rail-icon sidebar__rail-icon--skill" onMouseEnter={e => showTip(e, 'Skill Tracker')} onMouseLeave={hideTip}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                        </span>
                    </div>
                ) : (
                    <div className="sidebar__expanded-section" onClick={e => e.stopPropagation()}>
                        <p className="sidebar__section-label">Skill Tracker</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                            Track your skills via the <strong style={{ color: 'var(--accent)' }}>⚡ Skills badge</strong> in the top-right corner.
                        </p>
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Tip of the Day ── */}
                {!isExpanded ? (
                    <div className="sidebar__rail-group">
                        <span className="sidebar__rail-icon sidebar__rail-icon--tip" onMouseEnter={e => showTip(e, 'Tip of the Day')} onMouseLeave={hideTip}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        </span>
                    </div>
                ) : (
                    <div className="sidebar__expanded-section" onClick={e => e.stopPropagation()}>
                        <button className="sidebar__tip-toggle" onClick={() => setTipOpen(o => !o)}>
                            <span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                Tip of the Day
                            </span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: tipOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        <div className={`sidebar__tip-body ${tipOpen ? 'sidebar__tip-body--open' : ''}`}>
                            <p>{todayTip}</p>
                        </div>
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Recent Plans (expanded only) ── */}
                {isExpanded && reports && reports.length > 0 && (
                    <div className="sidebar__expanded-section" onClick={e => e.stopPropagation()}>
                        <p className="sidebar__section-label">Recent Plans</p>
                        {reports.slice(0, 3).map(r => (
                            <button key={r._id} className="sidebar__recent-item" onClick={() => goTo(`/interview/${r._id}`)}>
                                <span className="sidebar__recent-title">{r.title || 'Untitled'}</span>
                                <span className={`sidebar__recent-score ${r.matchScore >= 80 ? 'score--high' : r.matchScore >= 60 ? 'score--mid' : 'score--low'}`}>{r.matchScore}%</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="sidebar__spacer" />

                {/* ── Theme — functional in BOTH states ── */}
                {!isExpanded ? (
                    <div className="sidebar__rail-group">
                        <button
                            className="sidebar__rail-icon sidebar__rail-icon--theme"
                            onClick={e => { e.stopPropagation(); toggleTheme() }}
                            onMouseEnter={e => showTip(e, `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`)}
                            onMouseLeave={hideTip}
                            title="Toggle theme"
                        >
                            {theme === 'dark'
                                ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/></svg>
                                : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                            }
                        </button>
                    </div>
                ) : (
                    <div className="sidebar__expanded-section" onClick={e => e.stopPropagation()}>
                        <p className="sidebar__section-label">Appearance</p>
                        <ThemeToggle />
                    </div>
                )}

                <div className="sidebar__divider" />

                {/* ── Logout ── */}
                <button
                    className={`sidebar__logout ${isExpanded ? 'sidebar__logout--expanded' : ''}`}
                    onClick={e => { e.stopPropagation(); doLogout() }}
                    onMouseEnter={e => showTip(e, 'Sign Out')}
                    onMouseLeave={hideTip}
                >
                    <span className="sidebar__nav-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                    </span>
                    {isExpanded && <span className="sidebar__label">Sign Out</span>}
                </button>

            </aside>
        </>
    )
}

export default Sidebar
