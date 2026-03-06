import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listCustomers, setCustomerActive } from "../data/customers";
import { useAuth } from "../auth/useAuth";

export default function Customers() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const ownerId = user?.id;

  useEffect(() => {
    if (!ownerId) return;

    let ignore = false;

    async function loadCustomers() {
      try {
        setLoading(true);
        setError("");

        const rows = await listCustomers({
          ownerId,
          search,
          activeOnly,
        });

        if (!ignore) {
          setCustomers(rows);
        }
      } catch (err) {
        console.error("Failed to load customers:", err);
        if (!ignore) {
          setError(err.message || "Failed to load customers.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      ignore = true;
    };
  }, [ownerId, search, activeOnly]);

  const customerCountLabel = useMemo(() => {
    if (loading) return "Loading...";
    return `${customers.length} customer${customers.length === 1 ? "" : "s"}`;
  }, [customers, loading]);

  async function handleToggleActive(customer) {
    if (!ownerId) return;

    const nextActive = !customer.active;
    const confirmMessage = nextActive
      ? `Reactivate "${customer.name}"?`
      : `Deactivate "${customer.name}"?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setBusyId(customer.id);
      await setCustomerActive(customer.id, ownerId, nextActive);

      setCustomers((prev) =>
        prev.map((row) =>
          row.id === customer.id ? { ...row, active: nextActive } : row,
        ),
      );
    } catch (err) {
      console.error("Failed to update customer active state:", err);
      window.alert(err.message || "Failed to update customer.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">Customers</h2>
          <div className="text-muted">{customerCountLabel}</div>
        </div>

        <div className="d-flex gap-2">
          <Link to="/customers/new" className="btn btn-primary">
            Add Customer
          </Link>
        </div>
      </div>

      <div className="card shadow-sm">
        <div className="card-body">
          <div className="row g-3 align-items-end mb-3">
            <div className="col-12 col-md-8">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, phone, email, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-12 col-md-4">
              <div className="form-check mt-md-4 pt-md-2">
                <input
                  id="customers-active-only"
                  type="checkbox"
                  className="form-check-input"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                <label
                  htmlFor="customers-active-only"
                  className="form-check-label"
                >
                  Show active only
                </label>
              </div>
            </div>
          </div>

          {error ? (
            <div className="alert alert-danger mb-3">{error}</div>
          ) : null}

          {loading ? (
            <div className="py-4 text-center text-muted">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="py-4 text-center text-muted">
              No customers found.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>Email</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th style={{ width: "220px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const location = [customer.city, customer.state]
                      .filter(Boolean)
                      .join(", ");

                    return (
                      <tr key={customer.id}>
                        <td>
                          <div className="fw-semibold">{customer.name}</div>
                          {customer.address_line1 ? (
                            <div className="small text-muted">
                              {customer.address_line1}
                            </div>
                          ) : null}
                        </td>

                        <td>
                          {customer.phone || (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td>
                          {customer.email || (
                            <span className="text-muted">—</span>
                          )}
                        </td>

                        <td>
                          {location || <span className="text-muted">—</span>}
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              customer.active
                                ? "bg-success-subtle text-success"
                                : "bg-secondary-subtle text-secondary"
                            }`}
                          >
                            {customer.active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="d-flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                navigate(`/customers/${customer.id}`)
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={`btn btn-sm ${
                                customer.active
                                  ? "btn-outline-warning"
                                  : "btn-outline-success"
                              }`}
                              disabled={busyId === customer.id}
                              onClick={() => handleToggleActive(customer)}
                            >
                              {busyId === customer.id
                                ? "Saving..."
                                : customer.active
                                  ? "Deactivate"
                                  : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
