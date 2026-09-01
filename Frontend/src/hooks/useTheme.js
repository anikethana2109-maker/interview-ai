import { useState, useEffect } from 'react'

export const useTheme = () => {
    const getInitialTheme = () => {
        const stored = localStorage.getItem('theme')
        if (stored) return stored
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }

    const [theme, setTheme] = useState(() => {
        // Safe default for SSR-like scenarios
        if (typeof window === 'undefined') return 'dark'
        return getInitialTheme()
    })

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme)
        localStorage.setItem('theme', theme)
    }, [theme])

    const toggleTheme = () => setTheme(t => (t === 'dark' ? 'light' : 'dark'))

    return { theme, toggleTheme }
}
