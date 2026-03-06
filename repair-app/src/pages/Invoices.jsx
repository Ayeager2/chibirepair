import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppNav from "../components/AppNav";
import CustomerSelect from "../components/customers/CustomerSelect";
import { useAuth } from "../auth/useAuth";
import { emptyInvoiceItem, createInvoiceWithItems } from "../data/invoices";
import { searchProductsForInvoice } from "../data/products";

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
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function handleProductSelect(index, productId) {
    const selected = productOptions.find(
      (p) => String(p.id) === String(productId),
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
            },
      ),
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
      <div className="container py-4">
        <div className="alert alert-warning mb-0">
          Unable to determine current user.
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Create Invoice</h2>
      </div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-12 col-lg-6">
              <label className="form-label">Customer</label>
              <CustomerSelect
                value={invoice.customer_id}
                selectedCustomer={selectedCustomer}
                onChange={handleCustomerChange}
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Invoice Date</label>
              <input
                type="date"
                className="form-control"
                value={invoice.invoice_date}
                onChange={(e) =>
                  handleInvoiceChange("invoice_date", e.target.value)
                }
              />
            </div>

            <div className="col-12 col-md-3">
              <label className="form-label">Payment Status</label>
              <select
                className="form-select"
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
      </div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3 gap-2">
            <h5 className="mb-0">Invoice Items</h5>

            <div className="d-flex gap-2 align-items-center">
              <input
                type="text"
                className="form-control"
                style={{ minWidth: 260 }}
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={addItem}
              >
                Add Line
              </button>
            </div>
          </div>

          {loadingProducts ? (
            <div className="small text-muted mb-3">Loading products...</div>
          ) : null}

          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th style={{ minWidth: 220 }}>Product</th>
                  <th>Description</th>
                  <th style={{ width: 120 }}>Qty</th>
                  <th style={{ width: 140 }}>Unit Price</th>
                  <th style={{ width: 140 }}>Line Total</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <select
                        className="form-select"
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

                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="1"
                        className="form-control"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemChange(index, "quantity", e.target.value)
                        }
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control"
                        value={item.unit_price}
                        onChange={(e) =>
                          handleItemChange(index, "unit_price", e.target.value)
                        }
                      />
                    </td>

                    <td className="fw-semibold">
                      ${formatMoney(getLineTotal(item))}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
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

          <div className="row justify-content-end mt-4">
            <div className="col-12 col-md-5 col-lg-4">
              <div className="border rounded p-3 bg-body-tertiary">
                <div className="d-flex justify-content-between mb-2">
                  <span>Subtotal</span>
                  <strong>${formatMoney(subtotal)}</strong>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Tax</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control form-control-sm"
                    style={{ width: 140 }}
                    value={invoice.tax}
                    onChange={(e) => handleInvoiceChange("tax", e.target.value)}
                  />
                </div>

                <div className="d-flex justify-content-between border-top pt-2">
                  <span className="fw-semibold">Total</span>
                  <strong>${formatMoney(total)}</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
