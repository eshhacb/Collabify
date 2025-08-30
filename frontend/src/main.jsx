import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { BrowserRouter } from "react-router-dom";
import App from './App.jsx'
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material'
import React, { useMemo, useState, useEffect, useCallback, createContext, useContext } from 'react'

const ColorModeContext = createContext({ toggleColorMode: () => {}, mode: 'light' })

const usePersistedMode = () => {
  const [mode, setMode] = useState('light')
  useEffect(() => {
    const saved = localStorage.getItem('mui-color-mode')
    if (saved === 'light' || saved === 'dark') setMode(saved)
  }, [])
  const toggle = useCallback(() => {
    setMode(prev => {
      const next = prev === 'light' ? 'dark' : 'light'
      localStorage.setItem('mui-color-mode', next)
      return next
    })
  }, [])
  return { mode, toggle }
}

const ColorModeProvider = ({ children }) => {
  const { mode, toggle } = usePersistedMode()
  const colorMode = useMemo(() => ({ toggleColorMode: toggle, mode }), [toggle, mode])
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode])
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

export const useColorMode = () => useContext(ColorModeContext)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ColorModeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ColorModeProvider>
  </StrictMode>
)
