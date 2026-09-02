/** Admin design tokens — mobile-first dark theme */
export const adminColors = {
  bg: '#0a0c10',
  surface: '#141820',
  surface2: '#1c2230',
  surface3: '#252d3d',
  border: 'rgba(255,255,255,0.1)',
  text: '#f5f5f7',
  muted: '#9aa3b5',
  accent: '#d4b05a',
  accentHover: '#c9a84c',
  accentText: '#0a0c10',
  success: '#34d399',
  error: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
} as const;

export const STATUS_COLORS: Record<string, string> = {
  pending: '#9aa3b5',
  confirmed: '#60a5fa',
  processing: '#a78bfa',
  shipped: '#fbbf24',
  delivered: '#34d399',
  cancelled: '#f87171',
  paid: '#34d399',
  failed: '#f87171',
  active: '#34d399',
  draft: '#9aa3b5',
};
