import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "../auth/useAuth";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../data/products";
import {
  listCategories,
  listSubcategories,
  listDeviceModels,
  listConditions,
  listStatuses,
  listSources,
  listVariants,
} from "../data/lookups";

import "../styles/inventory.css";
import InventoryEditModal from "@/components/inventory/InventoryEditModal";

const defaultValues = {
  description: "",
  sku: "",
  cost: "0",
  price: "0",
  qty: "0",

  categoryId: "",
  subcategoryId: "",
  deviceModelId: "",
  variantId: "",
  conditionId: "",
  statusId: "",
  sourceId: "",

  isForSale: true,
};

export default function Inventory() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues,
    mode: "onSubmit",
  });

  const categoryId = watch("categoryId");
  const subcategoryId = watch("subcategoryId");
  const deviceModelId = watch("deviceModelId");
  const isForSale = watch("isForSale");
  const cost = watch("cost");
  const price = watch("price");
  const qty = watch("qty");

  const watchedCost = Number(cost || 0);
  const watchedPrice = Number(price || 0);
  const watchedQty = Number(qty || 0);

  async function loadProducts() {
    setLoading(true);
    try {
      const data = await listProducts();
      setRows(data || []);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to load products.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadProducts();

        const [cats, conds, stats, srcs] = await Promise.all([
          listCategories(),
          listConditions(),
          listStatuses(),
          listSources(),
        ]);

        setCategories(cats || []);
        setConditions(conds || []);
        setStatuses(stats || []);
        setSources(srcs || []);
      } catch (e) {
        alert(e?.message || "Failed to load lookup lists.");
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        if (!categoryId) {
          setSubcategories([]);
          setModels([]);
          setVariants([]);

          setValue("subcategoryId", "");
          setValue("deviceModelId", "");
          setValue("variantId", "");
          return;
        }

        const [subs, mods] = await Promise.all([
          listSubcategories(categoryId),
          listDeviceModels({ categoryId }),
        ]);

        setSubcategories(subs || []);
        setModels(mods || []);

        setValue("subcategoryId", "");
        setValue("deviceModelId", "");
        setValue("variantId", "");
        setVariants([]);
      } catch (e) {
        alert(e?.message || "Failed to load subcategories/models.");
      }
    })();
  }, [categoryId, setValue]);

  useEffect(() => {
    (async () => {
      try {
        if (!subcategoryId) {
          const mods = categoryId ? await listDeviceModels({ categoryId }) : [];
          setModels(mods || []);
          setValue("deviceModelId", "");
          setValue("variantId", "");
          setVariants([]);
          return;
        }

        const mods = await listDeviceModels({ categoryId, subcategoryId });
        setModels(mods || []);
        setValue("deviceModelId", "");
        setValue("variantId", "");
        setVariants([]);
      } catch (e) {
        alert(e?.message || "Failed to load models.");
      }
    })();
  }, [subcategoryId, categoryId, setValue]);

  useEffect(() => {
    (async () => {
      try {
        if (!deviceModelId) {
          setVariants([]);
          setValue("variantId", "");
          return;
        }

        const v = await listVariants(deviceModelId);
        setVariants(v || []);
        setValue("variantId", "");
      } catch (e) {
        alert(e?.message || "Failed to load variants.");
      }
    })();
  }, [deviceModelId, setValue]);

  function resetForm() {
    reset(defaultValues);
    setSubcategories([]);
    setModels([]);
    setVariants([]);
  }

  async function onSubmit(values) {
    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    const cleanDesc = values.description.trim();
    const cleanSku = values.sku.trim();

    const costNum = Number(values.cost);
    const priceNum =
      values.price === "" || values.price == null ? null : Number(values.price);
    const qtyNum = parseInt(values.qty, 10);

    if (!cleanDesc) {
      alert("Description is required.");
      return;
    }

    if (Number.isNaN(costNum) || costNum < 0) {
      alert("Cost must be a valid number ≥ 0.");
      return;
    }

    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      alert("Qty must be a whole number ≥ 0.");
      return;
    }

    if (values.isForSale) {
      if (priceNum == null || Number.isNaN(priceNum) || priceNum < 0) {
        alert("Price must be a valid number ≥ 0 for sale items.");
        return;
      }

      if (priceNum < costNum) {
        const ok = confirm("Price is lower than cost. Continue?");
        if (!ok) return;
      }
    }

    try {
      setSaving(true);

      await createProduct(user.id, {
        description: cleanDesc,
        sku: cleanSku || null,
        cost: costNum,
        price: values.isForSale ? priceNum : null,
        is_for_sale: values.isForSale,
        qty_on_hand: qtyNum,

        category_id: values.categoryId || null,
        subcategory_id: values.subcategoryId || null,
        device_model_id: values.deviceModelId || null,
        variant_id: values.variantId || null,
        condition_id: values.conditionId || null,
        status_id: values.statusId || null,
        source_id: values.sourceId || null,
      });

      resetForm();
      await loadProducts();
    } catch (e) {
      alert(e?.message || "Failed to add product.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    const ok = confirm("Delete this product?");
    if (!ok) return;

    try {
      await deleteProduct(id);
      await loadProducts();
    } catch (e) {
      alert(e?.message || "Failed to delete product.");
    }
  }

  const getName = (row, key, nested) => row?.[key] ?? row?.[nested]?.name ?? "";

  const inventoryStats = useMemo(() => {
    const totalItems = rows.length;
    const totalQty = rows.reduce(
      (sum, r) => sum + Number(r.qty_on_hand || 0),
      0
    );
    const totalCostValue = rows.reduce(
      (sum, r) => sum + Number(r.cost || 0) * Number(r.qty_on_hand || 0),
      0
    );
    const totalRetailValue = rows.reduce(
      (sum, r) => sum + Number(r.price || 0) * Number(r.qty_on_hand || 0),
      0
    );

    return {
      totalItems,
      totalQty,
      totalCostValue,
      totalRetailValue,
    };
  }, [rows]);

  function money(n) {
    return Number(n || 0).toFixed(2);
  }

  function StatusBadge({ children, tone = "neutral" }) {
    let className = "inventory-badge";

    if (tone === "good") {
      className = "inventory-badge inventory-badge-good";
    } else if (tone === "warn") {
      className = "inventory-badge inventory-badge-warn";
    } else if (tone === "info") {
      className = "inventory-badge inventory-badge-info";
    }

    return <span className={className}>{children || "—"}</span>;
  }

  function onEdit(item) {
    setEditingItem(item);
  }

  function onCloseEdit() {
    setEditingItem(null);
  }

  async function onSaveEdit(payload) {
    try {
      setEditSaving(true);
      await updateProduct(payload.id, payload);
      setEditingItem(null);
      await loadProducts();
    } catch (e) {
      alert(e?.message || "Failed to update product.");
    } finally {
      setEditSaving(false);
    }
  }
  
  let tableContent;

if (loading) {
  tableContent = (
    <div className="empty-state">Loading inventory...</div>
  );
} else if (rows.length === 0) {
  tableContent = (
    <div className="empty-state">No products yet.</div>
  );
} else {
  tableContent = (
    <div className="table-wrap">
      <div className="table-wrap">
        <table className="app-table inventory-table">
          <thead>
            <tr>
              <th className="th-left inventory-th-sticky">Item</th>
              <th className="th-left inventory-th-sticky">Catalog</th>
              <th className="th-left inventory-th-sticky">
                Condition / Status
              </th>
              <th className="th-left inventory-th-sticky">Source</th>
              <th className="th-right inventory-th-sticky">Cost</th>
              <th className="th-right inventory-th-sticky">Price</th>
              <th className="th-right inventory-th-sticky">Qty</th>
              <th className="th-right inventory-th-sticky">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const categoryName = getName(r, "category_name", "category");
              const subcategoryName = getName(
                r,
                "subcategory_name",
                "subcategory"
              );
              const modelName = getName(r, "model_name", "model");
              const variantName = getName(r, "variant_name", "variant");
              const conditionName = getName(
                r,
                "condition_name",
                "condition"
              );
              const statusName = getName(r, "status_name", "status");
              const sourceName = getName(r, "source_name", "source");

              return (
                <tr key={r.id} className="tr">
                  <td className="td-top">
                    <div className="inventory-item-title">
                      {r.description ?? r.name ?? ""}
                    </div>
                    <div className="inventory-item-meta">
                      SKU: {r.sku || "—"}
                    </div>
                  </td>

                  <td className="td-top">
                    <div className="inventory-stack-text">
                      <div>
                        <strong>{categoryName || "—"}</strong>
                      </div>
                      <div className="small-muted">
                        {[subcategoryName, modelName, variantName]
                          .filter(Boolean)
                          .join(" / ") || "—"}
                      </div>
                    </div>
                  </td>

                  <td className="td-top">
                    <div className="inventory-badge-row">
                      <StatusBadge tone="info">
                        {conditionName || "No condition"}
                      </StatusBadge>
                      <StatusBadge tone="good">
                        {statusName || "No status"}
                      </StatusBadge>
                    </div>
                  </td>

                  <td className="td-top">{sourceName || "—"}</td>

                  <td className="td-right">${money(r.cost)}</td>
                  <td className="td-right">
                    {r.price == null ? "—" : `$${money(r.price)}`}
                  </td>
                  <td className="td-right">
                    <span
                      className={
                        Number(r.qty_on_hand || 0) > 0
                          ? "inventory-qty-pill"
                          : "inventory-qty-pill-low"
                      }
                    >
                      {r.qty_on_hand ?? 0}
                    </span>
                  </td>
                  <td className="td-right">
                    <div className="action-row">
                      <button
                        type="button"
                        onClick={() => onEdit(r)}
                        className="button-secondary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
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
          <h2 className="page-title">Inventory</h2>
          <p className="page-subtitle">
            Add devices, parts, and repair stock with cleaner organization.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Products</div>
          <div className="stat-value">{inventoryStats.totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Units On Hand</div>
          <div className="stat-value">{inventoryStats.totalQty}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cost Value</div>
          <div className="stat-value">
            ${money(inventoryStats.totalCostValue)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Retail Value</div>
          <div className="stat-value">
            ${money(inventoryStats.totalRetailValue)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Add Inventory Item</h3>
            <p className="card-subtitle">
              Grouped by item details, catalog placement, and pricing.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="section-title">Item Details</div>
          <div className="form-grid">
            <div className="field-full">
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                {...register("description", {
                  required: "Description is required.",
                  validate: (value) =>
                    value.trim() !== "" || "Description is required.",
                })}
                rows={3}
                className="textarea"
                placeholder="Example: iPod Classic 5th Gen, tested, screen scratched, working HDD"
              />
              {errors.description && (
                <div
                  className="small-muted"
                  style={{ color: "var(--danger-color, #b42318)" }}
                >
                  {errors.description.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="sku" className="label">SKU</label>
              <input
                id="sku"
                {...register("sku")}
                className="input"
                placeholder="Optional internal SKU"
              />
            </div>

            <div>
              <label htmlFor="qty" className="label">Quantity</label>
              <input
                id="qty"
                {...register("qty", {
                  required: "Quantity is required.",
                  validate: (value) => {
                    if (value === "" || value == null)
                      return "Quantity is required.";
                    if (!/^\d+$/.test(String(value))) {
                      return "Qty must be a whole number ≥ 0.";
                    }
                    if (parseInt(value, 10) < 0) {
                      return "Qty must be a whole number ≥ 0.";
                    }
                    return true;
                  },
                })}
                className="input"
                placeholder="0"
                inputMode="numeric"
              />
              {errors.qty && (
                <div
                  className="small-muted"
                  style={{ color: "var(--danger-color, #b42318)" }}
                >
                  {errors.qty.message}
                </div>
              )}
            </div>
          </div>

          <div className="section-title">Catalog Placement</div>
          <div className="form-grid">
            <div>
              <label htmlFor="categoryId" className="label">Category</label>
              <select id="categoryId" {...register("categoryId")} className="select">
                <option value="">(none)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="subcategoryId" className="label">Subcategory</label>
              <select
                id="subcategoryId"
                {...register("subcategoryId")}
                className="select"
                disabled={!categoryId}
              >
                <option value="">(none)</option>
                {subcategories.map((sc) => (
                  <option key={sc.id} value={sc.id}>
                    {sc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deviceModelId" className="label">Model</label>
              <select
                id="deviceModelId"
                {...register("deviceModelId")}
                className="select"
                disabled={!categoryId}
              >
                <option value="">(none)</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="variantId" className="label">Variant</label>
              <select
                id="variantId"
                {...register("variantId")}
                className="select"
                disabled={!deviceModelId}
              >
                <option value="">(none)</option>
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="conditionId" className="label">Condition</label>
              <select id="conditionId" {...register("conditionId")} className="select">
                <option value="">(none)</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="statusId" className="label">Status</label>
              <select id="statusId" {...register("statusId")} className="select">
                <option value="">(none)</option>
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sourceId" className="label">Source</label>
              <select id="sourceId" {...register("sourceId")} className="select">
                <option value="">(none)</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="section-title">Pricing</div>
          <div className="form-grid">
            <div>
              <label htmlFor="cost" className="label">Cost</label>
              <input
                id="cost"
                {...register("cost", {
                  required: "Cost is required.",
                  validate: (value) => {
                    if (value === "" || value == null)
                      return "Cost is required.";
                    const num = Number(value);
                    if (Number.isNaN(num) || num < 0) {
                      return "Cost must be a valid number ≥ 0.";
                    }
                    return true;
                  },
                })}
                className="input"
                placeholder="0.00"
                inputMode="decimal"
              />
              {errors.cost && (
                <div
                  className="small-muted"
                  style={{ color: "var(--danger-color, #b42318)" }}
                >
                  {errors.cost.message}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="isForSale" className="label">Item Use</label>
              <select
                id="isForSale"
                className="select"
                {...register("isForSale", {
                  setValueAs: (value) => value === true || value === "true",
                })}
              >
                <option value="true">For Sale</option>
                <option value="false">Internal Use / Tool / Part</option>
              </select>
            </div>

            <div>
              <label htmlFor="price" className="label">Price</label>
              <input
                id="price"
                {...register("price", {
                  validate: (value) => {
                    if (!isForSale) {
                      if (value === "" || value == null) return true;
                      const num = Number(value);
                      if (Number.isNaN(num) || num < 0) {
                        return "Price must be blank or a valid number ≥ 0.";
                      }
                      return true;
                    }

                    if (value === "" || value == null) {
                      return "Price is required for sale items.";
                    }

                    const num = Number(value);
                    if (Number.isNaN(num) || num < 0) {
                      return "Price must be a valid number ≥ 0.";
                    }

                    return true;
                  },
                })}
                className="input"
                placeholder="0.00"
                inputMode="decimal"
              />
              {errors.price && (
                <div
                  className="small-muted"
                  style={{ color: "var(--danger-color, #b42318)" }}
                >
                  {errors.price.message}
                </div>
              )}
            </div>

            <div className="inventory-summary-box">
              <div className="inventory-summary-row">
                <span>Projected margin</span>
                <strong>${money(watchedPrice - watchedCost)}</strong>
              </div>
              <div className="inventory-summary-row">
                <span>Qty value</span>
                <strong>${money(watchedPrice * watchedQty)}</strong>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={resetForm}
              className="button-secondary"
              disabled={saving}
            >
              Clear
            </button>
            <button type="submit" className="button-primary" disabled={saving}>
              {saving ? "Saving..." : "Add Product"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Current Inventory</h3>
            <p className="card-subtitle">
              Review current stock, pricing, and catalog assignments.
            </p>
          </div>
          <div className="count-badge">
            {rows.length} item{rows.length === 1 ? "" : "s"}
          </div>
        </div>

        {tableContent}

      </div>
      <InventoryEditModal
        isOpen={!!editingItem}
        item={editingItem}
        saving={editSaving}
        onClose={onCloseEdit}
        onSave={onSaveEdit}
      />
    </div>
  );
}
