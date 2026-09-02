const skillModel       = require('../models/skill.model')
const userProfileModel = require('../models/userProfile.model')
const { generateLearningPathway } = require('../services/ai.service')

// ── Helper: get-or-create profile ─────────────────────────────────────────────
async function getProfile(userId) {
    let profile = await userProfileModel.findOne({ user: userId })
    if (!profile) profile = await userProfileModel.create({ user: userId })
    return profile
}

// ── Tracker Skills ────────────────────────────────────────────────────────────

/**
 * GET /api/skills/
 */
async function getAllSkillsController(req, res) {
    try {
        const skills = await skillModel.find({ user: req.user.id }).sort({ createdAt: -1 })
        res.status(200).json({ message: 'Skills fetched successfully.', skills })
    } catch (err) {
        console.error('Error fetching skills:', err)
        res.status(500).json({ message: err.message || 'Failed to fetch skills' })
    }
}

/**
 * POST /api/skills/
 */
async function addSkillController(req, res) {
    try {
        const { skill, severity = 'medium', sourceReport = null, notes = '' } = req.body
        if (!skill || !skill.trim()) return res.status(400).json({ message: 'Skill name is required.' })

        const existing = await skillModel.findOne({
            user: req.user.id,
            skill: { $regex: new RegExp(`^${skill.trim()}$`, 'i') }
        })
        if (existing) return res.status(200).json({ message: 'Skill already tracked.', skill: existing, alreadyExists: true })

        const newSkill = await skillModel.create({ user: req.user.id, skill: skill.trim(), severity, sourceReport: sourceReport || null, notes })
        res.status(201).json({ message: 'Skill added to tracker.', skill: newSkill })
    } catch (err) {
        console.error('Error adding skill:', err)
        res.status(500).json({ message: err.message || 'Failed to add skill' })
    }
}

/**
 * PATCH /api/skills/:skillId
 */
