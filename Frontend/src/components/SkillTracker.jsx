import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useSkills } from '../features/skills/hooks/useSkills'
import './skill-tracker.scss'

const STATUS_META = {
    'not-started': { label: 'Not Started', color: 'status--not-started', next: 'In Progress' },
    'in-progress':  { label: 'In Progress',  color: 'status--in-progress',  next: 'Mastered'   },
    'mastered':     { label: 'Mastered',      color: 'status--mastered',      next: 'Reset'      },
}

const SEV_META = {
    high:   { label: 'High',   cls: 'sev--high'   },
    medium: { label: 'Medium', cls: 'sev--medium' },
    low:    { label: 'Low',    cls: 'sev--low'    },
}

const FILTERS = ['all', 'not-started', 'in-progress', 'mastered']
const FILTER_LABELS = { all: 'All', 'not-started': 'Not Started', 'in-progress': 'In Progress', mastered: 'Mastered' }

const SORT_OPTIONS = [
    { value: 'severity', label: 'Severity' },
    { value: 'status',   label: 'Status'   },
    { value: 'name',     label: 'Name'     },
]

const SEV_ORDER = { high: 0, medium: 1, low: 2 }
const STATUS_ORDER = { 'not-started': 0, 'in-progress': 1, mastered: 2 }

// ── Mini donut ring ────────────────────────────────────────────────────────────
const DonutRing = ({ pct, size = 64, stroke = 6 }) => {
    const r = (size - stroke) / 2
    const circ = 2 * Math.PI * r
    const offset = circ - (pct / 100) * circ
    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="st-donut">
            <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-color)" strokeWidth={stroke} />
            <circle
                cx={size/2} cy={size/2} r={r} fill="none"
                stroke="var(--accent)" strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                style={{ fontSize: size * 0.22, fontWeight: 900, fill: 'var(--text-primary)', fontFamily: 'Inter, system-ui' }}>
                {pct}%
            </text>
        </svg>
    )
}

