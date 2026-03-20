import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../auth/useAuth";
import { listSources, listVendors } from "../data/lookups";
import { listPurchaseInventory, createPurchaseWithItems } from "../data/purchases";

import "../styles/purchases.css";
import TableWrap from "@/components/ui/TableWrap";
import LoadingCard from "@/components/ui/LoadingCard";
import PageHeader from "@/components/ui/PageHeader";

function emptyItem() {
  return {
    inventory_item_id: "",
    description: "",
    quantity: "1",
    unit_cost: "0",
  };
}

function money(n) {
  return Number(n || 0).toFixed(2);
}

function itemDisplayLabel(item) {
  if (!item) return "";
  return item.device_label || item.description || item.sku || "Unnamed item";
}

export default function Purchases() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [inventoryItems, setInventoryItems] = useState([]);
  const [sources, setSources] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [sourceId, setSourceId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [shippingCost, setShippingCost] = useState("0");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([emptyItem()]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        const [inventoryRows, sourceRows, vendorRows] = await Promise.all([
          listPurchaseInventory(),
          listSources(),
          listVendors(),
        ]);

        setInventoryItems(inventoryRows || []);
        setSources(sourceRows || []);
        setVendors(vendorRows || []);
      } catch (e) {
        alert(e?.message || "Failed to load purchase form.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function updateItem(index, patch) {
    setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addLine() {
    setItems((prev) => [...prev, emptyItem()]);
  }

  function removeLine(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = parseInt(row.quantity, 10);
      const cost = Number(row.unit_cost);
      if (Number.isNaN(qty) || Number.isNaN(cost)) return sum;
      return sum + qty * cost;
    }, 0);
  }, [items]);

  const totalUnits = useMemo(() => {
    return items.reduce((sum, row) => {
      const qty = parseInt(row.quantity, 10);
      if (Number.isNaN(qty)) return sum;
      return sum + qty;
    }, 0);
  }, [items]);

  const shippingCostNum = Number(shippingCost || 0);
  const taxNum = Number(tax || 0);
  const totalCost =
    subtotal +
    (Number.isNaN(shippingCostNum) ? 0 : shippingCostNum) +
    (Number.isNaN(taxNum) ? 0 : taxNum);

  const selectedSourceName = useMemo(() => {
    return sources.find((s) => s.id === sourceId)?.name || "No source selected";
  }, [sources, sourceId]);

  const selectedVendorName = useMemo(() => {
    return vendors.find((v) => v.id === vendorId)?.name || "No vendor selected";
  }, [vendors, vendorId]);

  function resetForm() {
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setSourceId("");
    setVendorId("");
    setSellerName("");
    setShippingCost("0");
    setTax("0");
    setNotes("");
    setItems([emptyItem()]);
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    const cleanedItems = items
      .map((row) => {
        const selected = inventoryItems.find((p) => p.id === row.inventory_item_id);

        return {
          inventory_item_id: row.inventory_item_id || null,
          description: (row.description || "").trim() || selected?.description || "",
          quantity: row.quantity,
          unit_cost: row.unit_cost,
        };
      })
      .filter((x) => x.description);

    if (cleanedItems.length === 0) {
      alert("Add at least one valid purchase line.");
      return;
    }

    try {
      setSaving(true);

      await createPurchaseWithItems(user.id, {
        purchase_date: purchaseDate,
        source_id: sourceId || null,
        vendor_id: vendorId || null,
        seller_name: sellerName,
        shipping_cost: shippingCost,
        tax,
        notes,
        items: cleanedItems,
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
    return (
      <div className="page">
        <LoadingCard message="Loading purchase form..." />
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Purchase Entry"
        subtitle="Record incoming stock purchases, costs, and supplier details."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Lines</div>
          <div className="stat-value">{items.length}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Units</div>
          <div className="stat-value">{totalUnits}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Source</div>
          <div className="stat-value-small">{selectedSourceName}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Vendor</div>
          <div className="stat-value-small">{selectedVendorName}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Cost</div>
          <div className="stat-value">${money(totalCost)}</div>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Purchase Details</h3>
              <p className="card-subtitle">General info for this purchase record.</p>
            </div>
          </div>

          <div className="form-grid">
            <div>
              <label className="label" htmlFor="purchase-date">
                Purchase Date
              </label>
              <input
                id="purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="input"
              />
            </div>

            <div>
              <label className="label" htmlFor="source-select">
                Source
              </label>
              <select
                id="source-select"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="select"
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
              <label className="label" htmlFor="vendor-select">
                Vendor
              </label>
              <select
                id="vendor-select"
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="select"
              >
                <option value="">(none)</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="seller-name">
                Seller Name
              </label>
              <input
                id="seller-name"
                value={sellerName}
                onChange={(e) => setSellerName(e.target.value)}
                className="input"
                placeholder="Optional seller / account / person"
              />
            </div>

            <div>
              <label className="label" htmlFor="shipping-cost">
                Shipping Cost
              </label>
              <input
                id="shipping-cost"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                className="input"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="label" htmlFor="tax">
                Tax
              </label>
              <input
                id="tax"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="input"
                inputMode="decimal"
                placeholder="0.00"
              />
            </div>

            <div className="field-full">
              <label className="label" htmlFor="notes">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="textarea"
                placeholder="Shipping details, order notes, invoice reference, item condition notes, bundle notes, etc."
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header-row">
            <div>
              <h3 className="card-title">Purchase Items</h3>
              <p className="card-subtitle">Add one line per inventory item received.</p>
            </div>

            <button type="button" onClick={addLine} className="button-primary">
              Add Line
            </button>
          </div>

          <TableWrap>
            <table className="app-table purchases-table">
              <thead>
                <tr>
                  <th className="th-left">Inventory Item</th>
                  <th className="th-left">Description</th>
                  <th className="th-right">Current Qty</th>
                  <th className="th-right">Quantity</th>
                  <th className="th-right">Unit Cost</th>
                  <th className="th-right">Line Total</th>
                  <th className="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const selected = inventoryItems.find((p) => p.id === row.inventory_item_id);
                  const qty = parseInt(row.quantity, 10) || 0;
                  const unitCost = Number(row.unit_cost || 0);
                  const lineTotal = qty * unitCost;

                  return (
                    <tr key={index} className="tr">
                      <td className="td-top">
                        <select
                          value={row.inventory_item_id}
                          onChange={(e) => {
                            const inventoryItemId = e.target.value;
                            const selectedItem = inventoryItems.find(
                              (p) => p.id === inventoryItemId
                            );

                            updateItem(index, {
                              inventory_item_id: inventoryItemId,
                              description: selectedItem?.description || "",
                              unit_cost:
                                selectedItem && selectedItem.unit_cost != null
                                  ? String(selectedItem.unit_cost)
                                  : "0",
                            });
                          }}
                          className="select"
                        >
                          <option value="">(select inventory item)</option>
                          {inventoryItems.map((p) => (
                            <option key={p.id} value={p.id}>
                              {itemDisplayLabel(p)}
                            </option>
                          ))}
                        </select>

                        {selected ? (
                          <div className="purchase-product-hint">{itemDisplayLabel(selected)}</div>
                        ) : (
                          <div className="purchase-product-hint-muted">
                            Choose an inventory item for this line.
                          </div>
                        )}
                      </td>

                      <td className="td-top">
                        <input
                          value={row.description}
                          onChange={(e) => updateItem(index, { description: e.target.value })}
                          className="input"
                          placeholder="Line description"
                        />
                      </td>

                      <td className="td-right">
                        <span
                          className={
                            Number(selected?.qty_on_hand ?? 0) > 0
                              ? "purchase-qty-pill"
                              : "purchase-qty-pill-low"
                          }
                        >
                          {selected?.qty_on_hand ?? 0}
                        </span>
                      </td>

                      <td className="td-right">
                        <input
                          value={row.quantity}
                          onChange={(e) => updateItem(index, { quantity: e.target.value })}
                          className="purchase-number-input"
                          inputMode="numeric"
                        />
                      </td>

                      <td className="td-right">
                        <input
                          value={row.unit_cost}
                          onChange={(e) => updateItem(index, { unit_cost: e.target.value })}
                          className="purchase-number-input-wide"
                          inputMode="decimal"
                        />
                      </td>

                      <td className="td-right">
                        <strong>${money(lineTotal)}</strong>
                      </td>

                      <td className="td-right">
                        <button
                          type="button"
                          onClick={() => removeLine(index)}
                          disabled={items.length === 1}
                          className={`button-danger ${items.length === 1 ? "button-disabled" : ""}`}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>

          <div className="purchase-totals-bar">
            <div className="purchase-totals-meta">
              <div className="purchase-total-chip">
                <span>Lines</span>
                <strong>{items.length}</strong>
              </div>
              <div className="purchase-total-chip">
                <span>Units</span>
                <strong>{totalUnits}</strong>
              </div>
              <div className="purchase-total-chip">
                <span>Subtotal</span>
                <strong>${money(subtotal)}</strong>
              </div>
              <div className="purchase-total-chip">
                <span>Shipping</span>
                <strong>${money(shippingCostNum)}</strong>
              </div>
              <div className="purchase-total-chip">
                <span>Tax</span>
                <strong>${money(taxNum)}</strong>
              </div>
            </div>

            <div className="purchase-total-cost-box">
              Total Cost: <strong>${money(totalCost)}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={resetForm} className="button-secondary" disabled={saving}>
            Clear
          </button>

          <button type="submit" disabled={saving} className="button-primary">
            {saving ? "Saving..." : "Save Purchase"}
          </button>
        </div>
      </form>
    </div>
  );
}
