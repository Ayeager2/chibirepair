import { useEffect, useRef, useState } from "react";

import { searchCustomersForSelect } from "../../data/customers";
import { useAuth } from "../../auth/useAuth";

export default function CustomerSelect({
  value,
  onChange,
  selectedCustomer = null,
  placeholder = "Search customer by name, phone, or email...",
}) {
  const { user } = useAuth();
  const ownerId = user?.id;

  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const wrapRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!ownerId || !open) return;

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const rows = await searchCustomersForSelect({
          ownerId,
          search,
          limit: 10,
          activeOnly: true,
        });

        if (!ignore) {
          setResults(rows);
        }
      } catch (err) {
        console.error("Failed to search customers:", err);
        if (!ignore) {
          setResults([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ownerId, search, open]);

  function formatCustomerLine(customer) {
    const parts = [
      customer.phone,
      customer.email,
      [customer.city, customer.state].filter(Boolean).join(", "),
    ].filter(Boolean);

    return parts.join(" • ");
  }

  function handleSelect(customer) {
    onChange?.(customer);
    setSearch("");
    setOpen(false);
  }

  function clearSelection() {
    onChange?.(null);
    setSearch("");
    setResults([]);
    setOpen(false);
  }

  let resultsContent;

  if (loading) {
    resultsContent = <div className="p-3 text-muted">Searching...</div>;
  } else if (results.length === 0) {
    resultsContent = <div className="p-3 text-muted">No customers found.</div>;
  } else {
    resultsContent = results.map((customer) => (
      <button
        key={customer.id}
        type="button"
        className="btn btn-link text-start text-decoration-none w-100 p-3 border-bottom"
        onClick={() => handleSelect(customer)}
      >
        <div className="fw-semibold text-dark">{customer.name}</div>
        <div className="small text-muted">
          {formatCustomerLine(customer) || "No extra contact info"}
        </div>
      </button>
    ));
  }

  return (
    <div className="position-relative" ref={wrapRef}>
      {selectedCustomer ? (
        <div className="border rounded p-3 bg-body-tertiary">
          <div className="d-flex justify-content-between align-items-start gap-2">
            <div>
              <div className="fw-semibold">{selectedCustomer.name}</div>
              <div className="small text-muted">
                {formatCustomerLine(selectedCustomer) ||
                  "No extra contact info"}
              </div>
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={clearSelection}
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <>
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={search}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
          />

          {open ? (
            <div
              className="position-absolute start-0 end-0 mt-1 border rounded bg-white shadow-sm"
              style={{ zIndex: 1050, maxHeight: 280, overflowY: "auto" }}
            >
              {resultsContent}
            </div>
          ) : null}
        </>
      )}

      <input type="hidden" value={value || ""} readOnly />
    </div>
  );
}
