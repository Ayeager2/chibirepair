export default function EmptyState({ children, className = "" }) {
  const classes = ["empty-state", className].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}