import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function AppNav({ title = "Chibi Repair", rightSlot = null }) {
  const location = useLocation();

  // close offcanvas when route changes (nice UX)
  useEffect(() => {
    const el = document.getElementById("appOffcanvas");
    if (!el) return;

    // If bootstrap JS is present, hide it
    const bs = window?.bootstrap;
    if (!bs) return;

    const inst = bs.Offcanvas.getInstance(el);
    inst?.hide?.();
  }, [location.pathname]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          className="btn btn-outline-secondary"
          data-bs-toggle="offcanvas"
          data-bs-target="#appOffcanvas"
          aria-controls="appOffcanvas"
          title="Menu"
        >
          ☰
        </button>
        <h2 style={{ margin: 0 }}>{title}</h2>
      </div>

  {rightSlot ? <div>{rightSlot}</div> : null}

      <div
        className="offcanvas offcanvas-start"
        tabIndex="-1"
        id="appOffcanvas"
        aria-labelledby="appOffcanvasLabel"
      >
        <div className="offcanvas-header">
          <h5 className="offcanvas-title" id="appOffcanvasLabel">
            Menu
          </h5>
          <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
        </div>

        <div className="offcanvas-body">
          <div className="list-group">
           <Link
              className={`list-group-item list-group-item-action ${location.pathname === "/" ? "active" : ""}`}
              to="/"
            >
              Home
            </Link>

            <Link
              className={`list-group-item list-group-item-action ${location.pathname === "/inventory" ? "active" : ""}`}
              to="/inventory"
            >
              Inventory
            </Link>

            <Link
              className={`list-group-item list-group-item-action ${location.pathname === "/catalog" ? "active" : ""}`}
              to="/catalog"
            >
              Catalog Manager
            </Link>
          </div>

          <hr />

          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Tip: manage Categories / Subcategories / Models / Variants here.
          </div>
        </div>
      </div>
    </div>
  );
}