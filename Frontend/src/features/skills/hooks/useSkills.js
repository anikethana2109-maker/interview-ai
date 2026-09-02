import { useContext, useEffect, useCallback, useState } from 'react'
import { SkillContext } from '../skill.context'
import {
    getAllSkills as apiGetAll,
    addSkill as apiAdd,
    updateSkill as apiUpdate,
    deleteSkill as apiDelete,
    saveSkillToProfile as apiSaveToProfile,
    getProfileSkills as apiGetProfile,
    generateResumeWithSkillsHtml,
} from '../services/skill.api'

export const useSkills = () => {
    const context = useContext(SkillContext)
    if (!context) throw new Error('useSkills must be used within a SkillProvider')

    const { skills, setSkills, skillsLoading, setSkillsLoading } = context

    const [profileSkills,       setProfileSkills]       = useState([])
    const [profileLoading,      setProfileLoading]      = useState(false)
    const [savingToProfile,     setSavingToProfile]     = useState({})   // { [skillId]: bool }
    const [downloadingResume,   setDownloadingResume]   = useState(false)

    // Load all tracker skills on first mount
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

    // Load profile skills on mount
    const fetchProfileSkills = useCallback(async () => {
        setProfileLoading(true)
        try {
            const data = await apiGetProfile()
            if (data?.masteredSkills) setProfileSkills(data.masteredSkills)
        } catch (err) {
            console.error('Failed to fetch profile skills:', err)
        } finally {
            setProfileLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchSkills()
        fetchProfileSkills()
    }, [fetchSkills, fetchProfileSkills])

    /**
     * Track a skill from an interview plan.
     */
    const trackSkill = async ({ skill, severity, sourceReport }) => {
        try {
            const data = await apiAdd({ skill, severity, sourceReport })
            if (data?.skill) {
                setSkills(prev => {
                    const exists = prev.find(s => s._id === data.skill._id)
                    if (exists) return prev
                    return [data.skill, ...prev]
                })
            }
            return data
        } catch (err) {
            console.error('Failed to track skill:', err)
            throw err
        }
    }

    /**
     * Cycle status: not-started → in-progress → mastered → not-started
     */
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
            console.error('Failed to update skill status:', err)
        }
    }

    /**
     * Update notes for a skill
     */
    const updateNotes = async (skillId, notes) => {
        setSkills(prev => prev.map(s => s._id === skillId ? { ...s, notes } : s))
        try {
            await apiUpdate({ skillId, notes })
        } catch (err) {
            console.error('Failed to update notes:', err)
        }
    }

    /**
     * Remove a skill from tracker
     */
    const removeSkill = async (skillId) => {
        const prev = skills.find(s => s._id === skillId)
        setSkills(prev => prev.filter(s => s._id !== skillId))
        try {
            await apiDelete(skillId)
        } catch (err) {
            if (prev) setSkills(s => [prev, ...s])
            console.error('Failed to delete skill:', err)
        }
    }

    /**
     * Save a mastered skill to the user's profile
     */
    const saveToProfile = async (skillId) => {
        setSavingToProfile(p => ({ ...p, [skillId]: true }))
        try {
            const data = await apiSaveToProfile(skillId)
            if (data?.masteredSkills) setProfileSkills(data.masteredSkills)
            return data
        } catch (err) {
            console.error('Failed to save skill to profile:', err)
            throw err
        } finally {
            setSavingToProfile(p => ({ ...p, [skillId]: false }))
        }
    }

    /**
     * Check if a skill (by name) is saved in the profile
     */
    const isInProfile = (skillName) =>
        profileSkills.some(ps => ps.skill.toLowerCase() === skillName.toLowerCase())

    /**
     * Download resume PDF with profile mastered skills injected.
     * Uses the most recent interview report if no reportId provided.
     */
    const downloadResumeWithSkills = async (reportId) => {
        if (!reportId) {
            console.error('Report ID required for resume download')
            return
        }
        setDownloadingResume(true)
        try {
            const htmlContent = await generateResumeWithSkillsHtml(reportId)
            if (!htmlContent || typeof htmlContent !== 'string') {
                throw new Error('Invalid resume content')
            }

            const html2pdfModule = await import('html2pdf.js')
            const html2pdf = html2pdfModule.default || html2pdfModule

            const container = document.createElement('div')
            container.innerHTML = htmlContent
            container.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;'
            document.body.appendChild(container)

            await html2pdf().set({
                margin: [8, 8, 8, 8],
                filename: `resume_with_skills_${Date.now()}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(container).save()

            document.body.removeChild(container)
        } catch (err) {
            console.error('Failed to download resume with skills:', err)
            throw err
        } finally {
            setDownloadingResume(false)
        }
    }

    // Computed stats
    const statsMap = {
        total:      skills.length,
        mastered:   skills.filter(s => s.status === 'mastered').length,
        inProgress: skills.filter(s => s.status === 'in-progress').length,
        notStarted: skills.filter(s => s.status === 'not-started').length,
    }

    return {
        skills, skillsLoading,
        trackSkill, cycleStatus, updateNotes, removeSkill,
        statsMap,
        // Profile
        profileSkills, profileLoading,
        saveToProfile, isInProfile, savingToProfile,
        // Resume
        downloadResumeWithSkills, downloadingResume,
    }
}
