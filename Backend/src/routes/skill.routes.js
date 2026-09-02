const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const skillController = require('../controllers/skill.controller')

const skillRouter = express.Router()

/**
 * @route GET /api/skills/
 * @description Get all skills for the current user
 * @access Private
 */
skillRouter.get('/', authMiddleware.authUser, skillController.getAllSkillsController)

/**
 * @route GET /api/skills/profile
 * @description Get user's profile-level mastered skills
 * @access Private
 */
skillRouter.get('/profile', authMiddleware.authUser, skillController.getProfileSkillsController)

/**
 * @route POST /api/skills/
 * @description Add (or upsert) a skill to the tracker
 * @access Private
 */
skillRouter.post('/', authMiddleware.authUser, skillController.addSkillController)

/**
 * @route POST /api/skills/:skillId/save-to-profile
 * @description Save a mastered skill to the user's profile
 * @access Private
 */
skillRouter.post('/:skillId/save-to-profile', authMiddleware.authUser, skillController.saveToProfileController)

/**
 * @route PATCH /api/skills/:skillId
 * @description Update a skill's status or notes
 * @access Private
 */
skillRouter.patch('/:skillId', authMiddleware.authUser, skillController.updateSkillController)

/**
 * @route DELETE /api/skills/:skillId
 * @description Delete a skill from the tracker
 * @access Private
 */
skillRouter.delete('/:skillId', authMiddleware.authUser, skillController.deleteSkillController)

module.exports = skillRouter
