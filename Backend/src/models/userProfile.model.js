const mongoose = require('mongoose')

const masteredSkillSchema = new mongoose.Schema({
    skill: {
        type: String,
        required: true,
        trim: true,
    },
    notes: {
        type: String,
        default: '',
        trim: true,
    },
    sourceReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InterviewReport',
        default: null,
    },
    savedAt: {
        type: Date,
        default: Date.now,
    },
}, { _id: false })

const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,   // one profile per user
    },
    masteredSkills: {
        type: [masteredSkillSchema],
        default: [],
    },
}, { timestamps: true })

const userProfileModel = mongoose.model('UserProfile', userProfileSchema)

module.exports = userProfileModel
