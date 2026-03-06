import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { listSources } from "../data/lookups";
import {
  listPurchaseProducts,
  createPurchaseWithItems,
} from "../data/purchases";

function emptyItem() {
  return {
    product_id: "",
    quantity: "1",
    unit_cost: "0",
  };
}

export default function Purchases() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState([]);
  const [sources, setSources] = useState([]);

  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [sourceId, setSourceId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [productRows, sourceRows] = await Promise.all([
          listPurchaseProducts(),
          listSources(),
        ]);
        setProducts(productRows || []);
        setSources(sourceRows || []);
      } catch (e) {
        alert(e?.message || "Failed to load purchase form.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateItem(index, patch) {
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function addLine() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeLine(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalCost = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = parseInt(row.quantity, 10);
      const cost = Number(row.unit_cost);
      if (Number.isNaN(qty) || Number.isNaN(cost)) return sum;
      return sum + qty * cost;
    }, 0);
  }, [items]);

  function resetForm() {
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setSourceId("");
    setSellerName("");
    setNotes("");
    setItems([emptyItem()]);
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    const validItems = items.filter((x) => x.product_id);
    if (validItems.length === 0) {
      alert("Add at least one product line.");
      return;
    }

    try {
      setSaving(true);

      await createPurchaseWithItems(user.id, {
        purchase_date: purchaseDate,
        source_id: sourceId || null,
        seller_name: sellerName,
        notes,
        items,
      });

      resetForm();
      alert("Purchase saved.");
    } catch (e) {
      alert(e?.message || "Failed to save purchase.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div>Loading purchase form...</div>;
  }

  return (
    <div>
      <h2>Purchase Entry</h2>

      <form onSubmit={onSubmit}>
        <div
          style={{
            display: "grid",
            gap: 8,
            gridTemplateColumns: "repeat(3, 1fr)",
            alignItems: "end",
            marginBottom: 16,
          }}
        >
          <div>
            <label>Purchase Date</label>
            <input
              type="date"
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label>Source</label>
            <select
              value={sourceId}
              onChange={(e) => setSourceId(e.target.value)}
              style={{ width: "100%" }}
            >
              <option value="">(none)</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Seller Name</label>
            <input
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
              style={{ width: "100%" }}
              placeholder="optional"
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
        </div>

        <h4>Items</h4>

        <table
          width="100%"
          cellPadding="8"
          style={{ borderCollapse: "collapse", marginBottom: 12 }}
        >
          <thead>
            <tr>
              <th align="left">Product</th>
              <th align="right">Current Qty</th>
              <th align="right">Quantity</th>
              <th align="right">Unit Cost</th>
              <th align="right">Line Total</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((row, index) => {
              const selected = products.find((p) => p.id === row.product_id);
              const qty = parseInt(row.quantity, 10) || 0;
              const unitCost = Number(row.unit_cost || 0);
              const lineTotal = qty * unitCost;

              return (
                <tr key={index} style={{ borderTop: "1px solid #ddd" }}>
                  <td>
                    <select
                      value={row.product_id}
                      onChange={(e) => {
                        const productId = e.target.value;
                        const selectedProduct = products.find(
                          (p) => p.id === productId,
                        );

                        updateItem(index, {
                          product_id: productId,
                          unit_cost:
                            selectedProduct && selectedProduct.cost != null
                              ? String(selectedProduct.cost)
                              : "0",
                        });
                      }}
                      style={{ width: "100%" }}
                    >
                      <option value="">(select product)</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.device_label || p.description}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td align="right">{selected?.qty_on_hand ?? 0}</td>
                  <td align="right">
                    <input
                      value={row.quantity}
                      onChange={(e) =>
                        updateItem(index, { quantity: e.target.value })
                      }
                      style={{ width: 80, textAlign: "right" }}
                    />
                  </td>
                  <td align="right">
                    <input
                      value={row.unit_cost}
                      onChange={(e) =>
                        updateItem(index, { unit_cost: e.target.value })
                      }
                      style={{ width: 100, textAlign: "right" }}
                    />
                  </td>
                  <td align="right">{lineTotal.toFixed(2)}</td>
                  <td align="right">
                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      disabled={items.length === 1}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button type="button" onClick={addLine}>
            Add Line
          </button>

          <div style={{ fontWeight: "bold" }}>
            Total Cost: {totalCost.toFixed(2)}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 16,
          }}
        >
          <button type="button" onClick={resetForm}>
            Clear
          </button>
          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}
