import React, { useState } from 'react'
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
    const { skills, skillsLoading, cycleStatus, removeSkill, statsMap } = useSkills()
    const [expanded, setExpanded] = useState(true)
    const [editingNotes, setEditingNotes] = useState(null) // skillId being edited
    const { updateNotes } = useSkills()

    if (skillsLoading) {
        return (
            <div className="skill-tracker">
                <div className="skill-tracker__loading">
                    <div className="skill-tracker__spinner" />
                </div>
            </div>
        )
    }

    return (
        <div className="skill-tracker">
            {/* Header */}
            <button className="skill-tracker__header" onClick={() => setExpanded(o => !o)}>
                <span className="skill-tracker__title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                    Skill Tracker
                    {skills.length > 0 && (
                        <span className="skill-tracker__count">{skills.length}</span>
                    )}
                </span>
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {/* Progress bar */}
            {skills.length > 0 && (
                <div className="skill-tracker__progress-row">
                    <div className="skill-tracker__progress-bar">
                        <div
                            className="skill-tracker__progress-fill"
                            style={{ width: `${Math.round((statsMap.mastered / statsMap.total) * 100)}%` }}
                        />
                    </div>
                    <span className="skill-tracker__progress-pct">
                        {Math.round((statsMap.mastered / statsMap.total) * 100)}%
                    </span>
                </div>
            )}

            {/* Body */}
            <div className={`skill-tracker__body ${expanded ? 'skill-tracker__body--open' : ''}`}>
                {skills.length === 0 ? (
                    <p className="skill-tracker__empty">
                        No skills tracked yet.<br />
                        Click <strong>+ Track</strong> on any skill gap in an interview plan.
                    </p>
                ) : (
                    <ul className="skill-tracker__list">
                        {skills.map((s, i) => (
                            <li
                                key={s._id}
                                className="skill-tracker__item"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <div className="skill-tracker__item-top">
                                    {/* Severity dot */}
                                    <span className={`skill-tracker__sev-dot ${SEVERITY_COLOR[s.severity]}`} title={`${s.severity} severity`} />

                                    {/* Skill name */}
                                    <span className="skill-tracker__skill-name">{s.skill}</span>

                                    {/* Delete */}
                                    <button
                                        className="skill-tracker__delete"
                                        onClick={() => removeSkill(s._id)}
                                        title="Remove from tracker"
                                        aria-label={`Remove ${s.skill}`}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Status toggle */}
                                <button
                                    className={`skill-tracker__status ${STATUS_META[s.status]?.color}`}
                                    onClick={() => cycleStatus(s._id)}
                                    title={`Click to advance → ${STATUS_META[s.status]?.next}`}
                                >
                                    {STATUS_META[s.status]?.label}
                                </button>

                                {/* Notes */}
                                {editingNotes === s._id ? (
                                    <textarea
                                        autoFocus
                                        className="skill-tracker__notes-input"
                                        defaultValue={s.notes}
                                        placeholder="Add notes..."
                                        onBlur={e => {
                                            updateNotes(s._id, e.target.value)
                                            setEditingNotes(null)
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === 'Escape') setEditingNotes(null)
                                        }}
                                    />
                                ) : (
                                    <button
                                        className="skill-tracker__notes-btn"
                                        onClick={() => setEditingNotes(s._id)}
                                    >
                                        {s.notes
                                            ? <span className="skill-tracker__notes-text">{s.notes}</span>
                                            : <span className="skill-tracker__notes-placeholder">+ Add note</span>
                                        }
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default SkillTracker