// ── Skill Item ─────────────────────────────────────────────────────────────────
const SkillItem = ({ s, idx, cycleStatus, removeSkill, updateNotes }) => {
    const [editingNotes, setEditingNotes] = useState(false)
    const [noteVal, setNoteVal] = useState(s.notes || '')

    return (
        <li className="st-item" style={{ animationDelay: `${idx * 0.04}s` }}>
            {/* Top row */}
            <div className="st-item__top">
                <span className={`st-item__sev-badge ${SEV_META[s.severity]?.cls}`}>
                    {SEV_META[s.severity]?.label}
                </span>
                <span className="st-item__name">{s.skill}</span>
                <button
                    className="st-item__delete"
                    onClick={() => removeSkill(s._id)}
                    title="Remove"
                    aria-label={`Remove ${s.skill}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                </button>
            </div>

            {/* Status + next action */}
            <div className="st-item__actions">
                <button
                    className={`st-item__status ${STATUS_META[s.status]?.color}`}
                    onClick={() => cycleStatus(s._id)}
                    title={`Advance to: ${STATUS_META[s.status]?.next}`}
                >
                    <span className="st-item__status-dot" />
                    {STATUS_META[s.status]?.label}
                </button>
                <span className="st-item__next-hint">
                    → {STATUS_META[s.status]?.next}
                </span>
            </div>

            {/* Notes */}
            {editingNotes ? (
                <textarea
                    autoFocus
                    className="st-item__notes-input"
                    value={noteVal}
                    placeholder="Add notes, resources, or reminders…"
                    onChange={e => setNoteVal(e.target.value)}
                    onBlur={() => { updateNotes(s._id, noteVal); setEditingNotes(false) }}
                    onKeyDown={e => { if (e.key === 'Escape') setEditingNotes(false) }}
                />
            ) : (
                <button className="st-item__notes-btn" onClick={() => setEditingNotes(true)}>
                    {s.notes
                        ? <span className="st-item__notes-text">📝 {s.notes}</span>
                        : <span className="st-item__notes-ph">+ Add note or resource…</span>
                    }
                </button>
            )}
        </li>
    )
}

// ── Main Component ─────────────────────────────────────────────────────────────
const SkillTracker = () => {
    const { skills, skillsLoading, cycleStatus, removeSkill, statsMap, updateNotes } = useSkills()
    const [open,    setOpen]    = useState(false)
    const [filter,  setFilter]  = useState('all')
    const [sort,    setSort]    = useState('severity')
    const [search,  setSearch]  = useState('')
    const panelRef = useRef(null)

    const total      = statsMap?.total      ?? 0
    const mastered   = statsMap?.mastered   ?? 0
    const inProgress = skills.filter(s => s.status === 'in-progress').length
    const notStarted = skills.filter(s => s.status === 'not-started').length
    const pct        = total > 0 ? Math.round((mastered / total) * 100) : 0

    // Click outside → close
    useEffect(() => {
        if (!open) return
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
        }
        const t = setTimeout(() => document.addEventListener('mousedown', handler), 60)
        return () => { clearTimeout(t); document.removeEventListener('mousedown', handler) }
    }, [open])

    // Filter + sort + search
    const filtered = useMemo(() => {
        let list = [...skills]
        if (filter !== 'all')  list = list.filter(s => s.status === filter)
        if (search.trim())     list = list.filter(s => s.skill.toLowerCase().includes(search.toLowerCase()))
        list.sort((a, b) => {
            if (sort === 'severity') return (SEV_ORDER[a.severity] ?? 3) - (SEV_ORDER[b.severity] ?? 3)
            if (sort === 'status')   return (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3)
            if (sort === 'name')     return a.skill.localeCompare(b.skill)
            return 0
        })
        return list
    }, [skills, filter, sort, search])

    return (
        <div className="st-root" ref={panelRef}>

            {/* ── Badge ── */}
            <button
                className={`st-badge ${open ? 'st-badge--open' : ''}`}
                onClick={() => setOpen(o => !o)}
                aria-label="Skill Tracker"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="st-badge__icon">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span className="st-badge__label">Skills</span>
                {skills.length > 0 && <span className="st-badge__count">{skills.length}</span>}
                {total > 0 && <span className={`st-badge__pct ${pct === 100 ? 'st-badge__pct--done' : ''}`}>{pct}%</span>}
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    className="st-badge__chevron" style={{ transform: open ? 'rotate(180deg)' : 'none' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {/* ── Panel ── */}
            <div className={`st-panel ${open ? 'st-panel--open' : ''}`}>

                {/* Panel header */}
                <div className="st-panel__header">
                    <span className="st-panel__title">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        Skill Tracker
                        {skills.length > 0 && <span className="st-panel__badge">{skills.length}</span>}
                    </span>
                    <button className="st-panel__close" onClick={() => setOpen(false)} aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Compact stats strip */}
                {total > 0 && (
                    <div className="st-panel__overview">
                        <div className="st-panel__stat-cards">
                            <div className="st-panel__stat-card">
                                <span className="st-panel__stat-num">{total}</span>
                                <span className="st-panel__stat-lbl">Total</span>
                            </div>
                            <div className="st-panel__stat-card st-panel__stat-card--warn">
                                <span className="st-panel__stat-num">{notStarted}</span>
                                <span className="st-panel__stat-lbl">Not Started</span>
                            </div>
                            <div className="st-panel__stat-card st-panel__stat-card--prog">
                                <span className="st-panel__stat-num">{inProgress}</span>
                                <span className="st-panel__stat-lbl">In Progress</span>
                            </div>
                            <div className="st-panel__stat-card st-panel__stat-card--done">
                                <span className="st-panel__stat-num">{mastered}</span>
                                <span className="st-panel__stat-lbl">Mastered</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Progress bar */}
                {total > 0 && (
                    <div className="st-panel__prog-row">
                        <div className="st-panel__prog-bar">
                            <div className="st-panel__prog-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="st-panel__prog-pct">{pct}%</span>
                    </div>
                )}

                <div className="st-panel__divider" />

                {/* Controls: search + sort */}
                <div className="st-panel__controls">
                    <div className="st-panel__search-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="st-panel__search-icon">
                            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        </svg>
                        <input
                            className="st-panel__search"
                            placeholder="Search skills…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button className="st-panel__search-clear" onClick={() => setSearch('')}>✕</button>
                        )}
                    </div>
                    <div className="st-panel__sort-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="4" y1="6" x2="11" y2="6"/><line x1="4" y1="12" x2="11" y2="12"/><line x1="4" y1="18" x2="13" y2="18"/>
                            <polyline points="15 15 18 18 21 15"/><line x1="18" y1="6" x2="18" y2="18"/>
                        </svg>
                        <select className="st-panel__sort" value={sort} onChange={e => setSort(e.target.value)}>
                            {SORT_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filter tabs */}
                <div className="st-panel__filters">
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            className={`st-panel__filter-tab ${filter === f ? 'st-panel__filter-tab--active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {FILTER_LABELS[f]}
                            {f !== 'all' && (
                                <span className="st-panel__filter-count">
                                    {skills.filter(s => s.status === f).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="st-panel__divider" />

                {/* List */}
                <div className="st-panel__body">
                    {skillsLoading ? (
                        <div className="st-panel__loading">
                            <div className="st-panel__spinner" />
                            <span>Loading skills…</span>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="st-panel__empty">
                            {skills.length === 0 ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                                    </svg>
                                    <p>No skills tracked yet.</p>
                                    <p className="st-panel__empty-sub">
                                        Click <strong>+ Track</strong> on any skill gap in an interview plan to start tracking your progress.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                                    </svg>
                                    <p>No skills match this filter.</p>
                                </>
                            )}
                        </div>
                    ) : (
                        <ul className="st-list">
                            {filtered.map((s, i) => (
                                <SkillItem
                                    key={s._id}
                                    s={s} idx={i}
                                    cycleStatus={cycleStatus}
                                    removeSkill={removeSkill}
                                    updateNotes={updateNotes}
                                />
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {total > 0 && (
                    <div className="st-panel__footer">
                        <span className="st-panel__footer-tip">
                            💡 Click any status badge to advance it
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}

export default SkillTracker
