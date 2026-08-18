const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

let aiClient = null

function getAiClient() {
    if (!aiClient) {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY
        if (!apiKey) {
            throw new Error("GOOGLE_GENAI_API_KEY is not configured in environment variables.")
        }
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

const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("A technical question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("A behavioral question that can be asked in the interview"),
        intention: z.string().describe("The intention of the interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
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

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The complete self-contained HTML content of the resume, ready to be printed as PDF")
    })

    const prompt = `Generate a professional, ATS-friendly resume in HTML format for a candidate with the following details:
Resume/Experience: ${resume || "Not provided"}
Self Description: ${selfDescription || "Not provided"}
Job Description: ${jobDescription || "Not provided"}

Requirements:
- The HTML must be completely self-contained with all CSS inline or in a <style> tag
- Use a clean, professional design with good typography
- Make it ATS-friendly (no images, tables for layout only if needed, clear section headings)
- Tailor content to match the job description
- Keep it to 1-2 pages when printed
- Use a color scheme of #1a1a2e (dark navy) for headings and #6c63ff (purple) for accents
- Include sections: Contact Info, Summary, Skills, Experience, Education (use available data)
- Do NOT include placeholder data - only use what's provided`

    const response = await generateContentWithRetry({
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    // Return the HTML — the controller will handle sending it
    // Puppeteer is not available in serverless, so frontend converts HTML to PDF
    return { type: "html", data: jsonContent.html }
}

module.exports = { generateInterviewReport, generateResumePdf }