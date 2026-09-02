import React, { useState, useRef, useEffect } from 'react'
import { useSkills } from '../features/skills/hooks/useSkills'
import { useInterview } from '../features/interview/hooks/useInterview'
import './skill-tracker.scss'

// ── Small helpers ──────────────────────────────────────────────────────────────
const SEV = { high: 'sev--high', medium: 'sev--medium', low: 'sev--low' }
const STATUS_META = {
    'not-started': { label: 'Not Started', cls: 'status--not-started', next: 'In Progress →' },
    'in-progress':  { label: 'In Progress',  cls: 'status--in-progress',  next: 'Mark Mastered →' },
    'mastered':     { label: 'Mastered',      cls: 'status--mastered',      next: '↩ Reset' },
}
const LEVELS = ['beginner', 'intermediate', 'advanced']

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
)

// ── Tab 1: Skill Tracker ───────────────────────────────────────────────────────
const TrackerTab = ({ skills, skillsLoading, cycleStatus, removeSkill, updateNotes, saveToProfile, isInProfile, savingToProfile, savedFlash }) => {
    const [editingNotes, setEditingNotes] = useState(null)

    if (skillsLoading) return <div className="st-tab-loading"><div className="st-spinner" /></div>
    if (skills.length === 0) return (
        <p className="st-empty">No skills tracked yet. Click <strong>+ Track</strong> on any skill gap in an interview plan.</p>
    )

    return (
        <ul className="st-list">
            {skills.map(s => {
                const alreadySaved = isInProfile(s.skill)
                const isSaving    = savingToProfile[s._id]
                const justSaved   = savedFlash[s._id]
                return (
                    <li key={s._id} className={`st-item ${s.status === 'mastered' ? 'st-item--mastered' : ''}`}>
                        <div className="st-item__top">
                            <span className={`st-sev ${SEV[s.severity]}`} title={`${s.severity} priority`} />
                            <span className="st-item__name">{s.skill}</span>
                            <button className="st-icon-btn st-icon-btn--del" onClick={() => removeSkill(s._id)} title="Remove"><DeleteIcon /></button>
                        </div>
                        <div className="st-item__row">
                            <button className={`st-status ${STATUS_META[s.status]?.cls}`} onClick={() => cycleStatus(s._id)} title={`Next: ${STATUS_META[s.status]?.next}`}>
                                {STATUS_META[s.status]?.label}
                            </button>
                            {s.status === 'mastered' && (
                                <button
                                    className={`st-save-btn ${alreadySaved ? 'st-save-btn--saved' : ''} ${justSaved ? 'st-save-btn--flash' : ''}`}
                                    onClick={() => saveToProfile(s._id)}
                                    disabled={isSaving || alreadySaved}
                                    title={alreadySaved ? 'Saved to profile ✓' : 'Save to your career profile'}
                                >
                                    {isSaving ? <span className="st-save-spinner" /> : alreadySaved ? 'Saved' : 'Save to Profile'}
                                </button>
                            )}
                        </div>
                        {editingNotes === s._id ? (
                            <textarea autoFocus className="st-notes-input" defaultValue={s.notes} placeholder="Add notes..."
                                onBlur={e => { updateNotes(s._id, e.target.value); setEditingNotes(null) }}
                                onKeyDown={e => { if (e.key === 'Escape') setEditingNotes(null) }} />
                        ) : (
                            <button className="st-notes-btn" onClick={() => setEditingNotes(s._id)}>
                                {s.notes
                                    ? <span className="st-notes-text">{s.notes}</span>
                                    : <span className="st-notes-ph">+ Add note</span>}
                            </button>
                        )}
                    </li>
                )
            })}
        </ul>
    )
}

