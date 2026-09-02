const express = require('express')
const authMiddleware = require('../middlewares/auth.middleware')
const c = require('../controllers/skill.controller')

const skillRouter = express.Router()

// ── Tracker ───────────────────────────────────────────────────────────────────
skillRouter.get('/',    authMiddleware.authUser, c.getAllSkillsController)
skillRouter.post('/',   authMiddleware.authUser, c.addSkillController)
skillRouter.patch('/:skillId',  authMiddleware.authUser, c.updateSkillController)
skillRouter.delete('/:skillId', authMiddleware.authUser, c.deleteSkillController)

// ── Full Profile (one-shot for resume sync) ───────────────────────────────────
skillRouter.get('/full-profile', authMiddleware.authUser, c.getFullProfileController)

// ── Profile Skills ────────────────────────────────────────────────────────────
skillRouter.get('/profile',                         authMiddleware.authUser, c.getProfileSkillsController)
skillRouter.post('/:skillId/save-to-profile',       authMiddleware.authUser, c.saveToProfileController)

// ── Custom Skills ─────────────────────────────────────────────────────────────
skillRouter.get('/custom',    authMiddleware.authUser, c.getCustomSkillsController)
skillRouter.post('/custom',   authMiddleware.authUser, c.addCustomSkillController)
skillRouter.delete('/custom', authMiddleware.authUser, c.deleteCustomSkillController)

// ── Certifications ────────────────────────────────────────────────────────────
skillRouter.get('/certifications',           authMiddleware.authUser, c.getCertificationsController)
skillRouter.post('/certifications',          authMiddleware.authUser, c.addCertificationController)
skillRouter.delete('/certifications/:certId', authMiddleware.authUser, c.deleteCertificationController)

// ── Learning Pathways ─────────────────────────────────────────────────────────
skillRouter.get('/pathways',                                   authMiddleware.authUser, c.getLearningPathwaysController)
skillRouter.post('/pathways',                                  authMiddleware.authUser, c.generateLearningPathwayController)
skillRouter.patch('/pathways/:pathwayId/subtopic/:index',      authMiddleware.authUser, c.toggleSubtopicController)
skillRouter.post('/pathways/:pathwayId/graduate',              authMiddleware.authUser, c.graduatePathwayController)
skillRouter.delete('/pathways/:pathwayId',                     authMiddleware.authUser, c.deleteLearningPathwayController)

module.exports = skillRouter
