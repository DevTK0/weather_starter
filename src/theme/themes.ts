export interface ThemeDefinition {
  id: string;
  label: string;
  description: string;
  swatch: string;
}

export const themes: Record<string, ThemeDefinition> = {
  apple: {
    id: 'apple',
    label: 'Apple',
    description: 'Frosted-glass dashboard, swipable locations, Voyager map.',
    swatch: '#6f8aa8',
  },
  hotpink: {
    id: 'hotpink',
    label: 'Hot Pink',
    description: 'Bold hot-pink gradient with frosted-glass cards.',
    swatch: '#ff1493',
  },
};

export type ThemeId = keyof typeof themes;
export const DEFAULT_THEME: ThemeId = 'apple';
