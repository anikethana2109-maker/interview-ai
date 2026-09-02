import React, { useState } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useParams } from 'react-router'
import { useSkills } from '../../skills/hooks/useSkills'

const NAV_ITEMS = [
    {
        id: 'overview', label: 'Overview', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        )
    },
    {
        id: 'technical', label: 'Technical', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
        )
    },
    {
        id: 'behavioral', label: 'Behavioral', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        )
    },
    {
        id: 'roadmap', label: 'Road Map', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
        )
    },
    {
        id: 'skills', label: 'Skill Gaps', icon: (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        )
    },
]

// ── Sub-components ─────────────────────────────────────────────────────────────
const QuestionCard = ({ item, index }) => {
    const [open, setOpen] = useState(false)
    return (
        <div className='q-card'>
            <div className='q-card__header' onClick={() => setOpen(o => !o)}>
                <span className='q-card__index'>Q{index + 1}</span>
                <p className='q-card__question'>{item.question}</p>
                <span className={`q-card__chevron ${open ? 'q-card__chevron--open' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
            </div>
            <div className={`q-card__body ${open ? 'q-card__body--open' : ''}`}>
                <div className='q-card__body-inner'>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--intention'>Intention</span>
                        <p>{item.intention}</p>
                    </div>
                    <div className='q-card__section'>
                        <span className='q-card__tag q-card__tag--answer'>Model Answer</span>
                        <p>{item.answer}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

const RoadMapDay = ({ day }) => (
    <div className='roadmap-day'>
        <div className='roadmap-day__header'>
            <span className='roadmap-day__badge'>Day {day.day}</span>
            <h3 className='roadmap-day__focus'>{day.focus}</h3>
        </div>
        <ul className='roadmap-day__tasks'>
            {day.tasks.map((task, i) => (
                <li key={i}>
                    <span className='roadmap-day__bullet' />
                    {task}
                </li>
            ))}
        </ul>
    </div>
)

const LoadingScreen = () => (
    <main className='loading-screen'>
        <div className='loading-spinner' />
        <h2>Loading your interview plan...</h2>
        <p>This may take a moment</p>
    </main>
)

// ── Main Page ──────────────────────────────────────────────────────────────────
const Interview = () => {
    const [activeNav, setActiveNav] = useState('overview')
    const { report, loading, getResumePdf } = useInterview()
    const { interviewId } = useParams()
    const { trackSkill, skills: trackedSkills } = useSkills()
    const [tracking, setTracking] = useState({})

    if (loading || !report) return <LoadingScreen />

    const scoreColor =
        report.matchScore >= 80 ? 'score--high' :
        report.matchScore >= 60 ? 'score--mid'  : 'score--low'

    const scoreLabel =
        report.matchScore >= 80 ? 'Strong match' :
        report.matchScore >= 60 ? 'Good match'   : 'Needs prep'

    return (
        <div className='interview-page'>

            {/* ── Top Section Navbar ── */}
            <nav className='section-navbar'>
                {/* Left: title + score badge */}
                <div className='section-navbar__meta'>
                    <h1 className='section-navbar__title'>
                        {report.title || 'Interview Plan'}
                    </h1>
                    <span className={`section-navbar__score ${scoreColor}`}>
                        {report.matchScore}% &bull; {scoreLabel}
                    </span>
                </div>

                {/* Center: tab pills */}
                <div className='section-navbar__tabs' role="tablist">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            role="tab"
                            aria-selected={activeNav === item.id}
                            className={`section-navbar__tab ${activeNav === item.id ? 'section-navbar__tab--active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <span className='section-navbar__tab-icon'>{item.icon}</span>
                            <span className='section-navbar__tab-label'>{item.label}</span>
                            {item.id === 'technical' && (
                                <span className='section-navbar__tab-badge'>{report.technicalQuestions.length}</span>
                            )}
                            {item.id === 'behavioral' && (
                                <span className='section-navbar__tab-badge'>{report.behavioralQuestions.length}</span>
                            )}
                            {item.id === 'skills' && (
                                <span className='section-navbar__tab-badge section-navbar__tab-badge--warn'>{report.skillGaps.length}</span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Right: download button */}
                <button
                    className='section-navbar__download'
                    onClick={() => getResumePdf(interviewId)}
                    disabled={loading}
                    title="Download Resume PDF"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    <span>Resume</span>
                </button>
            </nav>

            {/* ── Page Content ── */}
            <div className='interview-body'>

                {/* Overview */}
                {activeNav === 'overview' && (
                    <div className='overview-grid'>
                        {/* Score card */}
                        <div className='overview-card overview-card--score'>
                            <p className='overview-card__label'>Match Score</p>
                            <div className={`match-score__ring ${scoreColor}`}>
                                <span className='match-score__value'>{report.matchScore}</span>
                                <span className='match-score__pct'>%</span>
                            </div>
                            <p className='overview-card__sub'>
                                {report.matchScore >= 80 ? 'Strong match for this role' :
                                 report.matchScore >= 60 ? 'Good match with some gaps' : 'Needs preparation'}
                            </p>
                        </div>

                        {/* Stats */}
                        <div className='overview-card overview-card--stats'>
                            <p className='overview-card__label'>Plan Summary</p>
                            <div className='overview-stats'>
                                <div className='overview-stat'>
                                    <span className='overview-stat__value'>{report.technicalQuestions.length}</span>
                                    <span className='overview-stat__label'>Technical Qs</span>
                                </div>
                                <div className='overview-stat'>
                                    <span className='overview-stat__value'>{report.behavioralQuestions.length}</span>
                                    <span className='overview-stat__label'>Behavioral Qs</span>
                                </div>
                                <div className='overview-stat'>
                                    <span className='overview-stat__value'>{report.preparationPlan.length}</span>
                                    <span className='overview-stat__label'>Day Plan</span>
                                </div>
                                <div className='overview-stat'>
                                    <span className='overview-stat__value'>{report.skillGaps.length}</span>
                                    <span className='overview-stat__label'>Skill Gaps</span>
                                </div>
                            </div>
                        </div>

                        {/* Skill gaps overview */}
                        <div className='overview-card overview-card--gaps'>
                            <p className='overview-card__label'>Skill Gaps at a Glance</p>
                            <div className='skill-gaps__list'>
                                {report.skillGaps.map((gap, i) => (
                                    <span key={i} className={`skill-tag skill-tag--${gap.severity}`}>{gap.skill}</span>
                                ))}
                            </div>
                        </div>

                        {/* Roadmap preview */}
                        <div className='overview-card overview-card--roadmap'>
                            <p className='overview-card__label'>Preparation Roadmap Preview</p>
                            {report.preparationPlan.slice(0, 3).map(day => (
                                <div key={day.day} className='roadmap-preview-row'>
                                    <span className='roadmap-day__badge'>Day {day.day}</span>
                                    <span className='roadmap-preview-row__focus'>{day.focus}</span>
                                </div>
                            ))}
                            {report.preparationPlan.length > 3 && (
                                <button className='overview-see-more' onClick={() => setActiveNav('roadmap')}>
                                    See full roadmap →
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Technical Questions */}
                {activeNav === 'technical' && (
                    <section className='interview-section'>
                        <div className='content-header'>
                            <h2>Technical Questions</h2>
                            <span className='content-header__count'>{report.technicalQuestions.length} questions</span>
                        </div>
                        <div className='q-list'>
                            {report.technicalQuestions.map((q, i) => (
                                <QuestionCard key={i} item={q} index={i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Behavioral Questions */}
                {activeNav === 'behavioral' && (
                    <section className='interview-section'>
                        <div className='content-header'>
                            <h2>Behavioral Questions</h2>
                            <span className='content-header__count'>{report.behavioralQuestions.length} questions</span>
                        </div>
                        <div className='q-list'>
                            {report.behavioralQuestions.map((q, i) => (
                                <QuestionCard key={i} item={q} index={i} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Road Map */}
                {activeNav === 'roadmap' && (
                    <section className='interview-section'>
                        <div className='content-header'>
                            <h2>Preparation Road Map</h2>
                            <span className='content-header__count'>{report.preparationPlan.length}-day plan</span>
                        </div>
                        <div className='roadmap-list'>
                            {report.preparationPlan.map(day => (
                                <RoadMapDay key={day.day} day={day} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Skill Gaps */}
                {activeNav === 'skills' && (
                    <section className='interview-section'>
                        <div className='content-header'>
                            <h2>Skill Gaps</h2>
                            <span className='content-header__count'>{report.skillGaps.length} identified</span>
                        </div>
                        <div className='skill-gaps-full'>
                            {report.skillGaps.map((gap, i) => {
                                const isTracked = trackedSkills.some(s => s.skill.toLowerCase() === gap.skill.toLowerCase())
                                const isLoading = tracking[gap.skill] === 'loading'
                                return (
                                    <div key={i} className='skill-gap-card'>
                                        <div className='skill-gap-card__top'>
                                            <span className={`skill-tag skill-tag--${gap.severity}`}>{gap.skill}</span>
                                            <span className={`severity-badge severity-badge--${gap.severity}`}>{gap.severity}</span>
                                        </div>
                                        <button
                                            className={`track-btn ${isTracked ? 'track-btn--tracked' : ''}`}
                                            disabled={isTracked || isLoading}
                                            onClick={async () => {
                                                setTracking(t => ({ ...t, [gap.skill]: 'loading' }))
                                                await trackSkill({ skill: gap.skill, severity: gap.severity, sourceReport: interviewId })
                                                setTracking(t => ({ ...t, [gap.skill]: 'done' }))
                                            }}
                                            title={isTracked ? 'Already tracked' : 'Add to Skill Tracker'}
                                        >
                                            {isTracked ? '✓ Tracked' : isLoading ? '...' : '+ Add to Tracker'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}

export default Interview