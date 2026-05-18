export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
}

export const themes: Record<string, ThemeDefinition> = {
  apple: {
    id: 'apple',
    label: 'Apple',
    description: 'Frosted-glass dashboard, swipable locations, Voyager map.',
  },
};

export type ThemeId = keyof typeof themes;
export const DEFAULT_THEME: ThemeId = 'apple';