async function updateSkillController(req, res) {
    try {
        const { skillId } = req.params
        const { status, notes } = req.body
        const validStatuses = ['not-started', 'in-progress', 'mastered']
        if (status && !validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status value.' })

        const updatePayload = {}
        if (status !== undefined) updatePayload.status = status
        if (notes !== undefined)  updatePayload.notes  = notes

        const skill = await skillModel.findOneAndUpdate({ _id: skillId, user: req.user.id }, { $set: updatePayload }, { new: true })
        if (!skill) return res.status(404).json({ message: 'Skill not found.' })
        res.status(200).json({ message: 'Skill updated.', skill })
    } catch (err) {
        console.error('Error updating skill:', err)
        res.status(500).json({ message: err.message || 'Failed to update skill' })
    }
}

/**
 * DELETE /api/skills/:skillId
 */
async function deleteSkillController(req, res) {
    try {
        const skill = await skillModel.findOneAndDelete({ _id: req.params.skillId, user: req.user.id })
        if (!skill) return res.status(404).json({ message: 'Skill not found.' })
        res.status(200).json({ message: 'Skill removed from tracker.', skillId: req.params.skillId })
    } catch (err) {
        console.error('Error deleting skill:', err)
        res.status(500).json({ message: err.message || 'Failed to delete skill' })
    }
}

// ── Profile Skills ────────────────────────────────────────────────────────────

/**
 * GET /api/skills/profile
 */
async function getProfileSkillsController(req, res) {
    try {
        const profile = await userProfileModel.findOne({ user: req.user.id })
        const masteredSkills = profile?.masteredSkills || []
        res.status(200).json({ message: 'Profile skills fetched.', masteredSkills })
    } catch (err) {
        console.error('Error fetching profile skills:', err)
        res.status(500).json({ message: err.message || 'Failed to fetch profile skills' })
    }
}

/**
 * POST /api/skills/:skillId/save-to-profile
 */
async function saveToProfileController(req, res) {
    try {
        const skill = await skillModel.findOne({ _id: req.params.skillId, user: req.user.id })
        if (!skill) return res.status(404).json({ message: 'Skill not found.' })
        if (skill.status !== 'mastered') return res.status(400).json({ message: 'Only mastered skills can be saved to profile.' })

        // Remove any existing entry with same name, then push fresh
        await userProfileModel.findOneAndUpdate(
            { user: req.user.id },
            { $pull: { masteredSkills: { skill: { $regex: new RegExp(`^${skill.skill.trim()}$`, 'i') } } } },
            { upsert: true }
        )
        await userProfileModel.findOneAndUpdate(
            { user: req.user.id },
            { $push: { masteredSkills: { skill: skill.skill, notes: skill.notes || '', sourceReport: skill.sourceReport || null, savedAt: new Date() } } }
        )

        const updated = await userProfileModel.findOne({ user: req.user.id })
        res.status(200).json({ message: 'Skill saved to profile.', masteredSkills: updated.masteredSkills })
    } catch (err) {
        console.error('Error saving skill to profile:', err)
        res.status(500).json({ message: err.message || 'Failed to save skill to profile' })
    }
}

// ── Custom Skills (add directly, not from tracker) ────────────────────────────

/**
 * GET /api/skills/custom
 */
async function getCustomSkillsController(req, res) {
    try {
        const profile = await userProfileModel.findOne({ user: req.user.id })
        res.status(200).json({ message: 'Custom skills fetched.', customSkills: profile?.customSkills || [] })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to fetch custom skills' })
    }
}

/**
 * POST /api/skills/custom
 */
async function addCustomSkillController(req, res) {
    try {
        const { skill, category = 'General' } = req.body
        if (!skill || !skill.trim()) return res.status(400).json({ message: 'Skill name is required.' })

        const profile = await getProfile(req.user.id)
        const exists = profile.customSkills.some(s => s.skill.toLowerCase() === skill.trim().toLowerCase())
        if (exists) return res.status(200).json({ message: 'Skill already in profile.', customSkills: profile.customSkills, alreadyExists: true })

        profile.customSkills.push({ skill: skill.trim(), category })
        await profile.save()
        res.status(201).json({ message: 'Custom skill added.', customSkills: profile.customSkills })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to add custom skill' })
    }
}

/**
 * DELETE /api/skills/custom
 */
async function deleteCustomSkillController(req, res) {
    try {
        const { skillName } = req.body
        if (!skillName) return res.status(400).json({ message: 'Skill name is required.' })

        const profile = await getProfile(req.user.id)
        const before = profile.customSkills.length
        profile.customSkills = profile.customSkills.filter(s => s.skill.toLowerCase() !== skillName.toLowerCase())
        if (profile.customSkills.length === before) return res.status(404).json({ message: 'Skill not found.' })
        await profile.save()
        res.status(200).json({ message: 'Custom skill removed.', customSkills: profile.customSkills })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to delete custom skill' })
    }
}

// ── Certifications ────────────────────────────────────────────────────────────

/**
 * GET /api/skills/certifications
 */
async function getCertificationsController(req, res) {
    try {
        const profile = await userProfileModel.findOne({ user: req.user.id })
        res.status(200).json({ message: 'Certifications fetched.', certifications: profile?.certifications || [] })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to fetch certifications' })
    }
}

/**
 * POST /api/skills/certifications
 */
async function addCertificationController(req, res) {
    try {
        const { title, issuer, issueDate, credentialId, credentialUrl, skills } = req.body
        if (!title?.trim() || !issuer?.trim()) return res.status(400).json({ message: 'Title and issuer are required.' })

        const profile = await getProfile(req.user.id)
        profile.certifications.push({ title: title.trim(), issuer: issuer.trim(), issueDate: issueDate || '', credentialId: credentialId || '', credentialUrl: credentialUrl || '', skills: skills || [] })
        await profile.save()
        res.status(201).json({ message: 'Certification added.', certifications: profile.certifications })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to add certification' })
    }
}

/**
 * DELETE /api/skills/certifications/:certId
 */
async function deleteCertificationController(req, res) {
    try {
        const profile = await getProfile(req.user.id)
        const before = profile.certifications.length
        profile.certifications = profile.certifications.filter(c => c._id.toString() !== req.params.certId)
        if (profile.certifications.length === before) return res.status(404).json({ message: 'Certification not found.' })
        await profile.save()
        res.status(200).json({ message: 'Certification removed.', certifications: profile.certifications })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to delete certification' })
    }
}

// ── Learning Pathways ─────────────────────────────────────────────────────────

/**
 * GET /api/skills/pathways
 */
async function getLearningPathwaysController(req, res) {
    try {
        const profile = await userProfileModel.findOne({ user: req.user.id })
        res.status(200).json({ message: 'Learning pathways fetched.', learningPathways: profile?.learningPathways || [] })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to fetch pathways' })
    }
}

/**
 * POST /api/skills/pathways
 */
async function generateLearningPathwayController(req, res) {
    try {
        const { skillName, level = 'beginner' } = req.body
        if (!skillName?.trim()) return res.status(400).json({ message: 'Skill name is required.' })

        const ai = await generateLearningPathway({ skillName: skillName.trim(), level })
        const profile = await getProfile(req.user.id)

        profile.learningPathways.push({
            targetSkill: skillName.trim(),
            level,
            summary:    ai.summary,
            subtopics:  ai.subtopics,
            isCompleted: false,
        })
        await profile.save()

        const newPathway = profile.learningPathways[profile.learningPathways.length - 1]
        res.status(201).json({ message: 'Learning pathway generated.', pathway: newPathway })
    } catch (err) {
        console.error('Error generating pathway:', err)
        res.status(500).json({ message: err.message || 'Failed to generate learning pathway' })
    }
}

/**
 * PATCH /api/skills/pathways/:pathwayId/subtopic/:index
 * Toggle subtopic completion
 */
async function toggleSubtopicController(req, res) {
    try {
        const { pathwayId, index } = req.params
        const profile = await getProfile(req.user.id)
        const pathway = profile.learningPathways.id(pathwayId)
        if (!pathway) return res.status(404).json({ message: 'Pathway not found.' })

        const idx = parseInt(index, 10)
        if (idx < 0 || idx >= pathway.subtopics.length) return res.status(400).json({ message: 'Invalid subtopic index.' })

        const sub = pathway.subtopics[idx]
        sub.isCompleted = !sub.isCompleted
        sub.completedAt = sub.isCompleted ? new Date() : null

        // Mark pathway complete if all subtopics done
        pathway.isCompleted = pathway.subtopics.every(s => s.isCompleted)

        await profile.save()
        res.status(200).json({ message: 'Subtopic toggled.', pathway })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to toggle subtopic' })
    }
}

/**
 * POST /api/skills/pathways/:pathwayId/graduate
 * Graduate completed pathway skill to masteredSkills profile
 */
async function graduatePathwayController(req, res) {
    try {
        const { pathwayId } = req.params
        const profile = await getProfile(req.user.id)
        const pathway = profile.learningPathways.id(pathwayId)
        if (!pathway) return res.status(404).json({ message: 'Pathway not found.' })
        if (!pathway.isCompleted) return res.status(400).json({ message: 'Complete all subtopics before graduating.' })

        // Remove any existing mastered entry for same skill then push
        profile.masteredSkills = profile.masteredSkills.filter(s => s.skill.toLowerCase() !== pathway.targetSkill.toLowerCase())
        profile.masteredSkills.push({ skill: pathway.targetSkill, notes: `Learned via Learning Pathway (${pathway.level})`, savedAt: new Date() })
        pathway.graduatedAt = new Date()

        await profile.save()
        res.status(200).json({ message: `${pathway.targetSkill} graduated to profile!`, masteredSkills: profile.masteredSkills })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to graduate pathway' })
    }
}

/**
 * DELETE /api/skills/pathways/:pathwayId
 */
async function deleteLearningPathwayController(req, res) {
    try {
        const profile = await getProfile(req.user.id)
        const before = profile.learningPathways.length
        profile.learningPathways = profile.learningPathways.filter(p => p._id.toString() !== req.params.pathwayId)
        if (profile.learningPathways.length === before) return res.status(404).json({ message: 'Pathway not found.' })
        await profile.save()
        res.status(200).json({ message: 'Pathway deleted.' })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to delete pathway' })
    }
}

// ── Full Profile (for resume sync) ────────────────────────────────────────────

/**
 * GET /api/skills/full-profile
 * Returns the complete profile in one shot (masteredSkills, customSkills, certifications, pathways)
 */
async function getFullProfileController(req, res) {
    try {
        const profile = await userProfileModel.findOne({ user: req.user.id })
        res.status(200).json({
            message: 'Full profile fetched.',
            masteredSkills:   profile?.masteredSkills   || [],
            customSkills:     profile?.customSkills     || [],
            certifications:   profile?.certifications   || [],
            learningPathways: profile?.learningPathways || [],
        })
    } catch (err) {
        res.status(500).json({ message: err.message || 'Failed to fetch full profile' })
    }
}

module.exports = {
    // Tracker
    getAllSkillsController,
    addSkillController,
    updateSkillController,
    deleteSkillController,
    // Profile
    getProfileSkillsController,
    saveToProfileController,
    // Custom Skills
    getCustomSkillsController,
    addCustomSkillController,
    deleteCustomSkillController,
    // Certifications
    getCertificationsController,
    addCertificationController,
    deleteCertificationController,
    // Learning Pathways
    getLearningPathwaysController,
    generateLearningPathwayController,
    toggleSubtopicController,
    graduatePathwayController,
    deleteLearningPathwayController,
    // Full Profile
    getFullProfileController,
}
