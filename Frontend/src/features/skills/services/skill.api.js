import api from '../../../api'

// ── Tracker Skills ─────────────────────────────────────────────────────────────
export const getAllSkills = async () => {
    const r = await api.get('/api/skills/')
    return r.data
}
export const addSkill = async ({ skill, severity, sourceReport, notes }) => {
    const r = await api.post('/api/skills/', { skill, severity, sourceReport, notes })
    return r.data
}
export const updateSkill = async ({ skillId, status, notes }) => {
    const payload = {}
    if (status !== undefined) payload.status = status
    if (notes  !== undefined) payload.notes  = notes
    const r = await api.patch(`/api/skills/${skillId}`, payload)
    return r.data
}
export const deleteSkill = async (skillId) => {
    const r = await api.delete(`/api/skills/${skillId}`)
    return r.data
}

// ── Profile Skills ─────────────────────────────────────────────────────────────
export const saveSkillToProfile = async (skillId) => {
    const r = await api.post(`/api/skills/${skillId}/save-to-profile`)
    return r.data
}
export const getProfileSkills = async () => {
    const r = await api.get('/api/skills/profile')
    return r.data
}

// ── Custom Skills (add existing skills directly) ───────────────────────────────
export const getCustomSkills = async () => {
    const r = await api.get('/api/skills/custom')
    return r.data
}
export const addCustomSkill = async ({ skill, category }) => {
    const r = await api.post('/api/skills/custom', { skill, category })
    return r.data
}
export const deleteCustomSkill = async (skillName) => {
    const r = await api.delete('/api/skills/custom', { data: { skillName } })
    return r.data
}

// ── Certifications ─────────────────────────────────────────────────────────────
export const getCertifications = async () => {
    const r = await api.get('/api/skills/certifications')
    return r.data
}
export const addCertification = async (certData) => {
    const r = await api.post('/api/skills/certifications', certData)
    return r.data
}
export const deleteCertification = async (certId) => {
    const r = await api.delete(`/api/skills/certifications/${certId}`)
    return r.data
}

// ── Learning Pathways ──────────────────────────────────────────────────────────
export const getLearningPathways = async () => {
    const r = await api.get('/api/skills/pathways')
    return r.data
}
export const createLearningPathway = async ({ skillName, level }) => {
    const r = await api.post('/api/skills/pathways', { skillName, level })
    return r.data
}
export const toggleSubtopic = async ({ pathwayId, index }) => {
    const r = await api.patch(`/api/skills/pathways/${pathwayId}/subtopic/${index}`)
    return r.data
}
export const graduatePathway = async (pathwayId) => {
    const r = await api.post(`/api/skills/pathways/${pathwayId}/graduate`)
    return r.data
}
export const deleteLearningPathway = async (pathwayId) => {
    const r = await api.delete(`/api/skills/pathways/${pathwayId}`)
    return r.data
}

// ── Full Profile (one-shot for resume sync) ────────────────────────────────────
export const getFullProfile = async () => {
    const r = await api.get('/api/skills/full-profile')
    return r.data
}

// ── Resume Generation ──────────────────────────────────────────────────────────
export const generateResumeWithSkillsHtml = async (interviewReportId) => {
    // Both endpoints now auto-sync profile skills; use pdf-with-skills for clarity
    const r = await api.post(
        `/api/interview/resume/pdf-with-skills/${interviewReportId}`,
        null,
        { responseType: 'text' }
    )
    return r.data
}
export const generateResumeHtml = async (interviewReportId) => {
    const r = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        null,
        { responseType: 'text' }
    )
    return r.data
}
