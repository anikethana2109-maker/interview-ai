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
