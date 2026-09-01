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
 * @route POST /api/skills/
 * @description Add (or upsert) a skill to the tracker
 * @access Private
 */
skillRouter.post('/', authMiddleware.authUser, skillController.addSkillController)

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
