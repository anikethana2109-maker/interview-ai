import { useContext, useEffect, useCallback } from 'react'
import { SkillContext } from '../skill.context'
import {
    getAllSkills as apiGetAll,
    addSkill as apiAdd,
    updateSkill as apiUpdate,
    deleteSkill as apiDelete,
} from '../services/skill.api'

export const useSkills = () => {
    const context = useContext(SkillContext)
    if (!context) throw new Error('useSkills must be used within a SkillProvider')

    const { skills, setSkills, skillsLoading, setSkillsLoading } = context

    // Load all skills on first mount
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

    useEffect(() => {
        fetchSkills()
    }, [fetchSkills])

    /**
     * Track a skill from an interview plan.
     * Returns the skill doc (new or existing).
     */
    const trackSkill = async ({ skill, severity, sourceReport }) => {
        try {
            const data = await apiAdd({ skill, severity, sourceReport })
            if (data?.skill) {
                // If already existed, replace in list; otherwise prepend
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
        // Optimistic update
        setSkills(prev => prev.map(s => s._id === skillId ? { ...s, status: nextStatus } : s))
        try {
            await apiUpdate({ skillId, status: nextStatus })
        } catch (err) {
            // Rollback
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
        // Optimistic remove
        setSkills(prev => prev.filter(s => s._id !== skillId))
        try {
            await apiDelete(skillId)
        } catch (err) {
            // Rollback
            if (prev) setSkills(s => [prev, ...s])
            console.error('Failed to delete skill:', err)
        }
    }

    // Computed stats
    const statsMap = {
        total: skills.length,
        mastered: skills.filter(s => s.status === 'mastered').length,
        inProgress: skills.filter(s => s.status === 'in-progress').length,
        notStarted: skills.filter(s => s.status === 'not-started').length,
    }

    return { skills, skillsLoading, trackSkill, cycleStatus, updateNotes, removeSkill, statsMap }
}
