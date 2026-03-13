export default function TopNav({
  title = "Chibi Repair",
  rightSlot = null,
  offcanvasTarget = "#appOffcanvas",
}) {
  return (
    <div className="top-nav">
      <div className="top-nav-left">
        <button
          type="button"
          className="button-secondary top-nav-menu-button"
          data-bs-toggle="offcanvas"
          data-bs-target={offcanvasTarget}
          aria-controls={offcanvasTarget.replace("#", "")}
          title="Menu"
        >
          ☰
        </button>

        <h2 className="top-nav-title">{title}</h2>
      </div>

      {rightSlot ? <div className="top-nav-right">{rightSlot}</div> : null}
    </div>
  );
}