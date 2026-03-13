const toneClassMap = {
  neutral: "count-badge",
  info: "info-badge",
  success: "count-badge",
  warning: "count-badge",
  danger: "count-badge",
};

export default function StatusBadge({
  children,
  tone = "neutral",
  className = "",
}) {
  const classes = [toneClassMap[tone] || "count-badge", className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children || "—"}</span>;
}