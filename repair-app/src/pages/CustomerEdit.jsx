import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  createCustomer,
  emptyCustomer,
  getCustomerById,
  normalizeCustomerPayload,
  updateCustomer,
} from "../data/customers";
import { useAuth } from "../auth/useAuth";

export default function CustomerEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();

  const ownerId = user?.id;
  const isEditMode = !!id;

  const [form, setForm] = useState(emptyCustomer());
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const pageTitle = useMemo(() => {
    return isEditMode ? "Edit Customer" : "New Customer";
  }, [isEditMode]);

  useEffect(() => {
    if (!isEditMode || !ownerId) return;

    let ignore = false;

    async function loadCustomer() {
      try {
        setLoading(true);
        setError("");

        const row = await getCustomerById(id, ownerId);

        if (!ignore) {
          setForm({
            name: row.name || "",
            phone: row.phone || "",
            email: row.email || "",
            address_line1: row.address_line1 || "",
            address_line2: row.address_line2 || "",
            city: row.city || "",
            state: row.state || "",
            postal_code: row.postal_code || "",
            notes: row.notes || "",
            active: row.active ?? true,
          });
        }
      } catch (err) {
        console.error("Failed to load customer:", err);
        if (!ignore) {
          setError(err.message || "Failed to load customer.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadCustomer();

    return () => {
      ignore = true;
    };
  }, [id, isEditMode, ownerId]);

  function handleChange(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.name.trim()) {
      return "Customer name is required.";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!ownerId) {
      window.alert("You must be signed in.");
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      window.alert(validationError);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const payload = normalizeCustomerPayload(form, ownerId);

      if (isEditMode) {
        await updateCustomer(id, ownerId, payload);
      } else {
        await createCustomer(payload);
      }

      navigate("/customers");
    } catch (err) {
      console.error("Failed to save customer:", err);
      setError(err.message || "Failed to save customer.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="container py-4">
        <div className="text-muted">Loading customer...</div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h2 className="mb-1">{pageTitle}</h2>
          <div className="text-muted">
            {isEditMode
              ? "Update customer details"
              : "Create a customer record for future invoices and repair history"}
          </div>
        </div>

        <div>
          <Link to="/customers" className="btn btn-outline-secondary">
            Back to Customers
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card shadow-sm mb-4">
          <div className="card-body">
            {error ? <div className="alert alert-danger">{error}</div> : null}

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label">Name *</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label">Phone</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-3">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Address Line 1</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.address_line1}
                  onChange={(e) =>
                    handleChange("address_line1", e.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-6">
                <label className="form-label">Address Line 2</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.address_line2}
                  onChange={(e) =>
                    handleChange("address_line2", e.target.value)
                  }
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">City</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">State</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.state}
                  onChange={(e) => handleChange("state", e.target.value)}
                />
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label">Postal Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={form.postal_code}
                  onChange={(e) => handleChange("postal_code", e.target.value)}
                />
              </div>

              <div className="col-12">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    id="customer-active"
                    type="checkbox"
                    className="form-check-input"
                    checked={!!form.active}
                    onChange={(e) => handleChange("active", e.target.checked)}
                  />
                  <label htmlFor="customer-active" className="form-check-label">
                    Active customer
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving
              ? "Saving..."
              : isEditMode
                ? "Save Changes"
                : "Create Customer"}
          </button>

          <Link to="/customers" className="btn btn-outline-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
