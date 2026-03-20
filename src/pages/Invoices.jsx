import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerSelect from "@/components/customers/CustomerSelect";

import { useAuth } from "../auth/useAuth";
import { emptyInvoiceItem, createInvoiceWithItems } from "../data/invoices";
import { searchInventoryForSale } from "../data/inventory";

import "../styles/invoices.css";
import TableWrap from "@/components/ui/TableWrap";
import PageHeader from "@/components/ui/PageHeader";

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function inventoryLabel(item) {
  if (!item) return "";
  return item.device_label || item.description || item.sku || "Unnamed inventory item";
}

export default function Invoices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerId = user?.id;

  const [invoice, setInvoice] = useState({
    customer_id: "",
    build_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    payment_status: "unpaid",
    tax: "0",
    discount: "0",
    notes: "",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([emptyInvoiceItem()]);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryOptions, setInventoryOptions] = useState([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ownerId) return;

    let ignore = false;

    const timer = setTimeout(async () => {
      try {
        setLoadingInventory(true);

        const rows = await searchInventoryForSale({
          ownerId,
          search: inventorySearch,
          limit: 25,
        });

        if (!ignore) {
          setInventoryOptions(rows || []);
        }
      } catch (err) {
        console.error("Failed to load invoice inventory:", err);
        if (!ignore) {
          setInventoryOptions([]);
        }
      } finally {
        if (!ignore) {
          setLoadingInventory(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ownerId, inventorySearch]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unit_price || 0);
      return sum + qty * price;
    }, 0);
  }, [items]);

  const tax = Number(invoice.tax || 0);
  const discount = Number(invoice.discount || 0);
  const total = Math.max(0, subtotal + tax - discount);

  function handleInvoiceChange(field, value) {
    setInvoice((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function handleCustomerChange(customer) {
    setSelectedCustomer(customer);
    setInvoice((prev) => ({
      ...prev,
      customer_id: customer?.id || "",
    }));
  }

  function handleItemChange(index, field, value) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function handleInventorySelect(index, inventoryItemId) {
    const selected = inventoryOptions.find((p) => String(p.id) === String(inventoryItemId));

    setItems((prev) =>
      prev.map((item, i) =>
        i !== index
          ? item
          : {
              ...item,
              inventory_item_id: inventoryItemId,
              description: selected?.description || "",
              unit_price: selected?.asking_price != null ? String(selected.asking_price) : "0",
              line_type: "item",
            }
      )
    );
  }

  function addItem() {
    setItems((prev) => [...prev, emptyInvoiceItem()]);
  }

  function removeItem(index) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function getLineTotal(item) {
    return Number(item.quantity || 0) * Number(item.unit_price || 0);
  }

  async function handleSave() {
    if (!ownerId) {
      window.alert("Unable to determine current user.");
      return;
    }

    try {
      setSaving(true);

      const invoiceRow = await createInvoiceWithItems({
        ownerId,
        invoice,
        items,
      });

      window.alert(`Invoice #${invoiceRow.invoice_number} saved.`);
      navigate("/");
    } catch (err) {
      console.error("Failed to save invoice:", err);
      window.alert(err.message || "Failed to save invoice.");
    } finally {
      setSaving(false);
    }
  }

  if (!ownerId) {
    return (
      <div className="page">
        <div className="invoice-warning-card">Unable to determine current user.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Create Invoice"
        subtitle="Build an invoice, add inventory or custom lines, and save it to customer history."
      />

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoice Details</h3>
          <p className="card-subtitle">
            Choose the customer, invoice date, and current payment status.
          </p>
        </div>

        <div className="form-grid">
          <div className="field-full">
            <label htmlFor="customer-select" className="label">
              Customer
            </label>
            <CustomerSelect
              id="customer-select"
              value={invoice.customer_id}
              selectedCustomer={selectedCustomer}
              onChange={handleCustomerChange}
            />
          </div>

          <div>
            <label htmlFor="invoice-date" className="label">
              Invoice Date
            </label>
            <input
              id="invoice-date"
              type="date"
              className="input"
              value={invoice.invoice_date}
              onChange={(e) => handleInvoiceChange("invoice_date", e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="payment-status" className="label">
              Payment Status
            </label>
            <select
              id="payment-status"
              className="select"
              value={invoice.payment_status}
              onChange={(e) => handleInvoiceChange("payment_status", e.target.value)}
            >
              <option value="unpaid">Unpaid</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="refunded">Refunded</option>
              <option value="void">Void</option>
            </select>
          </div>

          <div className="field-full">
            <label htmlFor="invoice-notes" className="label">
              Notes
            </label>
            <textarea
              id="invoice-notes"
              className="textarea"
              rows={3}
              value={invoice.notes}
              onChange={(e) => handleInvoiceChange("notes", e.target.value)}
              placeholder="Optional invoice notes"
            />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row invoices-header-row">
          <div>
            <h3 className="card-title">Invoice Items</h3>
            <p className="card-subtitle">
              Add line items, select inventory, and adjust descriptions or prices.
            </p>
          </div>

          <div className="invoices-toolbar">
            <input
              type="text"
              className="input invoices-search"
              placeholder="Search inventory..."
              value={inventorySearch}
              onChange={(e) => setInventorySearch(e.target.value)}
            />
            <button type="button" className="button-secondary" onClick={addItem}>
              Add Line
            </button>
          </div>
        </div>

        {loadingInventory ? (
          <div className="small-muted invoices-loading-products">Loading inventory...</div>
        ) : null}

        <TableWrap>
          <table className="app-table invoices-table">
            <thead>
              <tr>
                <th className="th-left invoices-col-product">Inventory Item</th>
                <th className="th-left">Description</th>
                <th className="th-right invoices-col-qty">Qty</th>
                <th className="th-right invoices-col-price">Unit Price</th>
                <th className="th-right invoices-col-total">Line Total</th>
                <th className="th-right invoices-col-actions"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={index} className="tr">
                  <td className="td-top">
                    <select
                      className="select"
                      value={item.inventory_item_id}
                      onChange={(e) => handleInventorySelect(index, e.target.value)}
                    >
                      <option value="">Select inventory item</option>
                      {inventoryOptions.map((inventoryItem) => (
                        <option key={inventoryItem.id} value={inventoryItem.id}>
                          {inventoryLabel(inventoryItem)}
                          {inventoryItem.sku ? ` (${inventoryItem.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="td-top">
                    <input
                      type="text"
                      className="input"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, "description", e.target.value)}
                    />
                  </td>

                  <td className="td-top">
                    <input
                      type="number"
                      min="1"
                      className="input invoices-number-input"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                    />
                  </td>

                  <td className="td-top">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input invoices-number-input-wide"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, "unit_price", e.target.value)}
                    />
                  </td>

                  <td className="td-right invoices-line-total">
                    ${formatMoney(getLineTotal(item))}
                  </td>

                  <td className="td-right">
                    <button
                      type="button"
                      className="button-danger"
                      disabled={items.length === 1}
                      onClick={() => removeItem(index)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>

        <div className="invoices-summary-wrap">
          <div className="invoices-summary-card">
            <div className="invoices-summary-row">
              <span>Subtotal</span>
              <strong>${formatMoney(subtotal)}</strong>
            </div>

            <div className="invoices-summary-row invoices-summary-tax-row">
              <span>Tax</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input invoices-tax-input"
                value={invoice.tax}
                onChange={(e) => handleInvoiceChange("tax", e.target.value)}
              />
            </div>

            <div className="invoices-summary-row invoices-summary-tax-row">
              <span>Discount</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input invoices-tax-input"
                value={invoice.discount}
                onChange={(e) => handleInvoiceChange("discount", e.target.value)}
              />
            </div>

            <div className="invoices-summary-total">
              <span>Total</span>
              <strong>${formatMoney(total)}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="button-primary" disabled={saving} onClick={handleSave}>
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
