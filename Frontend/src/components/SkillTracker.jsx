import React, { useState, useRef, useEffect } from 'react'
import { useSkills } from '../features/skills/hooks/useSkills'
import './skill-tracker.scss'

const STATUS_META = {
    'not-started': { label: 'Not Started', color: 'status--not-started', next: 'In Progress →' },
    'in-progress':  { label: 'In Progress',  color: 'status--in-progress',  next: 'Mastered →'   },
    'mastered':     { label: 'Mastered',      color: 'status--mastered',      next: '↩ Reset'      },
}

const SEVERITY_COLOR = {
    high:   'sev--high',
    medium: 'sev--medium',
    low:    'sev--low',
}

const SkillTracker = () => {
    const { skills, skillsLoading, cycleStatus, removeSkill, statsMap, updateNotes } = useSkills()
    const [open,         setOpen]         = useState(false)
    const [editingNotes, setEditingNotes] = useState(null)
    const panelRef = useRef(null)

    const mastered   = statsMap?.mastered ?? 0
    const total      = statsMap?.total    ?? 0
    const pct        = total > 0 ? Math.round((mastered / total) * 100) : 0
    const inProgress = skills.filter(s => s.status === 'in-progress').length

    // Click outside → close
    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
        }
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 60)
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
    }, [open])

    return (
        <div className="st-badge-root" ref={panelRef}>

            {/* ── Compact Badge ── */}
            <button
                className={`st-badge ${open ? 'st-badge--open' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-label="Skill Tracker"
                title="Skill Tracker"
            >
                {/* Icon */}
                <span className="st-badge__icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                </span>

                {/* Label — hidden when closed on small screens */}
                <span className="st-badge__label">Skills</span>

                {/* Count bubble */}
                {skills.length > 0 && (
                    <span className="st-badge__count">{skills.length}</span>
                )}

                {/* Progress ring indicator */}
                {total > 0 && (
                    <span className={`st-badge__pct ${pct === 100 ? 'st-badge__pct--done' : ''}`}>
                        {pct}%
                    </span>
                )}

                {/* Chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="st-badge__chevron"
                    style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {/* ── Expanded Panel ── */}
            <div className={`st-panel ${open ? 'st-panel--open' : ''}`}>

                {/* Panel header */}
                <div className="st-panel__header">
                    <span className="st-panel__title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Skill Tracker
                        {skills.length > 0 && (
                            <span className="st-panel__count">{skills.length}</span>
                        )}
                    </span>
                    <button className="st-panel__close" onClick={() => setOpen(false)} aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Progress bar */}
                {total > 0 && (
                    <div className="st-panel__progress-row">
                        <div className="st-panel__progress-bar">
                            <div className="st-panel__progress-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="st-panel__pct">{pct}%</span>
                    </div>
                )}

                {/* Stats strip */}
                {total > 0 && (
                    <div className="st-panel__stats">
                        <span className="st-panel__stat">
                            <span className="st-panel__stat-val">{total}</span> total
                        </span>
                        <span className="st-panel__stat-sep" />
                        <span className="st-panel__stat st-panel__stat--prog">
                            <span className="st-panel__stat-val">{inProgress}</span> in progress
                        </span>
                        <span className="st-panel__stat-sep" />
                        <span className="st-panel__stat st-panel__stat--done">
                            <span className="st-panel__stat-val">{mastered}</span> mastered
                        </span>
                    </div>
                )}

                <div className="st-panel__divider" />

                {/* Body */}
                <div className="st-panel__body">
                    {skillsLoading ? (
                        <div className="st-panel__loading">
                            <div className="st-panel__spinner" />
                        </div>
                    ) : skills.length === 0 ? (
                        <p className="st-panel__empty">
                            No skills tracked yet.<br/>
                            Click <strong>+ Track</strong> on any skill gap in an interview plan.
                        </p>
                    ) : (
                        <ul className="st-panel__list">
                            {skills.map((s, i) => (
                                <li key={s._id} className="st-panel__item" style={{ animationDelay: `${i * 0.04}s` }}>
                                    <div className="st-panel__item-top">
                                        <span className={`st-panel__sev-dot ${SEVERITY_COLOR[s.severity]}`} title={`${s.severity} severity`} />
                                        <span className="st-panel__skill-name">{s.skill}</span>
                                        <button
                                            className="st-panel__delete"
                                            onClick={() => removeSkill(s._id)}
                                            title="Remove"
                                            aria-label={`Remove ${s.skill}`}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                                            </svg>
                                        </button>
                                    </div>

                                    <button
                                        className={`st-panel__status ${STATUS_META[s.status]?.color}`}
                                        onClick={() => cycleStatus(s._id)}
                                        title={`Click → ${STATUS_META[s.status]?.next}`}
                                    >
                                        {STATUS_META[s.status]?.label}
                                    </button>

                                    {editingNotes === s._id ? (
                                        <textarea
                                            autoFocus
                                            className="st-panel__notes-input"
                                            defaultValue={s.notes}
                                            placeholder="Add notes..."
                                            onBlur={e => { updateNotes(s._id, e.target.value); setEditingNotes(null) }}
                                            onKeyDown={e => { if (e.key === 'Escape') setEditingNotes(null) }}
                                        />
                                    ) : (
                                        <button className="st-panel__notes-btn" onClick={() => setEditingNotes(s._id)}>
                                            {s.notes
                                                ? <span className="st-panel__notes-text">{s.notes}</span>
                                                : <span className="st-panel__notes-placeholder">+ Add note</span>
                                            }
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

export default SkillTracker
