import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  addPaymentToInvoice,
  getInvoiceItems,
  getInvoicePayments,
  listInvoices,
} from "../data/invoices";

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
      return "bg-success-subtle text-success";
    case "partial":
      return "bg-warning-subtle text-warning";
    case "unpaid":
    default:
      return "bg-secondary-subtle text-secondary";
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

  async function load() {
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
  }

  useEffect(() => {
    load();
  }, [ownerId]);

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
        ownerId,
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
              },
        ),
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
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>Invoice History</h2>

      {loading ? (
        <div>Loading invoices...</div>
      ) : rows.length === 0 ? (
        <div>No invoices yet.</div>
      ) : (
        <table
          width="100%"
          cellPadding="8"
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th align="left">Invoice #</th>
              <th align="left">Date</th>
              <th align="left">Customer</th>
              <th align="left">Status</th>
              <th align="right">Total</th>
              <th align="right">Paid</th>
              <th align="right">Balance</th>
              <th />
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

              return (
                <React.Fragment key={r.id}>
                  <tr style={{ borderTop: "1px solid #ddd" }}>
                    <td>{r.invoice_number}</td>
                    <td>{r.invoice_date || ""}</td>
                    <td>{r.customer?.name || "(no customer)"}</td>
                    <td>
                      <span
                        className={`badge ${statusBadgeClass(r.payment_status)}`}
                      >
                        {r.payment_status || "unpaid"}
                      </span>
                    </td>
                    <td align="right">{money(r.total)}</td>
                    <td align="right">{money(r.paid_amount)}</td>
                    <td align="right">{money(safeBalance)}</td>
                    <td align="right">
                      <button type="button" onClick={() => toggleExpand(r.id)}>
                        {isOpen ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {isOpen ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          background: "#fafafa",
                          borderTop: "1px solid #eee",
                        }}
                      >
                        <div style={{ marginBottom: 16 }}>
                          <h4 style={{ marginTop: 0 }}>Items</h4>

                          {loadingItemsId === r.id ? (
                            <div>Loading items...</div>
                          ) : items.length === 0 ? (
                            <div>No items found.</div>
                          ) : (
                            <table
                              width="100%"
                              cellPadding="6"
                              style={{
                                borderCollapse: "collapse",
                                marginBottom: 16,
                              }}
                            >
                              <thead>
                                <tr>
                                  <th align="left">Description</th>
                                  <th align="left">Product</th>
                                  <th align="left">SKU</th>
                                  <th align="right">Qty</th>
                                  <th align="right">Unit Price</th>
                                  <th align="right">Line Total</th>
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
                                    <tr
                                      key={item.id}
                                      style={{ borderTop: "1px solid #eee" }}
                                    >
                                      <td>{item.description || ""}</td>
                                      <td>{productLabel}</td>
                                      <td>{item.product?.sku || ""}</td>
                                      <td align="right">{item.quantity}</td>
                                      <td align="right">
                                        {money(item.unit_price)}
                                      </td>
                                      <td align="right">{money(lineTotal)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        <div style={{ marginBottom: 16 }}>
                          <h4>Add Payment</h4>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              gap: 12,
                              marginBottom: 12,
                              flexWrap: "wrap",
                            }}
                          >
                            <div
                              style={{
                                padding: "6px 10px",
                                border: "1px solid #ddd",
                                borderRadius: 6,
                                background: "#fff",
                              }}
                            >
                              <span style={{ opacity: 0.75, marginRight: 6 }}>
                                Total:
                              </span>
                              <strong>{money(r.total)}</strong>
                            </div>

                            <div
                              style={{
                                padding: "6px 10px",
                                border: "1px solid #ddd",
                                borderRadius: 6,
                                background: "#fff",
                              }}
                            >
                              <span style={{ opacity: 0.75, marginRight: 6 }}>
                                Paid:
                              </span>
                              <strong>{money(r.paid_amount)}</strong>
                            </div>

                            <div
                              style={{
                                padding: "6px 10px",
                                border: "1px solid #ddd",
                                borderRadius: 6,
                                background: "#fff8e1",
                              }}
                            >
                              <span style={{ opacity: 0.75, marginRight: 6 }}>
                                Remaining:
                              </span>
                              <strong>{money(safeBalance)}</strong>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                              marginBottom: 12,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                updatePaymentForm(r.id, {
                                  amount:
                                    safeBalance > 0 ? money(safeBalance) : "",
                                })
                              }
                              disabled={isPaidOff || savingPaymentId === r.id}
                            >
                              Pay Full Remaining
                            </button>
                          </div>

                          <div
                            style={{
                              display: "grid",
                              gap: 8,
                              gridTemplateColumns: "repeat(3, 1fr)",
                              alignItems: "end",
                              marginBottom: 12,
                            }}
                          >
                            <div>
                              <label>Amount</label>
                              <input
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
                                style={{ width: "100%" }}
                                disabled={isPaidOff || savingPaymentId === r.id}
                              />
                            </div>

                            <div>
                              <label>Method</label>
                              <select
                                value={paymentForm.payment_method}
                                onChange={(e) =>
                                  updatePaymentForm(r.id, {
                                    payment_method: e.target.value,
                                  })
                                }
                                style={{ width: "100%" }}
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
                              <label>Payment Date</label>
                              <input
                                type="datetime-local"
                                value={paymentForm.payment_date}
                                onChange={(e) =>
                                  updatePaymentForm(r.id, {
                                    payment_date: e.target.value,
                                  })
                                }
                                style={{ width: "100%" }}
                                disabled={isPaidOff || savingPaymentId === r.id}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleAddPayment(r)}
                              disabled={isPaidOff || savingPaymentId === r.id}
                            >
                              {isPaidOff
                                ? "Paid in Full"
                                : savingPaymentId === r.id
                                  ? "Saving..."
                                  : "Add Payment"}
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4>Payments</h4>

                          {loadingPaymentsId === r.id ? (
                            <div>Loading payments...</div>
                          ) : payments.length === 0 ? (
                            <div>No payments yet.</div>
                          ) : (
                            <table
                              width="100%"
                              cellPadding="6"
                              style={{ borderCollapse: "collapse" }}
                            >
                              <thead>
                                <tr>
                                  <th align="left">Date</th>
                                  <th align="left">Method</th>
                                  <th align="right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payments.map((payment) => (
                                  <tr
                                    key={payment.id}
                                    style={{ borderTop: "1px solid #eee" }}
                                  >
                                    <td>
                                      {formatDateTime(payment.payment_date)}
                                    </td>
                                    <td>{payment.payment_method || ""}</td>
                                    <td align="right">
                                      {money(payment.amount)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
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
