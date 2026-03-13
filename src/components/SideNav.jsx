import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

export default function SideNav({
  themeSwitcher = null,
  logoutButton = null,
  id = "appOffcanvas",
}) {
  const location = useLocation();

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;

    const bs = window?.bootstrap;
    if (!bs) return;

    const inst = bs.Offcanvas.getInstance(el);
    inst?.hide?.();
  }, [location.pathname, id]);

  function isActive(path, startsWith = false) {
    if (startsWith) {
      return (
        location.pathname === path ||
        location.pathname.startsWith(`${path}/`)
      );
    }

    return location.pathname === path;
  }

  return (
    <div
      className="offcanvas offcanvas-start app-side-nav"
      tabIndex="-1"
      id={id}
      aria-labelledby={`${id}Label`}
    >
      <div className="offcanvas-header app-side-nav-header">
        <h5 className="offcanvas-title app-side-nav-title" id={`${id}Label`}>
          Menu
        </h5>

        <button
          type="button"
          className="btn-close"
          data-bs-dismiss="offcanvas"
          aria-label="Close"
        />
      </div>

      <div className="offcanvas-body app-side-nav-body">
        <div className="list-group app-side-nav-links">
          <Link
            className={`list-group-item list-group-item-action ${isActive("/") ? "active" : ""}`}
            to="/"
          >
            Home
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/inventory") ? "active" : ""}`}
            to="/inventory"
          >
            Inventory
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/catalog") ? "active" : ""}`}
            to="/catalog"
          >
            Catalog Manager
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/vendors") ? "active" : ""}`}
            to="/vendors"
          >
            Vendors
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/customers", true) ? "active" : ""}`}
            to="/customers"
          >
            Customers
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/purchases") ? "active" : ""}`}
            to="/purchases"
          >
            Purchase Entry
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/purchase-history") ? "active" : ""}`}
            to="/purchase-history"
          >
            Purchase History
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/invoices") ? "active" : ""}`}
            to="/invoices"
          >
            Invoices
          </Link>

          <Link
            className={`list-group-item list-group-item-action ${isActive("/invoice-history") ? "active" : ""}`}
            to="/invoice-history"
          >
            Invoice History
          </Link>
        </div>

        <hr className="app-side-nav-divider" />

        {themeSwitcher ? (
          <div className="app-side-nav-section">{themeSwitcher}</div>
        ) : null}

        {logoutButton ? (
          <div className="app-side-nav-section">{logoutButton}</div>
        ) : null}

        <div className="app-side-nav-tip">
          Tip: manage Categories / Subcategories / Models / Variants here.
        </div>
      </div>
    </div>
  );
}