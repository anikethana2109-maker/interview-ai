const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")
const userProfileModel = require("../models/userProfile.model")

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
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
                const parsed = await pdfParse(req.file.buffer)
                resumeText = parsed.text ? parsed.text.trim() : ""
            } catch (pdfErr) {
                console.error("PDF parsing error:", pdfErr.message)
                return res.status(400).json({
                    message: "Unable to read your PDF. Please ensure it's a standard PDF with selectable text (not a scanned image)."
                })
            }
        }

        if (!resumeText && (!selfDescription || !selfDescription.trim())) {
            return res.status(400).json({
                message: "Please provide either a resume PDF or a self-description."
            })
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription,
            jobDescription
        })

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            resume: resumeText,
            selfDescription,
            jobDescription,
            ...interViewReportByAi
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error generating interview report:", err)
        res.status(500).json({ message: err.message || "Failed to generate interview report" })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (err) {
        console.error("Error fetching report:", err)
        res.status(500).json({ message: err.message || "Failed to fetch interview report" })
    }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel
            .find({ user: req.user.id })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (err) {
        console.error("Error fetching reports:", err)
        res.status(500).json({ message: err.message || "Failed to fetch reports" })
    }
}

/**
 * @description Controller to generate resume HTML (returned to frontend for PDF conversion).
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        const { resume = "", jobDescription = "", selfDescription = "" } = interviewReport

        const result = await generateResumePdf({ resume, jobDescription, selfDescription })

        // result.type is always "html" (puppeteer not available in serverless)
        // Frontend uses html2pdf to convert it to PDF client-side
        res.set("Content-Type", "text/html; charset=utf-8")
        res.set("X-Content-Type", "resume-html")
        return res.send(result.data)
    } catch (err) {
        console.error("Resume generation error:", err)
        res.status(500).json({ message: err.message || "Failed to generate resume" })
    }
}

/**
 * @description Generate resume HTML with user's profile mastered skills injected.
 *              Uses the same AI pipeline as generateResumePdfController but adds
 *              the mastered skills the user has officially saved to their profile.
 */
async function generateResumeWithSkillsController(req, res) {
    try {
        const { interviewReportId } = req.params

        const interviewReport = await interviewReportModel.findOne({
            _id: interviewReportId,
            user: req.user.id
        })
        if (!interviewReport) {
            return res.status(404).json({ message: "Interview report not found." })
        }

        // Fetch profile skills
        const profile = await userProfileModel.findOne({ user: req.user.id })
        const masteredSkills = profile?.masteredSkills?.map(s => s.skill) || []

        const { resume = "", jobDescription = "", selfDescription = "" } = interviewReport

        // Inject mastered skills into the prompt
        const skillsNote = masteredSkills.length > 0
            ? `\n\nIMPORTANT: The candidate has OFFICIALLY MASTERED these skills (must be prominently listed in the Skills section): ${masteredSkills.join(', ')}`
            : ''

        const result = await generateResumePdf({
            resume,
            jobDescription: jobDescription + skillsNote,
            selfDescription,
        })

        res.set("Content-Type", "text/html; charset=utf-8")
        res.set("X-Content-Type", "resume-html-with-skills")
        return res.send(result.data)
    } catch (err) {
        console.error("Resume-with-skills generation error:", err)
        res.status(500).json({ message: err.message || "Failed to generate resume with skills" })
    }
}

module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController,
    generateResumeWithSkillsController,
}