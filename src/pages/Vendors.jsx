import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import "../styles/vendors.css";
import LoadingCard from "@/components/ui/LoadingCard";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import FieldError from "@/components/ui/FieldError";

import { useAuth } from "../auth/useAuth";
import { listVendors, createVendor, updateVendor, deleteVendor } from "../data/vendors";
import Tooltip from "../components/Tooltip";

const defaultValues = {
  name: "",
  phone: "",
  email: "",
  website: "",
  notes: "",
};

export default function Vendors() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  const editingRow = useMemo(() => rows.find((r) => r.id === editingId) || null, [rows, editingId]);

  const vendorStats = useMemo(() => {
    const total = rows.length;
    const withPhone = rows.filter((r) => (r.phone || "").trim()).length;
    const withEmail = rows.filter((r) => (r.email || "").trim()).length;
    const withNotes = rows.filter((r) => (r.notes || "").trim()).length;

    return {
      total,
      withPhone,
      withEmail,
      withNotes,
    };
  }, [rows]);

  async function load() {
    setLoading(true);
    try {
      const data = await listVendors();
      setRows(data || []);
    } catch (e) {
      alert(e?.message || "Failed to load vendors.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setEditingId(null);
    reset(defaultValues);
  }

  function startEdit(row) {
    setEditingId(row.id);
    reset({
      name: row.name || "",
      phone: row.phone || "",
      email: row.email || "",
      website: row.website || "",
      notes: row.notes || "",
    });
  }

  async function onSubmit(values) {
    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        website: values.website.trim(),
        notes: values.notes.trim(),
      };

      if (editingId) {
        await updateVendor(editingId, payload);
      } else {
        await createVendor(user.id, payload);
      }

      resetForm();
      await load();
    } catch (e) {
      alert(e?.message || "Failed to save vendor.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    const ok = confirm("Delete this vendor?");
    if (!ok) return;

    try {
      await deleteVendor(id);
      if (editingId === id) resetForm();
      await load();
    } catch (e) {
      alert(e?.message || "Failed to delete vendor.");
    }
  }

  function InfoPill({ children }) {
    return <span className="vendors-info-pill">{children}</span>;
  }

  function normalizeWebsite(url) {
    const value = (url || "").trim();
    if (!value) return "";
    if (value.startsWith("http://") || value.startsWith("https://")) {
      return value;
    }
    return `https://${value}`;
  }

  let buttonLabel;

  if (saving) {
    buttonLabel = "Saving...";
  } else if (editingId) {
    buttonLabel = "Save Vendor";
  } else {
    buttonLabel = "Add Vendor";
  }

  let vendorsContent;

  if (loading) {
    vendorsContent = <LoadingCard message="Loading vendors..." />;
  } else if (rows.length === 0) {
    vendorsContent = (
      <EmptyState
        title="No vendors yet"
        message="Add a vendor to keep track of suppliers, parts contacts, and sourcing notes."
      />
    );
  } else {
    vendorsContent = (
      <div className="vendors-list">
        {rows.map((r) => {
          const isEditing = editingId === r.id;

          return (
            <div key={r.id} className={`vendors-row ${isEditing ? "vendors-row-editing" : ""}`}>
              <div className="vendors-main">
                <div className="vendors-name-row">
                  {r.website ? (
                    <Tooltip text={r.website}>
                      <a
                        href={normalizeWebsite(r.website)}
                        target="_blank"
                        rel="noreferrer"
                        className="vendors-name vendors-name-link"
                      >
                        {r.name}
                      </a>
                    </Tooltip>
                  ) : (
                    <div className="vendors-name">{r.name}</div>
                  )}

                  {isEditing ? <InfoPill>Currently Editing</InfoPill> : null}
                </div>

                <div className="vendors-meta">
                  <div className="vendors-meta-block">
                    <span className="vendors-meta-label">Phone</span>
                    <span className="vendors-meta-value">{r.phone || "—"}</span>
                  </div>

                  <div className="vendors-meta-block">
                    <span className="vendors-meta-label">Email</span>
                    <span className="vendors-meta-value">{r.email || "—"}</span>
                  </div>
                </div>

                <div className="vendors-notes-box">
                  <div className="vendors-notes-label">Notes</div>
                  <div className="vendors-notes-text">{r.notes || "No notes."}</div>
                </div>
              </div>

              <div className="vendors-actions">
                <button type="button" onClick={() => startEdit(r)} className="vendors-edit-button">
                  Edit
                </button>
                <button type="button" onClick={() => onDelete(r.id)} className="button-danger">
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Vendors"
        subtitle="Keep track of suppliers, parts contacts, and purchase sources."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Vendors</div>
          <div className="stat-value">{vendorStats.total}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">With Phone</div>
          <div className="stat-value">{vendorStats.withPhone}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">With Email</div>
          <div className="stat-value">{vendorStats.withEmail}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">With Notes</div>
          <div className="stat-value">{vendorStats.withNotes}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">{editingId ? "Edit Vendor" : "Add Vendor"}</h3>
            <p className="card-subtitle">
              Store vendor contact details and notes for sourcing parts and supplies.
            </p>
          </div>

          {editingId ? (
            <div className="info-badge">
              Editing: <strong>{editingRow?.name || "Vendor"}</strong>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="section-title">Contact Details</div>

          <div className="form-grid-2">
            <div className="field-full">
              <label htmlFor="vendor-name" className="label">
                Vendor Name
              </label>
              <input
                id="vendor-name"
                {...register("name", {
                  required: "Vendor name is required.",
                  validate: (value) => value.trim() !== "" || "Vendor name is required.",
                })}
                className="input"
                placeholder="Example: iFixit, eBay Seller, Local Parts Shop"
              />
              <FieldError error={errors.name?.message} />
            </div>

            <div>
              <label htmlFor="vendor-phone" className="label">
                Phone
              </label>
              <input
                id="vendor-phone"
                {...register("phone")}
                className="input"
                placeholder="Optional phone number"
              />
            </div>

            <div>
              <label htmlFor="vendor-email" className="label">
                Email
              </label>
              <input
                id="vendor-email"
                {...register("email", {
                  validate: (value) => {
                    const v = (value || "").trim();
                    if (!v) return true;
                    return (
                      (/^[^\s@]+@[^\s@]+$/.test(v) && v.includes(".")) ||
                      "Enter a valid email address."
                    );
                  },
                })}
                className="input"
                placeholder="Optional email address"
              />

              <FieldError error={errors.email?.message} />
            </div>

            <div className="field-full">
              <label htmlFor="vendor-website" className="label">
                Website
              </label>
              <input
                id="vendor-website"
                {...register("website", {
                  validate: (value) => {
                    const v = (value || "").trim();
                    if (!v) return true;

                    try {
                      new URL(normalizeWebsite(v));
                      return true;
                    } catch {
                      return "Enter a valid website.";
                    }
                  },
                })}
                className="input"
                placeholder="Optional website, e.g. https://www.ifixit.com"
              />
              <FieldError error={errors.website?.message} />
            </div>

            <div className="field-full">
              <label htmlFor="vendor-notes" className="label">
                Notes
              </label>
              <textarea
                id="vendor-notes"
                {...register("notes")}
                rows={4}
                className="textarea"
                placeholder="Shipping speed, preferred contact, typical parts, warranty notes, pricing, account info, etc."
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={resetForm}
              className="button-secondary"
              disabled={saving}
            >
              {editingId ? "Cancel Edit" : "Clear"}
            </button>

            <button type="submit" className="button-primary" disabled={saving}>
              {buttonLabel}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Vendor List</h3>
            <p className="card-subtitle">Review, update, and remove vendor records.</p>
          </div>

          <div className="count-badge">
            {rows.length} vendor{rows.length === 1 ? "" : "s"}
          </div>
        </div>

        {vendorsContent}
      </div>
    </div>
  );
}
