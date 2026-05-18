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
  hotpink: {
    id: 'hotpink',
    label: 'Hot Pink',
    description: 'Bold hot-pink gradient with a punchy neon glow.',
  },
  powerred: {
    id: 'powerred',
    label: 'Power Red',
    description: 'Mighty Morphin red — bold crimson with a dark battle-ready edge.',
  },
};

export type ThemeId = keyof typeof themes;
export const DEFAULT_THEME: ThemeId = 'apple';
