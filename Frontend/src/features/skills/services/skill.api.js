import api from '../../../api'

/**
 * Get all skills for the current user
 */
export const getAllSkills = async () => {
    const response = await api.get('/api/skills/')
    return response.data
}

/**
 * Add a skill to tracker (upsert — won't duplicate)
 */
export const addSkill = async ({ skill, severity, sourceReport, notes }) => {
    const response = await api.post('/api/skills/', { skill, severity, sourceReport, notes })
    return response.data
}

/**
 * Update a skill's status or notes
 */
export const updateSkill = async ({ skillId, status, notes }) => {
    const payload = {}
    if (status !== undefined) payload.status = status
    if (notes !== undefined) payload.notes = notes
    const response = await api.patch(`/api/skills/${skillId}`, payload)
    return response.data
}

/**
 * Delete a skill
 */
export const deleteSkill = async (skillId) => {
    const response = await api.delete(`/api/skills/${skillId}`)
    return response.data
}

/**
 * Save a mastered skill to the user's profile (UserProfile collection)
 */
export const saveSkillToProfile = async (skillId) => {
    const response = await api.post(`/api/skills/${skillId}/save-to-profile`)
    return response.data
}

/**
 * Get user's profile-level mastered skills
 */
export const getProfileSkills = async () => {
    const response = await api.get('/api/skills/profile')
    return response.data
}

/**
 * Generate resume HTML with profile mastered skills injected
 */
export const generateResumeWithSkillsHtml = async (interviewReportId) => {
    const response = await api.post(
        `/api/interview/resume/pdf-with-skills/${interviewReportId}`,
        null,
        { responseType: 'text' }
    )
    return response.data
}
