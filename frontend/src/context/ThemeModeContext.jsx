import { createContext, useContext } from 'react';

const ThemeModeContext = createContext(null);
export const ThemeModeProvider = ThemeModeContext.Provider;

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error('useThemeMode must be used within ThemeModeProvider.');
  return context;
}
