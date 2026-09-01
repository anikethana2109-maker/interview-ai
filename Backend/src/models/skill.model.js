const mongoose = require('mongoose')

const skillSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    skill: {
        type: String,
        required: [true, 'Skill name is required'],
        trim: true,
    },
    severity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium',
    },
    status: {
        type: String,
        enum: ['not-started', 'in-progress', 'mastered'],
        default: 'not-started',
    },
    sourceReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewReport',
        default: null,
    },
    notes: {
        type: String,
        default: '',
        trim: true,
    },
}, { timestamps: true })

// Prevent duplicate skills per user (case-insensitive handled at controller)
skillSchema.index({ user: 1, skill: 1 }, { unique: true })

const skillModel = mongoose.model('Skill', skillSchema)

module.exports = skillModel
