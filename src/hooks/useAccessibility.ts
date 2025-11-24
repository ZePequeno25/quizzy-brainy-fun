import { useState, useEffect } from 'react';

type FontSize = 'small' | 'normal' | 'large' | 'extra-large';
type Theme = 'light' | 'dark';

export const useAccessibility = () => {
  const [fontSize, setFontSize] = useState<FontSize>('normal');
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // Carregar configuração salva do localStorage
    const savedFontSize = localStorage.getItem('accessibility-font-size') as FontSize;
    if (savedFontSize) {
      setFontSize(savedFontSize);
      applyFontSize(savedFontSize);
    }

    const savedTheme = localStorage.getItem('accessibility-theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyFontSize = (size: FontSize) => {
    // Remove classes anteriores
    document.documentElement.classList.remove(
      'font-size-small',
      'font-size-normal', 
      'font-size-large',
      'font-size-extra-large'
    );
    
    // Adiciona nova classe
    document.documentElement.classList.add(`font-size-${size}`);
  };

  const changeFontSize = (newSize: FontSize) => {
    setFontSize(newSize);
    applyFontSize(newSize);
    localStorage.setItem('accessibility-font-size', newSize);
  };

  const increaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = Math.min(currentIndex + 1, sizes.length - 1);
    changeFontSize(sizes[nextIndex]);
  };

  const decreaseFontSize = () => {
    const sizes: FontSize[] = ['small', 'normal', 'large', 'extra-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = Math.max(currentIndex - 1, 0);
    changeFontSize(sizes[nextIndex]);
  };

  const resetFontSize = () => {
    changeFontSize('normal');
  };

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('accessibility-theme', newTheme);
  };

  return {
    fontSize,
    theme,
    changeFontSize,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    toggleTheme,
  };
};