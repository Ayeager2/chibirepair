export default function PageHeader({
  title,
  subtitle,
  actions = null,
  className = "",
}) {
  const classes = ["page-header", className].filter(Boolean).join(" ");

  return (
    <div className={classes}>
      {actions ? (
        <div className="card-header-row">
          <div>
            <h2 className="page-title">{title}</h2>
            {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
          </div>

          <div>{actions}</div>
        </div>
      ) : (
        <div>
          <h2 className="page-title">{title}</h2>
          {subtitle ? <p className="page-subtitle">{subtitle}</p> : null}
        </div>
      )}
    </div>
  );
}