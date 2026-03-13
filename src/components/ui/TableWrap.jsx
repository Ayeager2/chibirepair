export default function TableWrap({ children, className = "" }) {
  const classes = ["table-wrap", className].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}