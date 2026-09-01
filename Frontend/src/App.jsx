import { RouterProvider } from "react-router"
import { router } from "./app.routes.jsx"
import { AuthProvider } from "./features/auth/auth.context.jsx"
import { InterviewProvider } from "./features/interview/interview.context.jsx"
import { SkillProvider } from "./features/skills/skill.context.jsx"
import { useEffect } from "react"

// Apply saved theme before first render to avoid flash
function initTheme() {
  const stored = localStorage.getItem('theme')
  const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', stored || preferred)
}

function App() {
  useEffect(() => {
    initTheme()
  }, [])

  return (
    <AuthProvider>
      <InterviewProvider>
        <SkillProvider>
          <RouterProvider router={router} />
        </SkillProvider>
      </InterviewProvider>
    </AuthProvider>
  )
}

export default App
