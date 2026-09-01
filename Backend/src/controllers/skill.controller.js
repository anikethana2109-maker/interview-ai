const skillModel = require('../models/skill.model')

/**
 * @description Get all skills for the current user
 * @route GET /api/skills/
 */
async function getAllSkillsController(req, res) {
    try {
        const skills = await skillModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })

        res.status(200).json({ message: 'Skills fetched successfully.', skills })
    } catch (err) {
        console.error('Error fetching skills:', err)
        res.status(500).json({ message: err.message || 'Failed to fetch skills' })
    }
}

/**
 * @description Add (or upsert) a skill for the current user.
 *              If the same skill name already exists for this user, returns the existing one.
 * @route POST /api/skills/
 */
async function addSkillController(req, res) {
    try {
        const { skill, severity = 'medium', sourceReport = null, notes = '' } = req.body

        if (!skill || !skill.trim()) {
            return res.status(400).json({ message: 'Skill name is required.' })
        }

        // Upsert — create if not found, return existing if already tracked
        const existing = await skillModel.findOne({
            user: req.user.id,
            skill: { $regex: new RegExp(`^${skill.trim()}$`, 'i') }
        })

        if (existing) {
            return res.status(200).json({
                message: 'Skill already tracked.',
                skill: existing,
                alreadyExists: true
            })
        }

        const newSkill = await skillModel.create({
            user: req.user.id,
            skill: skill.trim(),
            severity,
            sourceReport: sourceReport || null,
            notes,
        })

        res.status(201).json({ message: 'Skill added to tracker.', skill: newSkill })
    } catch (err) {
        console.error('Error adding skill:', err)
        res.status(500).json({ message: err.message || 'Failed to add skill' })
    }
}

/**
 * @description Update a skill's status or notes
 * @route PATCH /api/skills/:skillId
 */
async function updateSkillController(req, res) {
    try {
        const { skillId } = req.params
        const { status, notes } = req.body

        const validStatuses = ['not-started', 'in-progress', 'mastered']
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value.' })
        }

        const updatePayload = {}
        if (status !== undefined) updatePayload.status = status
        if (notes !== undefined) updatePayload.notes = notes

        const skill = await skillModel.findOneAndUpdate(
            { _id: skillId, user: req.user.id },
            { $set: updatePayload },
            { new: true }
        )

        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' })
        }

        res.status(200).json({ message: 'Skill updated.', skill })
    } catch (err) {
        console.error('Error updating skill:', err)
        res.status(500).json({ message: err.message || 'Failed to update skill' })
    }
}

/**
 * @description Delete a skill
 * @route DELETE /api/skills/:skillId
 */
async function deleteSkillController(req, res) {
    try {
        const { skillId } = req.params

        const skill = await skillModel.findOneAndDelete({
            _id: skillId,
            user: req.user.id
        })

        if (!skill) {
            return res.status(404).json({ message: 'Skill not found.' })
        }

        res.status(200).json({ message: 'Skill removed from tracker.', skillId })
    } catch (err) {
        console.error('Error deleting skill:', err)
        res.status(500).json({ message: err.message || 'Failed to delete skill' })
    }
}

module.exports = {
    getAllSkillsController,
    addSkillController,
    updateSkillController,
    deleteSkillController,
}
