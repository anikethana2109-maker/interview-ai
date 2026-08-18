import api from "../../../api"

/**
 * Generate an interview report by sending job description, self-description, and optional resume PDF
 */
export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
    const formData = new FormData()
    formData.append("jobDescription", jobDescription || "")
    formData.append("selfDescription", selfDescription || "")
    if (resumeFile instanceof File || resumeFile instanceof Blob) {
        formData.append("resume", resumeFile)
    }

    const response = await api.post("/api/interview/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
    })
    return response.data
}

/**
 * Get a single interview report by ID
 */
export const getInterviewReportById = async (interviewId) => {
    const response = await api.get(`/api/interview/report/${interviewId}`)
    return response.data
}

/**
 * Get all interview reports of logged in user
 */
export const getAllInterviewReports = async () => {
    const response = await api.get("/api/interview/")
    return response.data
}

/**
 * Generate resume — backend returns HTML string; we convert to PDF client-side
 */
export const generateResumeHtml = async ({ interviewReportId }) => {
    const response = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        null,
        { responseType: "text" }
    )
    return response.data
}