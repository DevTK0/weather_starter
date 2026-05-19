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
  junglegreen: {
    id: 'junglegreen',
    label: 'Jungle Green',
    description: 'Deep canopy greens with a lush, shadowy forest atmosphere.',
  },
  oceanblue: {
    id: 'oceanblue',
    label: 'Ocean Blue',
    description: 'Deep-sea blues fading into the midnight trench.',
  },
  summeryellow: {
    id: 'summeryellow',
    label: 'Summer Yellow',
    description: 'Warm golden sunshine with a hazy afternoon glow.',
  },
};

export type ThemeId = keyof typeof themes;
export const DEFAULT_THEME: ThemeId = 'apple';
