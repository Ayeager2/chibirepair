import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  listVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} from "../data/vendors";

export default function Vendors() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingId, setEditingId] = useState(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  const editingRow = useMemo(
    () => rows.find((r) => r.id === editingId) || null,
    [rows, editingId],
  );

  async function load() {
    setLoading(true);
    try {
      const data = await listVendors();
      setRows(data);
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
    setName("");
    setPhone("");
    setEmail("");
    setNotes("");
  }

  function startEdit(row) {
    setEditingId(row.id);
    setName(row.name || "");
    setPhone(row.phone || "");
    setEmail(row.email || "");
    setNotes(row.notes || "");
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!user?.id) return alert("Not logged in.");
    if (!name.trim()) return alert("Vendor name is required.");

    try {
      if (editingId) {
        await updateVendor(editingId, { name, phone, email, notes });
      } else {
        await createVendor(user.id, { name, phone, email, notes });
      }
      resetForm();
      await load();
    } catch (e) {
      alert(e?.message || "Failed to save vendor.");
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

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 12 }}>
      <h2>Vendors</h2>

      <form
        onSubmit={onSubmit}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(2, 1fr)",
          alignItems: "end",
        }}
      >
        <div style={{ gridColumn: "1 / -1" }}>
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%" }}
            required
          />
        </div>

        <div>
          <label>Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ gridColumn: "1 / -1" }}>
          <label>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ width: "100%" }}
          />
        </div>

        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          {editingId ? (
            <div style={{ marginRight: "auto", fontSize: 12, opacity: 0.75 }}>
              Editing: <b>{editingRow?.name}</b>
            </div>
          ) : null}

          <button type="button" onClick={resetForm}>
            Clear
          </button>
          <button type="submit">
            {editingId ? "Save Vendor" : "Add Vendor"}
          </button>
        </div>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? (
        <div>Loading...</div>
      ) : rows.length === 0 ? (
        <div>No vendors yet.</div>
      ) : (
        <table
          width="100%"
          cellPadding="8"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th align="left">Name</th>
              <th align="left">Phone</th>
              <th align="left">Email</th>
              <th align="left">Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.name}</td>
                <td>{r.phone || ""}</td>
                <td>{r.email || ""}</td>
                <td>{r.notes || ""}</td>
                <td align="right" style={{ whiteSpace: "nowrap" }}>
                  <button
                    onClick={() => startEdit(r)}
                    style={{ marginRight: 8 }}
                  >
                    Edit
                  </button>
                  <button onClick={() => onDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
