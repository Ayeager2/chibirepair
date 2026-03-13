import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { listCategories, listConditions, listDeviceModels, listSources, listStatuses, listSubcategories, listVariants } from "@/data/lookups";


const defaultValues = {
  description: "",
  sku: "",
  cost: "0",
  price: "",
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

export default function InventoryEditModal({
  isOpen,
  item,
  saving = false,
  onClose,
  onSave,
}) {
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

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

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        setLoadingLookups(true);

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
      } finally {
        setLoadingLookups(false);
      }
    })();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !item) return;

    const nextValues = {
      description: item.description || "",
      sku: item.sku || "",
      cost: item.cost != null ? String(item.cost) : "0",
      price: item.price != null ? String(item.price) : "",
      qty: item.qty_on_hand != null ? String(item.qty_on_hand) : "0",

      categoryId: item.category_id || "",
      subcategoryId: item.subcategory_id || "",
      deviceModelId: item.device_model_id || "",
      variantId: item.variant_id || "",
      conditionId: item.condition_id || "",
      statusId: item.status_id || "",
      sourceId: item.source_id || "",

      isForSale: item.is_for_sale ?? item.price != null,
    };

    reset(nextValues);
  }, [isOpen, item, reset]);

  useEffect(() => {
    if (!isOpen) return;

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
      } catch (e) {
        alert(e?.message || "Failed to load subcategories/models.");
      }
    })();
  }, [isOpen, categoryId, setValue]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        if (!subcategoryId) {
          const mods = categoryId ? await listDeviceModels({ categoryId }) : [];
          setModels(mods || []);
          setVariants([]);
          return;
        }

        const mods = await listDeviceModels({ categoryId, subcategoryId });
        setModels(mods || []);
        setVariants([]);
      } catch (e) {
        alert(e?.message || "Failed to load models.");
      }
    })();
  }, [isOpen, subcategoryId, categoryId]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        if (!deviceModelId) {
          setVariants([]);
          return;
        }

        const v = await listVariants(deviceModelId);
        setVariants(v || []);
      } catch (e) {
        alert(e?.message || "Failed to load variants.");
      }
    })();
  }, [isOpen, deviceModelId]);

  async function submit(values) {
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

    await onSave({
      id: item.id,
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
  }

  function money(n) {
    return Number(n || 0).toFixed(2);
  }

  const watchedCost = Number(cost || 0);
  const watchedPrice = Number(price || 0);
  const watchedQty = Number(qty || 0);

  if (!isOpen || !item) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        zIndex: 1000,
      }}
    >
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: "950px",
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Edit Inventory Item</h3>
            <p className="card-subtitle">
              Update pricing, quantity, and catalog details.
            </p>
          </div>
        </div>

        {loadingLookups ? (
          <div className="empty-state">Loading editor...</div>
        ) : (
          <form onSubmit={handleSubmit(submit)}>
            <div className="section-title">Item Details</div>
            <div className="form-grid">
              <div className="field-full">
                <label className="label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  {...register("description", {
                    required: "Description is required.",
                    validate: (value) =>
                      value.trim() !== "" || "Description is required.",
                  })}
                  rows={3}
                  className="textarea"
                />
                {errors.description && (
                  <div className="small-muted" style={{ color: "#b42318" }}>
                    {errors.description.message}
                  </div>
                )}
              </div>

              <div>
                <label className="label" htmlFor="sku">SKU</label>
                <input id="sku" {...register("sku")} className="input" />
              </div>

              <div>
                <label className="label" htmlFor="qty">Quantity</label>
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
                      return true;
                    },
                  })}
                  className="input"
                  inputMode="numeric"
                />
                {errors.qty && (
                  <div className="small-muted" style={{ color: "#b42318" }}>
                    {errors.qty.message}
                  </div>
                )}
              </div>
            </div>

            <div className="section-title">Catalog Placement</div>
            <div className="form-grid">
              <div>
                <label className="label" htmlFor="categoryId">Category</label>
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
                <label className="label" htmlFor="subcategoryId">Subcategory</label>
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
                <label className="label" htmlFor="deviceModelId">Model</label>
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
                <label className="label" htmlFor="variantId">Variant</label>
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
                <label className="label" htmlFor="conditionId">Condition</label>
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
                <label className="label" htmlFor="statusId">Status</label>
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
                <label className="label" htmlFor="sourceId">Source</label>
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
                <label className="label" htmlFor="cost">Cost</label>
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
                  inputMode="decimal"
                />
                {errors.cost && (
                  <div className="small-muted" style={{ color: "#b42318" }}>
                    {errors.cost.message}
                  </div>
                )}
              </div>

              <div>
                <label className="label" htmlFor="isForSale">Item Use</label>
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
                <label className="label" htmlFor="price">Price</label>
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
                  inputMode="decimal"
                />
                {errors.price && (
                  <div className="small-muted" style={{ color: "#b42318" }}>
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
                onClick={onClose}
                className="button-secondary"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
