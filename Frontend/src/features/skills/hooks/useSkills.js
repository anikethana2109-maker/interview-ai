import { useContext, useEffect, useCallback, useState } from 'react'
import { SkillContext } from '../skill.context'
import {
    getAllSkills as apiGetAll,
    addSkill as apiAdd,
    updateSkill as apiUpdate,
    deleteSkill as apiDelete,
    saveSkillToProfile as apiSaveToProfile,
    getFullProfile as apiGetFullProfile,
    addCustomSkill as apiAddCustom,
    deleteCustomSkill as apiDeleteCustom,
    addCertification as apiAddCert,
    deleteCertification as apiDeleteCert,
    createLearningPathway as apiCreatePathway,
    toggleSubtopic as apiToggleSubtopic,
    graduatePathway as apiGraduate,
    deleteLearningPathway as apiDeletePathway,
    generateResumeWithSkillsHtml,
} from '../services/skill.api'

export const useSkills = () => {
    const context = useContext(SkillContext)
    if (!context) throw new Error('useSkills must be used within a SkillProvider')

    const { skills, setSkills, skillsLoading, setSkillsLoading } = context

    // Profile state
    const [masteredSkills,    setMasteredSkills]    = useState([])
    const [customSkills,      setCustomSkills]       = useState([])
    const [certifications,    setCertifications]     = useState([])
    const [learningPathways,  setLearningPathways]   = useState([])
    const [profileLoading,    setProfileLoading]     = useState(false)

    // Per-action loading
    const [savingToProfile,   setSavingToProfile]    = useState({})
    const [generatingPathway, setGeneratingPathway]  = useState(false)
    const [downloadingResume, setDownloadingResume]  = useState(false)
    const [savedFlash,        setSavedFlash]         = useState({})

    // ── Fetch tracker skills ────────────────────────────────────────────────────
    const fetchSkills = useCallback(async () => {
        setSkillsLoading(true)
        try {
            const data = await apiGetAll()
            if (data?.skills) setSkills(data.skills)
        } catch (err) {
            console.error('Failed to fetch skills:', err)
        } finally {
            setSkillsLoading(false)
        }
    }, [setSkills, setSkillsLoading])

    // ── Fetch full profile (one shot) ───────────────────────────────────────────
    const fetchFullProfile = useCallback(async () => {
        setProfileLoading(true)
        try {
            const data = await apiGetFullProfile()
            if (data?.masteredSkills)   setMasteredSkills(data.masteredSkills)
            if (data?.customSkills)     setCustomSkills(data.customSkills)
            if (data?.certifications)   setCertifications(data.certifications)
            if (data?.learningPathways) setLearningPathways(data.learningPathways)
        } catch (err) {
            console.error('Failed to fetch full profile:', err)
        } finally {
            setProfileLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSkills()
        fetchFullProfile()
    }, [fetchSkills, fetchFullProfile])

    // ── Tracker skill methods ───────────────────────────────────────────────────
    const trackSkill = async ({ skill, severity, sourceReport }) => {
        try {
            const data = await apiAdd({ skill, severity, sourceReport })
            if (data?.skill) {
                setSkills(prev => {
                    const exists = prev.find(s => s._id === data.skill._id)
                    return exists ? prev : [data.skill, ...prev]
                })
            }
            return data
        } catch (err) {
            console.error('Failed to track skill:', err)
            throw err
        }
    }

    const cycleStatus = async (skillId) => {
        const cycle = { 'not-started': 'in-progress', 'in-progress': 'mastered', 'mastered': 'not-started' }
        const current = skills.find(s => s._id === skillId)
        if (!current) return
        const nextStatus = cycle[current.status] || 'not-started'
        setSkills(prev => prev.map(s => s._id === skillId ? { ...s, status: nextStatus } : s))
        try {
            await apiUpdate({ skillId, status: nextStatus })
        } catch (err) {
            setSkills(prev => prev.map(s => s._id === skillId ? { ...s, status: current.status } : s))
        }
    }

    const updateNotes = async (skillId, notes) => {
        setSkills(prev => prev.map(s => s._id === skillId ? { ...s, notes } : s))
        try { await apiUpdate({ skillId, notes }) } catch {}
    }

    const removeSkill = async (skillId) => {
        const prev = skills.find(s => s._id === skillId)
        setSkills(p => p.filter(s => s._id !== skillId))
        try {
            await apiDelete(skillId)
        } catch {
            if (prev) setSkills(p => [prev, ...p])
        }
    }

    // ── Profile: save mastered tracker skill ────────────────────────────────────
    const saveToProfile = async (skillId) => {
        setSavingToProfile(p => ({ ...p, [skillId]: true }))
        try {
            const data = await apiSaveToProfile(skillId)
            if (data?.masteredSkills) setMasteredSkills(data.masteredSkills)
            setSavedFlash(f => ({ ...f, [skillId]: true }))
            setTimeout(() => setSavedFlash(f => ({ ...f, [skillId]: false })), 2000)
            return data
        } catch (err) {
            throw err
        } finally {
            setSavingToProfile(p => ({ ...p, [skillId]: false }))
        }
    }

    const isInProfile = (skillName) =>
        masteredSkills.some(s => s.skill.toLowerCase() === skillName.toLowerCase()) ||
        customSkills.some(s => s.skill.toLowerCase() === skillName.toLowerCase())

    // ── Custom Skills ───────────────────────────────────────────────────────────
    const addCustomSkill = async (skillName, category = 'General') => {
        const data = await apiAddCustom({ skill: skillName, category })
        if (data?.customSkills) setCustomSkills(data.customSkills)
        return data
    }

    const removeCustomSkill = async (skillName) => {
        setCustomSkills(prev => prev.filter(s => s.skill !== skillName))
        try {
            const data = await apiDeleteCustom(skillName)
            if (data?.customSkills) setCustomSkills(data.customSkills)
        } catch {
            await fetchFullProfile()
        }
    }

    // ── Certifications ──────────────────────────────────────────────────────────
    const addCertification = async (certData) => {
        const data = await apiAddCert(certData)
        if (data?.certifications) setCertifications(data.certifications)
        return data
    }

    const removeCertification = async (certId) => {
        setCertifications(prev => prev.filter(c => c._id !== certId))
        try {
            const data = await apiDeleteCert(certId)
            if (data?.certifications) setCertifications(data.certifications)
        } catch {
            await fetchFullProfile()
        }
    }

    // ── Learning Pathways ───────────────────────────────────────────────────────
    const generatePathway = async (skillName, level = 'beginner') => {
        setGeneratingPathway(true)
        try {
            const data = await apiCreatePathway({ skillName, level })
            if (data?.pathway) setLearningPathways(prev => [data.pathway, ...prev])
            return data
        } catch (err) {
            throw err
        } finally {
            setGeneratingPathway(false)
        }
    }

    const toggleSubtopic = async (pathwayId, index) => {
        // Optimistic update
        setLearningPathways(prev => prev.map(p => {
            if (p._id !== pathwayId) return p
            const subtopics = p.subtopics.map((s, i) =>
                i === index ? { ...s, isCompleted: !s.isCompleted } : s
            )
            return { ...p, subtopics, isCompleted: subtopics.every(s => s.isCompleted) }
        }))
        try {
            const data = await apiToggleSubtopic({ pathwayId, index })
            if (data?.pathway) {
                setLearningPathways(prev => prev.map(p => p._id === pathwayId ? data.pathway : p))
            }
        } catch {
            await fetchFullProfile()
        }
    }

    const graduatePathway = async (pathwayId) => {
        const data = await apiGraduate(pathwayId)
        if (data?.masteredSkills) setMasteredSkills(data.masteredSkills)
        return data
    }

    const removePathway = async (pathwayId) => {
        setLearningPathways(prev => prev.filter(p => p._id !== pathwayId))
        try { await apiDeletePathway(pathwayId) } catch { await fetchFullProfile() }
    }

    // ── Download Resume with all profile data ───────────────────────────────────
    const downloadResumeWithSkills = async (reportId) => {
        if (!reportId) throw new Error('Report ID required')
        setDownloadingResume(true)
        try {
            const htmlContent = await generateResumeWithSkillsHtml(reportId)
            if (!htmlContent || typeof htmlContent !== 'string') throw new Error('Invalid resume content')

            const html2pdfModule = await import('html2pdf.js')
            const html2pdf = html2pdfModule.default || html2pdfModule

            const container = document.createElement('div')
            container.innerHTML = htmlContent
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;'
            document.body.appendChild(container)

            await html2pdf().set({
                margin: [8, 8, 8, 8],
                filename: `resume_synced_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save()

            document.body.removeChild(container)
        } finally {
            setDownloadingResume(false)
        }
    }

    // ── Computed stats ──────────────────────────────────────────────────────────
    const statsMap = {
        total:      skills.length,
        mastered:   skills.filter(s => s.status === 'mastered').length,
        inProgress: skills.filter(s => s.status === 'in-progress').length,
        notStarted: skills.filter(s => s.status === 'not-started').length,
    }

    const allProfileSkillNames = [
        ...masteredSkills.map(s => s.skill),
        ...customSkills.map(s => s.skill),
    ]

    return {
        // Tracker
        skills, skillsLoading, trackSkill, cycleStatus, updateNotes, removeSkill, statsMap,
        // Profile
        masteredSkills, customSkills, certifications, learningPathways, profileLoading,
        saveToProfile, isInProfile, savingToProfile, savedFlash, allProfileSkillNames,
        // Custom Skills
        addCustomSkill, removeCustomSkill,
        // Certifications
        addCertification, removeCertification,
        // Pathways
        generatePathway, generatingPathway, toggleSubtopic, graduatePathway, removePathway,
        // Resume
        downloadResumeWithSkills, downloadingResume,
        // Refresh
        fetchFullProfile,
    }
}
