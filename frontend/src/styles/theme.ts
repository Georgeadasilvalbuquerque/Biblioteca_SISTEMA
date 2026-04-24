export const theme = {
  colors: {
    bg: "#f3f6fd",
    surface: "#ffffff",
    sidebar: "#0f1f4a",
    sidebarSoft: "#1e2d61",
    primary: "#4f7cff",
    primarySoft: "#e8efff",
    text: "#1d2a46",
    textMuted: "#6f7c9b",
    success: "#26c281",
    warning: "#f2b94b",
    danger: "#ef5b67",
    border: "#e5eaf5",
  },
  radius: {
    sm: "10px",
    md: "14px",
    lg: "18px",
  },
  shadow: {
    card: "0 8px 24px rgba(27, 53, 98, 0.08)",
  },
  breakpoints: {
    lg: "1200px",
    md: "900px",
    sm: "640px",
  },
};

export type AppTheme = typeof theme;
