import { createContext, useState } from 'react'

export const SkillContext = createContext()

export const SkillProvider = ({ children }) => {
    const [skills, setSkills] = useState([])
    const [skillsLoading, setSkillsLoading] = useState(false)

    return (
        <SkillContext.Provider value={{ skills, setSkills, skillsLoading, setSkillsLoading }}>
            {children}
        </SkillContext.Provider>
    )
}
