import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';

export const theme = { colors, typography, spacing, radius };

export const themeVariables = {
  '--background': colors.background,
  '--foreground': colors.textPrimary,
  '--card': colors.surface,
  '--card-foreground': colors.textPrimary,
  '--popover': colors.surface,
  '--popover-foreground': colors.textPrimary,
  '--primary': colors.primary,
  '--primary-dark': colors.darkPrimary,
  '--primary-light': colors.lightPrimary,
  '--primary-hover': colors.hoverPrimary,
  '--primary-muted': colors.primaryMuted,
  '--primary-border': colors.primaryBorder,
  '--primary-highlight': colors.primaryHighlight,
  '--primary-foreground': colors.onPrimary,
  '--border': colors.border,
  '--input': colors.border,
  '--ring': colors.primary,
  '--accent': colors.primaryMuted,
  '--accent-foreground': colors.darkPrimary,
  '--muted-foreground': colors.textSecondary,
  '--destructive': colors.danger,
  '--sidebar': colors.sidebarDark,
  '--sidebar-foreground': colors.sidebarText,
  '--sidebar-secondary': colors.sidebarSecondary,
  '--sidebar-muted': colors.sidebarMuted,
  '--sidebar-primary': colors.primary,
  '--sidebar-primary-foreground': colors.onPrimary,
  '--sidebar-accent': colors.sidebarSecondary,
  '--sidebar-accent-foreground': colors.surface,
  '--sidebar-border': colors.sidebarSecondary,
  '--sidebar-ring': colors.primary,
  '--radius': radius.lg,
  ...Object.fromEntries(Object.entries(spacing).map(([k, v]) => [`--space-${k}`, v])),
  ...Object.fromEntries(Object.entries(typography.sizes).map(([k, v]) => [`--type-${k}`, v])),
  ...Object.fromEntries(Object.entries(radius).map(([k, v]) => [`--corner-${k}`, v])),
};
