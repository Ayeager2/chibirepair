import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import "../styles/customers.css";
import PageHeader from "@/components/ui/PageHeader";
import LoadingCard from "@/components/ui/LoadingCard";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import TableWrap from "@/components/ui/TableWrap";

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
        prev.map((row) => (row.id === customer.id ? { ...row, active: nextActive } : row))
      );
    } catch (err) {
      console.error("Failed to update customer active state:", err);
      window.alert(err.message || "Failed to update customer.");
    } finally {
      setBusyId(null);
    }
  }

  let customersContent;

  if (loading) {
    customersContent = <LoadingCard message="Loading customers..." />;
  } else if (customers.length === 0) {
    customersContent = (
      <EmptyState
        title="No customers found"
        message="Try changing your search or create a new customer."
      />
    );
  } else {
    customersContent = (
      <TableWrap>
        <table className="app-table customers-table">
          <thead>
            <tr>
              <th className="th-left">Customer</th>
              <th className="th-left">Phone</th>
              <th className="th-left">Email</th>
              <th className="th-left">Location</th>
              <th className="th-left">Status</th>
              <th className="th-right customers-actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => {
              const location = [customer.city, customer.state].filter(Boolean).join(", ");

              const toggleButtonClass = customer.active
                ? "customer-toggle-button customer-toggle-warning"
                : "customer-toggle-button customer-toggle-success";

              let toggleButtonText;

              if (busyId === customer.id) {
                toggleButtonText = "Saving...";
              } else if (customer.active) {
                toggleButtonText = "Deactivate";
              } else {
                toggleButtonText = "Reactivate";
              }

              return (
                <tr key={customer.id} className="tr">
                  <td className="td-left">
                    <div className="customers-name">{customer.name}</div>
                    {customer.address_line1 ? (
                      <div className="small-muted">{customer.address_line1}</div>
                    ) : null}
                  </td>

                  <td className="td-left">
                    {customer.phone || <span className="muted-text">—</span>}
                  </td>

                  <td className="td-left">
                    {customer.email || <span className="muted-text">—</span>}
                  </td>

                  <td className="td-left">{location || <span className="muted-text">—</span>}</td>

                  <td className="td-left">
                    <StatusBadge variant={customer.active ? "success" : "neutral"}>
                      {customer.active ? "Active" : "Inactive"}
                    </StatusBadge>
                  </td>

                  <td className="td-right">
                    <div className="action-row customers-actions">
                      <button
                        type="button"
                        className="button-secondary"
                        onClick={() => navigate(`/customers/${customer.id}`)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className={toggleButtonClass}
                        disabled={busyId === customer.id}
                        onClick={() => handleToggleActive(customer)}
                      >
                        {toggleButtonText}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableWrap>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Customers"
        subtitle={customerCountLabel}
        actions={
          <Link to="/customers/new" className="button-primary">
            Add Customer
          </Link>
        }
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Customers</div>
          <div className="stat-value">{loading ? "—" : customers.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Search</div>
          <div className="stat-value-small">{search.trim() ? search : "No filter"}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Mode</div>
          <div className="stat-value-small">{activeOnly ? "Active Only" : "All Customers"}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Customer Directory</h3>
          <p className="card-subtitle">
            Search, review, edit, and activate or deactivate customer records.
          </p>
        </div>

        <div className="form-grid-2 customer-filters">
          <div>
            <label htmlFor="customers-search" className="label">
              Search
            </label>
            <input
              id="customers-search"
              type="text"
              className="input"
              placeholder="Search by name, phone, email, city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="customer-filter-checkbox-wrap">
            <div>
              <label htmlFor="customers-active-only" className="label">
                Filter
              </label>
              <label className="customer-checkbox">
                <input
                  id="customers-active-only"
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                />
                <span>Show active only</span>
              </label>
            </div>
          </div>
        </div>

        {error ? <div className="customer-error">{error}</div> : null}

        {customersContent}
      </div>
    </div>
  );
}
