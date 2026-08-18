import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumeHtml } from "../services/interview.api"
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context"
import { useParams } from "react-router"

export const useInterview = () => {
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    // Generate a new interview report
    const generateReport = async ({ jobDescription, selfDescription, resumeFile }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile })
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
            return response?.interviewReport
        } catch (error) {
            console.error("Error generating report:", error)
            throw error
        } finally {
            setLoading(false)
        }
    }

    // Get a single report by ID
    const getReportById = async (id) => {
        setLoading(true)
        try {
            const response = await getInterviewReportById(id)
            if (response?.interviewReport) {
                setReport(response.interviewReport)
            }
            return response?.interviewReport
        } catch (error) {
            console.error("Error fetching report:", error)
            return null
        } finally {
            setLoading(false)
        }
    }

    // Get all reports for current user
    const getReports = async () => {
        setLoading(true)
        try {
            const response = await getAllInterviewReports()
            if (response?.interviewReports) {
                setReports(response.interviewReports)
            }
            return response?.interviewReports || []
        } catch (error) {
            console.error("Error fetching reports:", error)
            return []
        } finally {
            setLoading(false)
        }
    }

    // Download resume as PDF using html2pdf (client-side rendering)
    const getResumePdf = async (interviewReportId) => {
        setLoading(true)
        try {
            const htmlContent = await generateResumeHtml({ interviewReportId })

            if (!htmlContent || typeof htmlContent !== "string") {
                throw new Error("Invalid resume content received from server")
            }

            // Dynamically import html2pdf to avoid SSR issues
            const html2pdfModule = await import("html2pdf.js")
            const html2pdf = html2pdfModule.default || html2pdfModule

            // Create a hidden container
            const container = document.createElement("div")
            container.innerHTML = htmlContent
            container.style.cssText = "position:fixed;left:-9999px;top:0;width:794px;background:white;"
            document.body.appendChild(container)

            const opt = {
                margin: [8, 8, 8, 8],
                filename: `resume_${interviewReportId}.pdf`,
                image: { type: "jpeg", quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, logging: false },
                jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
            }

            await html2pdf().set(opt).from(container).save()
            document.body.removeChild(container)
        } catch (error) {
            console.error("Failed to generate resume PDF:", error)
            // Last resort fallback: open in new window to print
            try {
                const htmlContent = await generateResumeHtml({ interviewReportId })
                const win = window.open("", "_blank")
                if (win) {
                    win.document.write(htmlContent)
                    win.document.close()
                    win.focus()
                    setTimeout(() => win.print(), 800)
                }
            } catch (e) {
                alert("Could not generate resume. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return { loading, report, reports, generateReport, getReportById, getReports, getResumePdf }
}