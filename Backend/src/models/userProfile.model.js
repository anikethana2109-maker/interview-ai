const mongoose = require('mongoose')

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const masteredSkillSchema = new mongoose.Schema({
    skill:        { type: String, required: true, trim: true },
    notes:        { type: String, default: '', trim: true },
    sourceReport: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewReport', default: null },
    savedAt:      { type: Date, default: Date.now },
}, { _id: false })

const customSkillSchema = new mongoose.Schema({
    skill:    { type: String, required: true, trim: true },
    category: { type: String, default: 'General', trim: true },
    addedAt:  { type: Date, default: Date.now },
}, { _id: false })

const certificationSchema = new mongoose.Schema({
    title:         { type: String, required: true, trim: true },
    issuer:        { type: String, required: true, trim: true },
    issueDate:     { type: String, default: '' },           // e.g. "Jun 2024" or "2024"
    credentialId:  { type: String, default: '', trim: true },
    credentialUrl: { type: String, default: '', trim: true },
    skills:        { type: [String], default: [] },         // skills this cert covers
    addedAt:       { type: Date, default: Date.now },
})

const subtopicSchema = new mongoose.Schema({
    title:        { type: String, required: true, trim: true },
    description:  { type: String, default: '' },
    keyConcepts:  { type: [String], default: [] },
    isCompleted:  { type: Boolean, default: false },
    completedAt:  { type: Date, default: null },
}, { _id: false })

const learningPathwaySchema = new mongoose.Schema({
    targetSkill:  { type: String, required: true, trim: true },
    level:        { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    summary:      { type: String, default: '' },
    subtopics:    { type: [subtopicSchema], default: [] },
    isCompleted:  { type: Boolean, default: false },
    graduatedAt:  { type: Date, default: null },
    createdAt:    { type: Date, default: Date.now },
})

// ── Main schema ───────────────────────────────────────────────────────────────

const userProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true,
    },
    masteredSkills:   { type: [masteredSkillSchema],    default: [] },
    customSkills:     { type: [customSkillSchema],      default: [] },
    certifications:   { type: [certificationSchema],   default: [] },
    learningPathways: { type: [learningPathwaySchema],  default: [] },
}, { timestamps: true })

const userProfileModel = mongoose.model('UserProfile', userProfileSchema)

module.exports = userProfileModel
