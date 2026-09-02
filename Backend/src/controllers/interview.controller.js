const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const userProfileModel     = require("../models/userProfile.model")

// ── Helper: get all profile skills + certs for a user ─────────────────────────
async function getUserProfileData(userId) {
    const profile = await userProfileModel.findOne({ user: userId })
    if (!profile) return { masteredSkills: [], certifications: [] }

    const mastered = [
        ...(profile.masteredSkills || []).map(s => s.skill),
        ...(profile.customSkills   || []).map(s => s.skill),
    ]
    return {
        masteredSkills: [...new Set(mastered)],   // deduplicate
        certifications: profile.certifications || [],
    }
}

/**
 * POST /api/interview/
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription = "", jobDescription = "" } = req.body

        if (!jobDescription || !jobDescription.trim()) {
            return res.status(400).json({ message: "Job description is required." })
        }

        let resumeText = ""
        if (req.file && req.file.buffer) {
            try {
                const pdfParse = require("pdf-parse")
                const parsed   = await pdfParse(req.file.buffer)
                resumeText = parsed.text ? parsed.text.trim() : ""
            } catch (pdfErr) {
                console.error("PDF parsing error:", pdfErr.message)
                return res.status(400).json({
                    message: "Unable to read your PDF. Please ensure it's a standard PDF with selectable text (not a scanned image)."
                })
            }
        }

        if (!resumeText && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({ message: "Please provide either a resume PDF or a self-description." })
        }

        const interViewReportByAi = await generateInterviewReport({ resume: resumeText, selfDescription, jobDescription })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({ message: "Interview report generated successfully.", interviewReport })
    } catch (err) {
        console.error("Error generating interview report:", err)
        res.status(500).json({ message: err.message || "Failed to generate interview report" })
    }
}

/**
 * GET /api/interview/report/:interviewId
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const interviewReport = await interviewReportModel.findOne({ _id: req.params.interviewId, user: req.user.id })
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })
        res.status(200).json({ message: "Interview report fetched successfully.", interviewReport })
    } catch (err) {
        console.error("Error fetching report:", err)
        res.status(500).json({ message: err.message || "Failed to fetch interview report" })
    }
}

/**
 * GET /api/interview/
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({ message: "Interview reports fetched successfully.", interviewReports })
    } catch (err) {
        console.error("Error fetching reports:", err)
        res.status(500).json({ message: err.message || "Failed to fetch reports" })
    }
}

/**
 * POST /api/interview/resume/pdf/:interviewReportId
 * Standard resume — auto-injects profile mastered skills + certifications
 */
async function generateResumePdfController(req, res) {
    try {
        const interviewReport = await interviewReportModel.findById(req.params.interviewReportId)
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })

        const { resume = "", jobDescription = "", selfDescription = "" } = interviewReport
        const { masteredSkills, certifications } = await getUserProfileData(req.user.id)

        const result = await generateResumePdf({ resume, jobDescription, selfDescription, masteredSkills, certifications })

        res.set("Content-Type", "text/html; charset=utf-8")
        res.set("X-Content-Type", "resume-html")
        return res.send(result.data)
    } catch (err) {
        console.error("Resume generation error:", err)
        res.status(500).json({ message: err.message || "Failed to generate resume" })
    }
}

/**
 * POST /api/interview/resume/pdf-with-skills/:interviewReportId
 * Same as above — kept for backwards compatibility, now identical to pdf endpoint
 * since both auto-inject profile data
 */
async function generateResumeWithSkillsController(req, res) {
    return generateResumePdfController(req, res)
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    generateResumeWithSkillsController,
}