import React, { useCallback, useEffect, useState } from "react";

import { useAuth } from "../auth/useAuth";
import {
  addPaymentToInvoice,
  getInvoiceItems,
  getInvoicePayments,
  listInvoices,
} from "../data/invoices";

import "../styles/invoice-history.css";

function money(n) {
  return Number(n || 0).toFixed(2);
}

function getLocalDateTimeInputValue() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function emptyPaymentForm() {
  return {
    amount: "",
    payment_method: "",
    payment_date: getLocalDateTimeInputValue(),
  };
}

function statusBadgeClass(status) {
  switch ((status || "").toLowerCase()) {
    case "paid":
      return "invoice-status-badge invoice-status-paid";
    case "partial":
      return "invoice-status-badge invoice-status-partial";
    case "unpaid":
    default:
      return "invoice-status-badge invoice-status-unpaid";
  }
}

function formatDateTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export default function InvoiceHistory() {
  const { user } = useAuth();
  const ownerId = user?.id;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState(null);
  const [itemMap, setItemMap] = useState({});
  const [paymentMap, setPaymentMap] = useState({});
  const [loadingItemsId, setLoadingItemsId] = useState(null);
  const [loadingPaymentsId, setLoadingPaymentsId] = useState(null);

  const [paymentFormByInvoice, setPaymentFormByInvoice] = useState({});
  const [savingPaymentId, setSavingPaymentId] = useState(null);

  const load = useCallback(async () => {
    if (!ownerId) return;

    setLoading(true);
    try {
      const data = await listInvoices(ownerId);
      setRows(data || []);
    } catch (e) {
      alert(e?.message || "Failed to load invoices.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => {
    load();
  }, [load]);

  function getPaymentForm(invoiceId) {
    return paymentFormByInvoice[invoiceId] || emptyPaymentForm();
  }

  function updatePaymentForm(invoiceId, patch) {
    setPaymentFormByInvoice((prev) => ({
      ...prev,
      [invoiceId]: {
        ...getPaymentForm(invoiceId),
        ...patch,
      },
    }));
  }

  async function toggleExpand(invoiceId) {
    if (expandedId === invoiceId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(invoiceId);

    if (!itemMap[invoiceId]) {
      try {
        setLoadingItemsId(invoiceId);
        const items = await getInvoiceItems(invoiceId, ownerId);
        setItemMap((prev) => ({
          ...prev,
          [invoiceId]: items || [],
        }));
      } catch (e) {
        alert(e?.message || "Failed to load invoice items.");
      } finally {
        setLoadingItemsId(null);
      }
    }

    if (!paymentMap[invoiceId]) {
      try {
        setLoadingPaymentsId(invoiceId);
        const payments = await getInvoicePayments(invoiceId, ownerId);
        setPaymentMap((prev) => ({
          ...prev,
          [invoiceId]: payments || [],
        }));
      } catch (e) {
        alert(e?.message || "Failed to load payments.");
      } finally {
        setLoadingPaymentsId(null);
      }
    }
  }

  async function handleAddPayment(invoiceRow) {
    const form = getPaymentForm(invoiceRow.id);

    const amountNum = Number(form.amount || 0);
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    const remaining = Math.max(Number(invoiceRow.balance_due || 0), 0);
    if (amountNum - remaining > 0.00001) {
      alert("Payment exceeds remaining invoice balance.");
      return;
    }

    if (!form.payment_method) {
      alert("Select a payment method.");
      return;
    }

    try {
      setSavingPaymentId(invoiceRow.id);

      const result = await addPaymentToInvoice({
        ownerId,
        invoiceId: invoiceRow.id,
        amount: form.amount,
        paymentMethod: form.payment_method,
        paymentDate: form.payment_date
          ? new Date(form.payment_date).toISOString()
          : new Date().toISOString(),
      });

      const refreshedPayments = await getInvoicePayments(
        invoiceRow.id,
        ownerId
      );

      setPaymentMap((prev) => ({
        ...prev,
        [invoiceRow.id]: refreshedPayments,
      }));

      setRows((prev) =>
        prev.map((row) =>
          row.id !== invoiceRow.id
            ? row
            : {
                ...row,
                payment_status: result.payment_status,
                paid_amount: result.paid_amount,
                balance_due: result.balance_due,
              }
        )
      );

      setPaymentFormByInvoice((prev) => ({
        ...prev,
        [invoiceRow.id]: emptyPaymentForm(),
      }));
    } catch (e) {
      alert(e?.message || "Failed to add payment.");
    } finally {
      setSavingPaymentId(null);
    }
  }

  if (!ownerId) {
    return (
      <div className="page">
        <div className="loading-card">Loading...</div>
      </div>
    );
  }

  let invoicesContent;

  if (loading) {
    invoicesContent = (
      <div className="loading-card">Loading invoices...</div>
    );
  } else if (rows.length === 0) {
    invoicesContent = (
      <div className="empty-state">No invoices yet.</div>
    );
  } else {
    invoicesContent = (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoices</h3>
          <p className="card-subtitle">
            Expand an invoice to view items and add payments.
          </p>
        </div>

        <div className="table-wrap">
          <table className="app-table invoice-history-table">
            <thead>
              <tr>
                <th className="th-left">Invoice #</th>
                <th className="th-left">Date</th>
                <th className="th-left">Customer</th>
                <th className="th-left">Status</th>
                <th className="th-right">Total</th>
                <th className="th-right">Paid</th>
                <th className="th-right">Balance</th>
                <th className="th-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const isOpen = expandedId === r.id;
                const items = itemMap[r.id] || [];
                const payments = paymentMap[r.id] || [];
                const paymentForm = getPaymentForm(r.id);

                const safeBalance = Math.max(Number(r.balance_due || 0), 0);
                const isPaidOff = safeBalance <= 0;

                let itemsContent;

                if (loadingItemsId === r.id) {
                  itemsContent = (
                    <div className="empty-state">Loading items...</div>
                  );
                } else if (items.length === 0) {
                  itemsContent = (
                    <div className="empty-state">No items found.</div>
                  );
                } else {
                  itemsContent = (
                    <div className="table-wrap">
                      <table className="app-table invoice-nested-table">
                        <thead>
                          <tr>
                            <th className="th-left">Description</th>
                            <th className="th-left">Product</th>
                            <th className="th-left">SKU</th>
                            <th className="th-right">Qty</th>
                            <th className="th-right">Unit Price</th>
                            <th className="th-right">Line Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item) => {
                            const productLabel =
                              item.product?.device_label ||
                              item.product?.description ||
                              "";

                            const lineTotal =
                              Number(item.quantity || 0) *
                              Number(item.unit_price || 0);

                            return (
                              <tr key={item.id} className="tr">
                                <td className="td-left">
                                  {item.description || ""}
                                </td>
                                <td className="td-left">{productLabel}</td>
                                <td className="td-left">
                                  {item.product?.sku || ""}
                                </td>
                                <td className="td-right">{item.quantity}</td>
                                <td className="td-right">
                                  {money(item.unit_price)}
                                </td>
                                <td className="td-right">
                                  {money(lineTotal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                let addPaymentButtonText;

                if (isPaidOff) {
                  addPaymentButtonText = "Paid in Full";
                } else if (savingPaymentId === r.id) {
                  addPaymentButtonText = "Saving...";
                } else {
                  addPaymentButtonText = "Add Payment";
                }

                let paymentsContent;

                if (loadingPaymentsId === r.id) {
                  paymentsContent = (
                    <div className="empty-state">Loading payments...</div>
                  );
                } else if (payments.length === 0) {
                  paymentsContent = (
                    <div className="empty-state">No payments yet.</div>
                  );
                } else {
                  paymentsContent = (
                    <div className="table-wrap">
                      <table className="app-table invoice-nested-table">
                        <thead>
                          <tr>
                            <th className="th-left">Date</th>
                            <th className="th-left">Method</th>
                            <th className="th-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payments.map((payment) => (
                            <tr key={payment.id} className="tr">
                              <td className="td-left">
                                {formatDateTime(payment.payment_date)}
                              </td>
                              <td className="td-left">
                                {payment.payment_method || ""}
                              </td>
                              <td className="td-right">
                                {money(payment.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                }

                return (
                  <React.Fragment key={r.id}>
                    <tr className="tr">
                      <td className="td-left">{r.invoice_number}</td>
                      <td className="td-left">{r.invoice_date || ""}</td>
                      <td className="td-left">
                        {r.customer?.name || "(no customer)"}
                      </td>
                      <td className="td-left">
                        <span className={statusBadgeClass(r.payment_status)}>
                          {r.payment_status || "unpaid"}
                        </span>
                      </td>
                      <td className="td-right">{money(r.total)}</td>
                      <td className="td-right">{money(r.paid_amount)}</td>
                      <td className="td-right">{money(safeBalance)}</td>
                      <td className="td-right">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          className="button-secondary"
                        >
                          {isOpen ? "Hide" : "View"}
                        </button>
                      </td>
                    </tr>

                    {isOpen ? (
                      <tr>
                        <td colSpan="8" className="invoice-expanded-cell">
                          <div className="invoice-expanded-section">
                            <h4 className="invoice-section-heading">Items</h4>
                            {itemsContent}
                          </div>

                          <div className="invoice-expanded-section">
                            <h4 className="invoice-section-heading">
                              Add Payment
                            </h4>

                            <div className="invoice-summary-chips">
                              <div className="invoice-summary-chip">
                                <span className="invoice-summary-label">
                                  Total:
                                </span>
                                <strong>{money(r.total)}</strong>
                              </div>

                              <div className="invoice-summary-chip">
                                <span className="invoice-summary-label">
                                  Paid:
                                </span>
                                <strong>{money(r.paid_amount)}</strong>
                              </div>

                              <div className="invoice-summary-chip invoice-summary-chip-remaining">
                                <span className="invoice-summary-label">
                                  Remaining:
                                </span>
                                <strong>{money(safeBalance)}</strong>
                              </div>
                            </div>

                            <div className="invoice-payment-actions">
                              <button
                                type="button"
                                onClick={() =>
                                  updatePaymentForm(r.id, {
                                    amount:
                                      safeBalance > 0 ? money(safeBalance) : "",
                                  })
                                }
                                disabled={isPaidOff || savingPaymentId === r.id}
                                className="button-secondary"
                              >
                                Pay Full Remaining
                              </button>
                            </div>

                            <div className="form-grid invoice-payment-grid">
                              <div>
                                <label htmlFor="amount-input" className="label">Amount</label>
                                <input
                                  id="amount-intput"
                                  type="number"
                                  min="0.01"
                                  step="0.01"
                                  max={safeBalance.toFixed(2)}
                                  value={paymentForm.amount}
                                  onChange={(e) =>
                                    updatePaymentForm(r.id, {
                                      amount: e.target.value,
                                    })
                                  }
                                  placeholder={`Up to ${money(safeBalance)}`}
                                  className="input"
                                  disabled={isPaidOff || savingPaymentId === r.id}
                                />
                              </div>

                              <div>
                                <label htmlFor="method-select" className="label">Method</label>
                                <select
                                  id="method-select"
                                  value={paymentForm.payment_method}
                                  onChange={(e) =>
                                    updatePaymentForm(r.id, {
                                      payment_method: e.target.value,
                                    })
                                  }
                                  className="select"
                                  disabled={isPaidOff || savingPaymentId === r.id}
                                >
                                  <option value="">(select method)</option>
                                  <option value="cash">Cash</option>
                                  <option value="card">Card</option>
                                  <option value="zelle">Zelle</option>
                                  <option value="cashapp">Cash App</option>
                                  <option value="venmo">Venmo</option>
                                  <option value="paypal">PayPal</option>
                                  <option value="check">Check</option>
                                  <option value="bank_transfer">
                                    Bank Transfer
                                  </option>
                                  <option value="other">Other</option>
                                </select>
                              </div>

                              <div>
                                <label htmlFor="datetime-local" className="label">Payment Date</label>
                                <input
                                  id="datetime-local"
                                  type="datetime-local"
                                  value={paymentForm.payment_date}
                                  onChange={(e) =>
                                    updatePaymentForm(r.id, {
                                      payment_date: e.target.value,
                                    })
                                  }
                                  className="input"
                                  disabled={isPaidOff || savingPaymentId === r.id}
                                />
                              </div>
                            </div>

                            <div className="invoice-payment-actions">
                              <button
                                type="button"
                                onClick={() => handleAddPayment(r)}
                                disabled={isPaidOff || savingPaymentId === r.id}
                                className="button-primary"
                              >
                                {addPaymentButtonText}
                              </button>
                            </div>
                          </div>

                          <div className="invoice-expanded-section">
                            <h4 className="invoice-section-heading">Payments</h4>
                            {paymentsContent}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Invoice History</h2>
          <p className="page-subtitle">
            Review invoices, line items, balances, and payments.
          </p>
        </div>
      </div>

      {invoicesContent}
    </div>
  );
}
