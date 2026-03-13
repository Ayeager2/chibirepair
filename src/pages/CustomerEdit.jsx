import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/customer-edit.css";

import PageHeader from "@/components/ui/PageHeader";

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
      <div className="page">
        <div className="loading-card">Loading customer...</div>
      </div>
    );
  }

  let buttonText;

  if (saving) {
    buttonText = "Saving...";
  } else if (isEditMode) {
    buttonText = "Save Changes";
  } else {
    buttonText = "Create Customer";
  }

  return (
    <div className="page">
      <PageHeader
        title={pageTitle}
        subtitle={
          isEditMode
            ? "Update customer details"
            : "Create a customer record for future invoices and repair history"
        }
        actions={
          <Link to="/customers" className="button-secondary">
            Back to Customers
          </Link>
        }
      />

      {error && (
        <div className="customer-edit-error">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Customer Details</h3>
            <p className="card-subtitle">
              Basic contact information and mailing details.
            </p>
          </div>

          <div className="form-grid-2">
            <div className="field-full">
              <label htmlFor="customer-name" className="label">Name *</label>
              <input
                id="customer-name"
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="customer-phone" className="label">Phone</label>
              <input
                id="customer-phone"
                type="text"
                className="input"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-email" className="label">Email</label>
              <input
                id="customer-email"
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>

            <div className="field-full">
              <label htmlFor="customer-address-line1" className="label">Address Line 1</label>
              <input
                id="customer-address-line1"
                type="text"
                className="input"
                value={form.address_line1}
                onChange={(e) => handleChange("address_line1", e.target.value)}
              />
            </div>

            <div className="field-full">
              <label htmlFor="customer-address-line2" className="label">Address Line 2</label>
              <input
                id="customer-address-line2"
                type="text"
                className="input"
                value={form.address_line2}
                onChange={(e) => handleChange("address_line2", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-city" className="label">City</label>
              <input
                id="customer-city"
                type="text"
                className="input"
                value={form.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-state" className="label">State</label>
              <input
                id="customer-state"
                type="text"
                className="input"
                value={form.state}
                onChange={(e) => handleChange("state", e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="customer-postal-code" className="label">Postal Code</label>
              <input
                id="customer-postal-code"
                type="text"
                className="input"
                value={form.postal_code}
                onChange={(e) => handleChange("postal_code", e.target.value)}
              />
            </div>

            <div className="field-full">
              <label htmlFor="customer-notes" className="label">Notes</label>
              <textarea
                id="customer-notes"
                className="textarea"
                rows={4}
                value={form.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <div className="field-full">
              <label className="customer-edit-checkbox">
                <input
                  id="customer-active"
                  type="checkbox"
                  checked={!!form.active}
                  onChange={(e) => handleChange("active", e.target.checked)}
                />
                <span>Active customer</span>
              </label>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="button-primary" disabled={saving}>
                {buttonText}
          </button>

          <Link to="/customers" className="button-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
