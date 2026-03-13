import React, { useEffect, useMemo, useState } from "react";

import { getPurchaseItems, listPurchases } from "../data/purchases";
import "../styles/purchase-history.css";
import EmptyState from "@/components/ui/EmptyState";
import TableWrap from "@/components/ui/TableWrap";
import PageHeader from "@/components/ui/PageHeader";

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
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

  const stats = useMemo(() => {
    const totalPurchases = rows.length;
    const totalSpent = rows.reduce((sum, r) => sum + Number(r.total_cost || 0), 0);
    const withSource = rows.filter((r) => r.source?.name).length;
    const withSeller = rows.filter((r) => (r.seller_name || "").trim()).length;

    return {
      totalPurchases,
      totalSpent,
      withSource,
      withSeller,
    };
  }, [rows]);

  let purchasesContent;

  if (loading) {
    purchasesContent = <div className="empty-state">Loading purchases...</div>;
  } else if (rows.length === 0) {
    <EmptyState
      title="No purchases yet"
      message="Once you start recording purchases, they will appear here with totals and line item details."
    />;
  } else {
    purchasesContent = (
      <div className="purchase-history-list">
        {rows.map((r) => {
          const isOpen = expandedId === r.id;
          const items = itemMap[r.id] || [];

          let expandedContent = null;

          if (isOpen) {
            if (loadingItemsId === r.id) {
              expandedContent = (
                <div className="purchase-history-inner-empty">Loading items...</div>
              );
            } else if (items.length === 0) {
              expandedContent = <div className="purchase-history-inner-empty">No items found.</div>;
            } else {
              expandedContent = (
                <TableWrap>
                  <table className="app-table purchase-history-items-table">
                    <thead>
                      <tr>
                        <th className="th-left">Product</th>
                        <th className="th-left">SKU</th>
                        <th className="th-right">Qty</th>
                        <th className="th-right">Unit Cost</th>
                        <th className="th-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => {
                        const label =
                          item.product?.device_label ||
                          item.product?.description ||
                          "(unknown product)";

                        const lineTotal = Number(item.quantity || 0) * Number(item.unit_cost || 0);

                        return (
                          <tr key={item.id} className="tr">
                            <td className="td-left">
                              <div className="purchase-history-item-title">{label}</div>
                            </td>
                            <td className="td-left">{item.product?.sku || "—"}</td>
                            <td className="td-right">{item.quantity || 0}</td>
                            <td className="td-right">${money(item.unit_cost)}</td>
                            <td className="td-right">
                              <strong>${money(lineTotal)}</strong>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </TableWrap>
              );
            }
          }

          return (
            <div
              key={r.id}
              className={`purchase-history-row ${isOpen ? "purchase-history-row-open" : ""}`}
            >
              <div className="purchase-history-summary">
                <div className="purchase-history-top-row">
                  <div>
                    <div className="purchase-history-date">{formatDate(r.purchase_date)}</div>
                    <div className="purchase-history-meta">
                      <span>
                        <strong>Source:</strong> {r.source?.name || "—"}
                      </span>
                      <span>
                        <strong>Seller:</strong> {r.seller_name || "—"}
                      </span>
                    </div>
                  </div>

                  <div className="purchase-history-total-box">
                    <div className="purchase-history-total-label">Total Cost</div>
                    <div className="purchase-history-total-value">${money(r.total_cost)}</div>
                  </div>
                </div>

                <div className="purchase-history-notes-box">
                  <div className="purchase-history-notes-label">Notes</div>
                  <div className="purchase-history-notes-text">{r.notes || "No notes."}</div>
                </div>

                <div className="purchase-history-actions">
                  <button
                    type="button"
                    onClick={() => toggleExpand(r.id)}
                    className={isOpen ? "button-secondary" : "button-primary"}
                  >
                    {isOpen ? "Hide Items" : "View Items"}
                  </button>
                </div>
              </div>

              {isOpen ? (
                <div className="purchase-history-expanded">
                  <div className="purchase-history-expanded-header">
                    <h4 className="purchase-history-expanded-title">Purchased Items</h4>
                  </div>

                  {expandedContent}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Purchase History"
        subtitle="Review past purchases, sources, sellers, and line item details."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Purchases</div>
          <div className="stat-value">{stats.totalPurchases}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Spent</div>
          <div className="stat-value">${money(stats.totalSpent)}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">With Source</div>
          <div className="stat-value">{stats.withSource}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">With Seller</div>
          <div className="stat-value">{stats.withSeller}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Purchase Records</h3>
            <p className="card-subtitle">
              Expand a purchase to see the items included in that entry.
            </p>
          </div>
          <div className="count-badge">
            {rows.length} record{rows.length === 1 ? "" : "s"}
          </div>
        </div>

        {purchasesContent}
      </div>
    </div>
  );
}
