import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import CustomerSelect from "@/components/customers/CustomerSelect";

import { useAuth } from "../auth/useAuth";
import { emptyInvoiceItem, createInvoiceWithItems } from "../data/invoices";
import { searchProductsForInvoice } from "../data/products";

import "../styles/invoices.css";

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

export default function Invoices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const ownerId = user?.id;

  const [invoice, setInvoice] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    payment_status: "unpaid",
    tax: "0",
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [items, setItems] = useState([emptyInvoiceItem()]);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!ownerId) return;

    let ignore = false;
    const timer = setTimeout(async () => {
      try {
        setLoadingProducts(true);
        const rows = await searchProductsForInvoice({
          ownerId,
          search: productSearch,
          limit: 25,
        });

        if (!ignore) {
          setProductOptions(rows);
        }
      } catch (err) {
        console.error("Failed to load invoice products:", err);
        if (!ignore) {
          setProductOptions([]);
        }
      } finally {
        if (!ignore) {
          setLoadingProducts(false);
        }
      }
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [ownerId, productSearch]);

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.unit_price || 0);
      return sum + qty * price;
    }, 0);
  }, [items]);

  const tax = Number(invoice.tax || 0);
  const total = subtotal + tax;

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
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function handleProductSelect(index, productId) {
    const selected = productOptions.find(
      (p) => String(p.id) === String(productId)
    );

    setItems((prev) =>
      prev.map((item, i) =>
        i !== index
          ? item
          : {
              ...item,
              product_id: productId,
              description: selected?.description || "",
              unit_price:
                selected?.price != null ? String(selected.price) : "0",
              line_type: "product",
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
        <div className="invoice-warning-card">
          Unable to determine current user.
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Create Invoice</h2>
          <p className="page-subtitle">
            Build an invoice, add products or custom lines, and save it to
            customer history.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Invoice Details</h3>
          <p className="card-subtitle">
            Choose the customer, invoice date, and current payment status.
          </p>
        </div>

        <div className="form-grid">
          <div className="field-full">
            <label htmlFor="customer-select" className="label">Customer</label>
            <CustomerSelect
              id="customer-select"
              value={invoice.customer_id}
              selectedCustomer={selectedCustomer}
              onChange={handleCustomerChange}
            />
          </div>

          <div>
            <label htmlFor="date" className="label">Invoice Date</label>
            <input
              type="date"
              className="input"
              value={invoice.invoice_date}
              onChange={(e) =>
                handleInvoiceChange("invoice_date", e.target.value)
              }
            />
          </div>

          <div>
            <label htmlFor="select" className="label">Payment Status</label>
            <select
              className="select"
              value={invoice.payment_status}
              onChange={(e) =>
                handleInvoiceChange("payment_status", e.target.value)
              }
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row invoices-header-row">
          <div>
            <h3 className="card-title">Invoice Items</h3>
            <p className="card-subtitle">
              Add line items, select products, and adjust descriptions or
              prices.
            </p>
          </div>

          <div className="invoices-toolbar">
            <input
              type="text"
              className="input invoices-search"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <button
              type="button"
              className="button-secondary"
              onClick={addItem}
            >
              Add Line
            </button>
          </div>
        </div>

        {loadingProducts ? (
          <div className="small-muted invoices-loading-products">
            Loading products...
          </div>
        ) : null}

        <div className="table-wrap">
          <table className="app-table invoices-table">
            <thead>
              <tr>
                <th className="th-left invoices-col-product">Product</th>
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
                      value={item.product_id}
                      onChange={(e) =>
                        handleProductSelect(index, e.target.value)
                      }
                    >
                      <option value="">Select product</option>
                      {productOptions.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.description}
                          {product.sku ? ` (${product.sku})` : ""}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="td-top">
                    <input
                      type="text"
                      className="input"
                      value={item.description}
                      onChange={(e) =>
                        handleItemChange(index, "description", e.target.value)
                      }
                    />
                  </td>

                  <td className="td-top">
                    <input
                      type="number"
                      min="1"
                      className="input invoices-number-input"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </td>

                  <td className="td-top">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="input invoices-number-input-wide"
                      value={item.unit_price}
                      onChange={(e) =>
                        handleItemChange(index, "unit_price", e.target.value)
                      }
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
        </div>

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

            <div className="invoices-summary-total">
              <span>Total</span>
              <strong>${formatMoney(total)}</strong>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="button-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}
