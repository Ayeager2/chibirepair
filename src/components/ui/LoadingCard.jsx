export default function LoadingCard({
  children = "Loading...",
  className = "",
}) {
  const classes = ["loading-card", className].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}