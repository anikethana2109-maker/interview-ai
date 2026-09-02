const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

let aiClient = null

function getAiClient() {
    if (!aiClient) {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY
        if (!apiKey) throw new Error("GOOGLE_GENAI_API_KEY is not configured in environment variables.")
        aiClient = new GoogleGenAI({ apiKey })
    }
    return aiClient
}

// Models tried in order — falls back if one is 503 overloaded or 404
const MODEL_CHAIN = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"]

async function generateContentWithRetry(params) {
    const ai = getAiClient()
    let lastError = null
    for (const model of MODEL_CHAIN) {
        try {
            return await ai.models.generateContent({ ...params, model })
        } catch (err) {
            const msg = err?.message || ""
            const isRetryable = msg.includes("503") || msg.includes("UNAVAILABLE") || msg.includes("no longer available") || msg.includes("NOT_FOUND")
            lastError = err
            if (!isRetryable) throw err
            console.log(`Model ${model} failed, trying next...`)
        }
    }
    throw lastError
}

// ── Interview Report ──────────────────────────────────────────────────────────

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question:  z.string().describe("A technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer:    z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question:  z.string().describe("A behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer:    z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill:    z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day:   z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `Generate a comprehensive interview report for a candidate with the following details:
Resume: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription}

Be specific, practical and actionable. Generate 5-7 technical questions and 3-5 behavioral questions.
Create a 7-day preparation plan with clear daily tasks.`

    const response = await generateContentWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}

// ── Resume PDF ────────────────────────────────────────────────────────────────

/**
 * @param {string} resume
 * @param {string} selfDescription
 * @param {string} jobDescription
 * @param {string[]} masteredSkills   - from UserProfile.masteredSkills + customSkills
 * @param {Object[]} certifications   - from UserProfile.certifications
 */
async function generateResumePdf({ resume, selfDescription, jobDescription, masteredSkills = [], certifications = [] }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The complete self-contained HTML content of the resume, ready to be printed as PDF")
    })

    const skillsSection = masteredSkills.length > 0
        ? `\n\nVerified Mastered Skills (MUST be prominently listed in Skills section): ${masteredSkills.join(', ')}`
        : ''

    const certsSection = certifications.length > 0
        ? `\n\nCertifications (MUST appear in a dedicated Certifications section):
${certifications.map(c =>
    `- ${c.title} by ${c.issuer}${c.issueDate ? ` (${c.issueDate})` : ''}${c.credentialId ? ` | ID: ${c.credentialId}` : ''}${c.credentialUrl ? ` | ${c.credentialUrl}` : ''}`
).join('\n')}`
        : ''

    const prompt = `Generate a professional, ATS-friendly resume in HTML format for a candidate with the following details:
Resume/Experience: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription || "Not provided"}${skillsSection}${certsSection}

Requirements:
- The HTML must be completely self-contained with all CSS inline or in a <style> tag
- Use a clean, professional design with good typography
- Make it ATS-friendly (no images, tables for layout only if needed, clear section headings)
- Tailor content to match the job description
- Keep it to 1-2 pages when printed
- Use a color scheme of #1a1a2e (dark navy) for headings and #6c63ff (purple) for accents
- Include sections: Contact Info, Summary, Skills, Experience, Education${certifications.length > 0 ? ', Certifications' : ''} (use available data)
- Do NOT include placeholder data - only use what's provided
- If Verified Mastered Skills are listed above, they MUST appear in the Skills section
- If Certifications are listed above, they MUST appear in a dedicated Certifications section`

    const response = await generateContentWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    return { type: "html", data: jsonContent.html }
}

// ── Learning Pathway Generator ────────────────────────────────────────────────

const learningPathwaySchema = z.object({
    summary: z.string().describe("A brief 1-2 sentence overview of what this skill is and why it matters"),
    subtopics: z.array(z.object({
        title:       z.string().describe("The name of this learning milestone/subtopic"),
        description: z.string().describe("What this subtopic covers (2-3 sentences)"),
        keyConcepts: z.array(z.string()).describe("3-5 key concepts or practical tasks to complete for this subtopic"),
    })).describe("4-6 ordered learning milestones that break down this skill from foundational to advanced"),
})

async function generateLearningPathway({ skillName, level = 'beginner' }) {
    const prompt = `Create a structured learning pathway for someone who wants to learn: "${skillName}"
Experience Level: ${level}

Generate 4-6 clear, progressive learning milestones that take someone from understanding the basics to being able to use this skill professionally.
Each milestone should have concrete key concepts/practical tasks.
Focus on being practical and actionable, not theoretical.`

    const response = await generateContentWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(learningPathwaySchema),
        }
    })

    return JSON.parse(response.text)
}

module.exports = { generateInterviewReport, generateResumePdf, generateLearningPathway }