/**
 * Global Color Palette - Single Source of Truth
 * Modify colors here to update the entire application theme instantly.
 */

export const palette = {
  // Brand Primary (Deep Spruce / Forest Emerald)
  primary: {
    50: '#edfbf7',
    100: '#d8faef',
    200: '#a7f3e2',
    300: '#6ee0c5',
    400: '#34c4a2',
    500: '#1fa384',
    600: '#128067',
    700: '#0b6652',
    800: '#064D3D', // Primary Base
    900: '#043228',
    DEFAULT: '#064D3D',
  },

  // Brand Secondary (Natural Olive / Meadow Green)
  secondary: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65A30D', // Secondary Base
    700: '#4d7c0f',
    800: '#3f6608',
    900: '#274005',
    DEFAULT: '#65A30D',
  },

  // Brand Tertiary (Vibrant Chartreuse / Lime Accent)
  tertiary: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84CC16', // Tertiary Base
    600: '#65a30d',
    DEFAULT: '#84CC16',
  },

  // Neutral Tone Scale (Clean, warm light surfaces with rich contrast)
  neutral: {
    50: '#FFFFFF',
    100: '#FDFDFD',
    200: '#F4F7F4', // Canvas / App background
    300: '#E7ECE8', // Card background / borders
    400: '#CBD5CD', // Input borders & dividers
    500: '#889A90', // Muted text & placeholders
    600: '#55685E', // Body / secondary text
    700: '#34463C', // Heading subtitles
    800: '#1A2A21', // Dark button / Inverted
    900: '#0D1A14', // Primary text
  },

  // Functional Semantic Accents
  status: {
    success: '#15803D',
    successBg: '#DCFCE7',
    warning: '#D97706',
    warningBg: '#FEF3C7',
    danger: '#DC2626',
    dangerBg: '#FEE2E2',
    info: '#0284C7',
    infoBg: '#E0F2FE',
  }
} as const;

export type ColorPalette = typeof palette;
