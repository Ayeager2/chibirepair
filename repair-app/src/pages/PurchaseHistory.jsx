import React, { useEffect, useState } from "react";
import { getPurchaseItems, listPurchases } from "../data/purchases";

function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function PurchaseHistory() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [itemMap, setItemMap] = useState({});
  const [loadingItemsId, setLoadingItemsId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const data = await listPurchases();
      setRows(data || []);
    } catch (e) {
      alert(e?.message || "Failed to load purchases.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleExpand(purchaseId) {
    if (expandedId === purchaseId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(purchaseId);

    if (itemMap[purchaseId]) return;

    try {
      setLoadingItemsId(purchaseId);
      const items = await getPurchaseItems(purchaseId);
      setItemMap((prev) => ({
        ...prev,
        [purchaseId]: items || [],
      }));
    } catch (e) {
      alert(e?.message || "Failed to load purchase items.");
    } finally {
      setLoadingItemsId(null);
    }
  }

  return (
    <div>
      <h2>Purchase History</h2>

      {loading ? (
        <div>Loading purchases...</div>
      ) : rows.length === 0 ? (
        <div>No purchases yet.</div>
      ) : (
        <table
          width="100%"
          cellPadding="8"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th align="left">Date</th>
              <th align="left">Source</th>
              <th align="left">Seller</th>
              <th align="left">Notes</th>
              <th align="right">Total Cost</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = expandedId === r.id;
              const items = itemMap[r.id] || [];

              return (
                <React.Fragment key={r.id}>
                  <tr style={{ borderTop: "1px solid #ddd" }}>
                    <td>{r.purchase_date || ""}</td>
                    <td>{r.source?.name || ""}</td>
                    <td>{r.seller_name || ""}</td>
                    <td>{r.notes || ""}</td>
                    <td align="right">{money(r.total_cost)}</td>
                    <td align="right">
                      <button type="button" onClick={() => toggleExpand(r.id)}>
                        {isOpen ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {isOpen ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{
                          background: "#fafafa",
                          borderTop: "1px solid #eee",
                        }}
                      >
                        {loadingItemsId === r.id ? (
                          <div>Loading items...</div>
                        ) : items.length === 0 ? (
                          <div>No items found.</div>
                        ) : (
                          <table
                            width="100%"
                            cellPadding="6"
                            style={{ borderCollapse: "collapse" }}
                          >
                            <thead>
                              <tr>
                                <th align="left">Product</th>
                                <th align="left">SKU</th>
                                <th align="right">Qty</th>
                                <th align="right">Unit Cost</th>
                                <th align="right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {items.map((item) => {
                                const label =
                                  item.product?.device_label ||
                                  item.product?.description ||
                                  "(unknown product)";

                                const lineTotal =
                                  Number(item.quantity || 0) *
                                  Number(item.unit_cost || 0);

                                return (
                                  <tr
                                    key={item.id}
                                    style={{ borderTop: "1px solid #eee" }}
                                  >
                                    <td>{label}</td>
                                    <td>{item.product?.sku || ""}</td>
                                    <td align="right">{item.quantity}</td>
                                    <td align="right">
                                      {money(item.unit_cost)}
                                    </td>
                                    <td align="right">{money(lineTotal)}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </td>
                    </tr>
                  ) : null}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
