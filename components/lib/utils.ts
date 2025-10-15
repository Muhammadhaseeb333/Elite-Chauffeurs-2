// Type helpers
export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;

// Style utilities
export const cn = (...classes: Array<string | boolean | undefined>) => {
  return classes.filter(Boolean).join(' ');
};

// Promotion-specific utilities
export const getPromotionTheme = (theme: 'gold' | 'gradient' | 'dark') => {
  const themes = {
    gold: {
      bg: ['#000000', '#171717'],
      text: '#F59E0B',
      border: '#F59E0B',
      button: '#F59E0B',
    },
    gradient: {
      bg: ['#111827', '#1F2937'],
      text: '#FFFFFF',
      border: '#6366F1',
      button: '#6366F1',
    },
    dark: {
      bg: ['#0F172A', '#1E293B'],
      text: '#E2E8F0',
      border: '#475569',
      button: '#475569',
    },
  };
  return themes[theme];
};

// Date formatting
export const formatExpiry = (days: number) => {
  return days === 1 ? 'Expires today' : `Expires in ${days} days`;
};