// ── Tab 2: Learning Pathways ───────────────────────────────────────────────────
const PathwaysTab = ({ learningPathways, generatingPathway, generatePathway, toggleSubtopic, graduatePathway, removePathway }) => {
    const [skillInput, setSkillInput] = useState('')
    const [level,      setLevel]      = useState('beginner')
    const [gradError,  setGradError]  = useState({})
    const [expanded,   setExpanded]   = useState({})

    const handleGenerate = async () => {
        if (!skillInput.trim()) return
        await generatePathway(skillInput.trim(), level)
        setSkillInput('')
    }

    const handleGraduate = async (pathwayId) => {
        try {
            await graduatePathway(pathwayId)
            setGradError(p => ({ ...p, [pathwayId]: null }))
        } catch (err) {
            setGradError(p => ({ ...p, [pathwayId]: err?.response?.data?.message || 'Complete all subtopics first.' }))
            setTimeout(() => setGradError(p => ({ ...p, [pathwayId]: null })), 3000)
        }
    }

    return (
        <div className="st-pathways">
            {/* Generate input */}
            <div className="st-pathway-gen">
                <input
                    className="st-input"
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !generatingPathway && handleGenerate()}
                    placeholder="What do you want to learn? e.g. Docker, GraphQL…"
                />
                <select className="st-select" value={level} onChange={e => setLevel(e.target.value)}>
                    {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
                </select>
                <button className="st-gen-btn" onClick={handleGenerate} disabled={generatingPathway || !skillInput.trim()}>
                    {generatingPathway ? <><span className="st-spinner-sm" /> Generating…</> : 'Generate Pathway'}
                </button>
            </div>

            {learningPathways.length === 0 && !generatingPathway && (
                <p className="st-empty">No learning pathways yet. Enter a skill above and let AI build your roadmap!</p>
            )}

            {learningPathways.map(pw => {
                const done    = pw.subtopics.filter(s => s.isCompleted).length
                const total   = pw.subtopics.length
                const pct     = total > 0 ? Math.round((done / total) * 100) : 0
                const isOpen  = expanded[pw._id] !== false  // open by default
                const graduated = !!pw.graduatedAt

                return (
                    <div key={pw._id} className={`st-pathway ${graduated ? 'st-pathway--graduated' : ''}`}>
                        <div className="st-pathway__header" onClick={() => setExpanded(p => ({ ...p, [pw._id]: !isOpen }))}>
                            <div className="st-pathway__title-row">
                                <span className={`st-pathway__level-badge st-pathway__level-badge--${pw.level}`}>{pw.level}</span>
                                <span className="st-pathway__name">{pw.targetSkill}</span>
                                {graduated && <span className="st-pathway__grad-badge">★ Graduated</span>}
                            </div>
                            <div className="st-pathway__meta">
                                <div className="st-pathway__bar">
                                    <div className="st-pathway__bar-fill" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="st-pathway__pct">{done}/{total}</span>
                                <button className="st-icon-btn st-icon-btn--del" onClick={e => { e.stopPropagation(); removePathway(pw._id) }} title="Delete pathway"><DeleteIcon /></button>
                            </div>
                        </div>

                        {isOpen && (
                            <div className="st-pathway__body">
                                {pw.summary && <p className="st-pathway__summary">{pw.summary}</p>}
                                <ul className="st-pathway__subtopics">
                                    {pw.subtopics.map((sub, idx) => (
                                        <li key={idx} className={`st-subtopic ${sub.isCompleted ? 'st-subtopic--done' : ''}`}>
                                            <label className="st-subtopic__check-label">
                                                <input type="checkbox" checked={sub.isCompleted} onChange={() => toggleSubtopic(pw._id, idx)} />
                                                <span className="st-subtopic__title">{sub.title}</span>
                                            </label>
                                            {sub.description && <p className="st-subtopic__desc">{sub.description}</p>}
                                            {sub.keyConcepts?.length > 0 && (
                                                <ul className="st-subtopic__concepts">
                                                    {sub.keyConcepts.map((c, ci) => <li key={ci}>{c}</li>)}
                                                </ul>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                {pw.isCompleted && !graduated && (
                                    <div className="st-pathway__graduate">
                                        {gradError[pw._id] && <p className="st-pathway__grad-err">{gradError[pw._id]}</p>}
                                        <button className="st-graduate-btn" onClick={() => handleGraduate(pw._id)}>
                                            Graduate to Profile Skills
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Tab 3: Certifications ──────────────────────────────────────────────────────
const CertificationsTab = ({ certifications, addCertification, removeCertification }) => {
    const EMPTY = { title: '', issuer: '', issueDate: '', credentialId: '', credentialUrl: '', skills: '' }
    const [form,   setForm]   = useState(EMPTY)
    const [adding, setAdding] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error,  setError]  = useState('')

    const handleSave = async () => {
        if (!form.title.trim() || !form.issuer.trim()) { setError('Title and Issuer are required.'); return }
        setSaving(true)
        try {
            await addCertification({
                ...form,
                skills: form.skills ? form.skills.split(',').map(s => s.trim()).filter(Boolean) : []
            })
            setForm(EMPTY)
            setAdding(false)
            setError('')
        } catch (err) {
            setError(err?.response?.data?.message || 'Failed to save certification.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="st-certs">
            {certifications.length === 0 && !adding && (
                <p className="st-empty">No certifications yet. Add your credentials and they'll appear on your resume!</p>
            )}

            <ul className="st-cert-list">
                {certifications.map(cert => (
                    <li key={cert._id} className="st-cert-card">
                        <div className="st-cert-card__body">
                            <div className="st-cert-card__icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                                </svg>
                            </div>
                            <div className="st-cert-card__info">
                                <span className="st-cert-card__title">{cert.title}</span>
                                <span className="st-cert-card__issuer">{cert.issuer}{cert.issueDate ? ` · ${cert.issueDate}` : ''}</span>
                                {cert.credentialId && <span className="st-cert-card__id">ID: {cert.credentialId}</span>}
                                {cert.skills?.length > 0 && (
                                    <div className="st-cert-card__skills">
                                        {cert.skills.map((sk, i) => <span key={i} className="st-cert-card__skill-tag">{sk}</span>)}
                                    </div>
                                )}
                            </div>
                            <div className="st-cert-card__actions">
                                {cert.credentialUrl && (
                                    <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" className="st-icon-btn st-icon-btn--link" title="View credential">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                                        </svg>
                                    </a>
                                )}
                                <button className="st-icon-btn st-icon-btn--del" onClick={() => removeCertification(cert._id)} title="Remove"><DeleteIcon /></button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {adding ? (
                <div className="st-cert-form">
                    <input className="st-input" placeholder="Certification title *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                    <input className="st-input" placeholder="Issuing organization *" value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} />
                    <div className="st-cert-form__row">
                        <input className="st-input" placeholder="Issue date (e.g. Jun 2024)" value={form.issueDate} onChange={e => setForm(f => ({ ...f, issueDate: e.target.value }))} />
                        <input className="st-input" placeholder="Credential ID (optional)" value={form.credentialId} onChange={e => setForm(f => ({ ...f, credentialId: e.target.value }))} />
                    </div>
                    <input className="st-input" placeholder="Credential URL (optional)" value={form.credentialUrl} onChange={e => setForm(f => ({ ...f, credentialUrl: e.target.value }))} />
                    <input className="st-input" placeholder="Skills covered (comma-separated, optional)" value={form.skills} onChange={e => setForm(f => ({ ...f, skills: e.target.value }))} />
                    {error && <p className="st-form-error">{error}</p>}
                    <div className="st-cert-form__actions">
                        <button className="st-btn st-btn--ghost" onClick={() => { setAdding(false); setError('') }}>Cancel</button>
                        <button className="st-btn st-btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? <><span className="st-spinner-sm" /> Saving…</> : 'Save Certification'}
                        </button>
                    </div>
                </div>
            ) : (
                <button className="st-add-btn" onClick={() => setAdding(true)}>
                    + Add Certification
                </button>
            )}
        </div>
    )
}

// ── Tab 4: Resume Sync ─────────────────────────────────────────────────────────
const ResumeSyncTab = ({ masteredSkills, customSkills, certifications, learningPathways, addCustomSkill, removeCustomSkill, downloadResumeWithSkills, downloadingResume, mostRecentReportId }) => {
    const [newSkill, setNewSkill] = useState('')
    const [dlError,  setDlError]  = useState(null)
    const [addErr,   setAddErr]   = useState('')

    const totalSynced = masteredSkills.length + customSkills.length
    const graduated   = learningPathways.filter(p => p.graduatedAt).length

    const handleAddSkill = async () => {
        if (!newSkill.trim()) return
        try {
            await addCustomSkill(newSkill.trim())
            setNewSkill('')
            setAddErr('')
        } catch (err) {
            setAddErr(err?.response?.data?.message || 'Failed to add skill.')
        }
    }

    const handleDownload = async () => {
        if (!mostRecentReportId) {
            setDlError('No interview plan found. Generate a plan first to create a resume.')
            setTimeout(() => setDlError(null), 5000)
            return
        }
        setDlError(null)
        try {
            await downloadResumeWithSkills(mostRecentReportId)
        } catch {
            setDlError('Download failed. Please try again.')
            setTimeout(() => setDlError(null), 4000)
        }
    }

    return (
        <div className="st-resume-sync">
            {/* Sync summary */}
            <div className="st-sync-summary">
                <div className="st-sync-stat">
                    <span className="st-sync-stat__val">{totalSynced}</span>
                    <span className="st-sync-stat__label">Profile Skills</span>
                </div>
                <div className="st-sync-stat">
                    <span className="st-sync-stat__val">{certifications.length}</span>
                    <span className="st-sync-stat__label">Certifications</span>
                </div>
                <div className="st-sync-stat">
                    <span className="st-sync-stat__val">{graduated}</span>
                    <span className="st-sync-stat__label">Pathways ✓</span>
                </div>
            </div>

            {/* Custom skill adder */}
            <div className="st-resume-sync__section">
                <p className="st-section-label">Add a skill directly to your resume profile</p>
                <div className="st-add-row">
                    <input className="st-input" placeholder="e.g. Python, Figma, Leadership…" value={newSkill}
                        onChange={e => setNewSkill(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddSkill()} />
                    <button className="st-btn st-btn--primary" onClick={handleAddSkill} disabled={!newSkill.trim()}>Add</button>
                </div>
                {addErr && <p className="st-form-error">{addErr}</p>}
            </div>

            {/* All synced skills */}
            {(masteredSkills.length > 0 || customSkills.length > 0) && (
                <div className="st-resume-sync__section">
                    <p className="st-section-label">Skills on your next resume</p>
                    <div className="st-skill-cloud">
                        {masteredSkills.map((s, i) => (
                            <span key={`m-${i}`} className="st-skill-chip st-skill-chip--mastered" title="From tracker">{s.skill}</span>
                        ))}
                        {customSkills.map((s, i) => (
                            <span key={`c-${i}`} className="st-skill-chip st-skill-chip--custom">
                                {s.skill}
                                <button className="st-chip-del" onClick={() => removeCustomSkill(s.skill)} title="Remove">×</button>
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Download */}
            <div className="st-resume-sync__download">
                {dlError && <p className="st-dl-error">{dlError}</p>}
                <button className={`st-dl-btn ${downloadingResume ? 'st-dl-btn--loading' : ''}`} onClick={handleDownload} disabled={downloadingResume}>
                    {downloadingResume ? (
                        <><span className="st-dl-spinner" /> Generating Resume…</>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            Download Updated Resume
                            {totalSynced + certifications.length > 0 && (
                                <span className="st-dl-badge">{totalSynced} skills · {certifications.length} certs</span>
                            )}
                        </>
                    )}
                </button>
                <p className="st-dl-tip">Resume is always synchronized with your latest profile data</p>
            </div>
        </div>
    )
}

// ── Main SkillTracker Component ────────────────────────────────────────────────
const TABS = [
    { id: 'tracker',  label: 'Tracker'  },
    { id: 'pathways', label: 'Pathways' },
    { id: 'certs',    label: 'Certs'    },
    { id: 'resume',   label: 'Resume'   },
]

const PROVERBS = [
    '"The secret of getting ahead is getting started." — Mark Twain',
    '"Success is the sum of small efforts repeated." — R. Collier',
    '"Opportunities don\'t happen. You create them." — Chris Grosser',
    '"Don\'t watch the clock; do what it does. Keep going." — Sam Levenson',
    '"Push yourself, because no one else is going to do it for you."',
]
const PROVERB = PROVERBS[new Date().getDay() % PROVERBS.length]

const SkillTracker = () => {
    const {
        skills, skillsLoading, cycleStatus, removeSkill, updateNotes, statsMap,
        saveToProfile, isInProfile, savingToProfile, savedFlash,
        masteredSkills, customSkills, certifications, learningPathways, profileLoading,
        addCertification, removeCertification,
        generatePathway, generatingPathway, toggleSubtopic, graduatePathway, removePathway,
        addCustomSkill, removeCustomSkill,
        downloadResumeWithSkills, downloadingResume,
    } = useSkills()

    const { reports } = useInterview()
    const mostRecentReportId = reports?.[0]?._id ?? null

    const [open,    setOpen]    = useState(false)
    const [activeTab, setActiveTab] = useState('tracker')
    const panelRef = useRef(null)

    const total    = statsMap?.total    ?? 0
    const mastered = statsMap?.mastered ?? 0
    const pct      = total > 0 ? Math.round((mastered / total) * 100) : 0
    const totalProfileItems = masteredSkills.length + customSkills.length + certifications.length

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
        <div className="st-root" ref={panelRef}>

            {/* ── Badge ── */}
            <button className={`st-badge ${open ? 'st-badge--open' : ''}`} onClick={() => setOpen(o => !o)} aria-label="JobStand">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                <span>JobStand</span>
                {total > 0 && <span className="st-badge__count">{total}</span>}
                {pct > 0 && <span className={`st-badge__pct ${pct === 100 ? 'st-badge__pct--done' : ''}`}>{pct}%</span>}
                {totalProfileItems > 0 && <span className="st-badge__profile" title={`${totalProfileItems} profile items`}>★{totalProfileItems}</span>}
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            </button>

            {/* ── Panel ── */}
            <div className={`st-panel ${open ? 'st-panel--open' : ''}`}>

                {/* Panel header */}
                <div className="st-panel__header">
                    <div className="st-panel__header-left">
                        <span className="st-panel__title">JobStand</span>
                        <span className="st-panel__proverb">{PROVERB}</span>
                    </div>
                    <button className="st-icon-btn" onClick={() => setOpen(false)} aria-label="Close">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                    </button>
                </div>

                {/* Tab nav */}
                <div className="st-tabs">
                    {TABS.map(t => (
                        <button key={t.id} className={`st-tab ${activeTab === t.id ? 'st-tab--active' : ''}`} onClick={() => setActiveTab(t.id)}>
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Tab body */}
                <div className="st-panel__body">
                    {activeTab === 'tracker' && (
                        <TrackerTab
                            skills={skills} skillsLoading={skillsLoading}
                            cycleStatus={cycleStatus} removeSkill={removeSkill} updateNotes={updateNotes}
                            saveToProfile={saveToProfile} isInProfile={isInProfile}
                            savingToProfile={savingToProfile} savedFlash={savedFlash}
                        />
                    )}
                    {activeTab === 'pathways' && (
                        <PathwaysTab
                            learningPathways={learningPathways} generatingPathway={generatingPathway}
                            generatePathway={generatePathway} toggleSubtopic={toggleSubtopic}
                            graduatePathway={graduatePathway} removePathway={removePathway}
                        />
                    )}
                    {activeTab === 'certs' && (
                        <CertificationsTab
                            certifications={certifications}
                            addCertification={addCertification}
                            removeCertification={removeCertification}
                        />
                    )}
                    {activeTab === 'resume' && (
                        <ResumeSyncTab
                            masteredSkills={masteredSkills} customSkills={customSkills}
                            certifications={certifications} learningPathways={learningPathways}
                            addCustomSkill={addCustomSkill} removeCustomSkill={removeCustomSkill}
                            downloadResumeWithSkills={downloadResumeWithSkills} downloadingResume={downloadingResume}
                            mostRecentReportId={mostRecentReportId}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default SkillTracker
