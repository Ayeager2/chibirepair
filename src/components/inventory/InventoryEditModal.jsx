import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import {
  listCategories,
  listConditions,
  listSources,
  listStatuses,
  listSubcategories,
} from "@/data/lookups";

import FieldError from "../ui/FieldError";

const defaultValues = {
  itemType: "part",
  description: "",
  sku: "",
  deviceLabel: "",
  unitCost: "0",
  askingPrice: "",
  qty: "1",
  categoryId: "",
  subcategoryId: "",
  conditionId: "",
  statusId: "",
  sourceId: "",
  isForSale: true,
  notes: "",
};

function money(n) {
  return Number(n || 0).toFixed(2);
}

export default function InventoryEditModal({ isOpen, item, saving = false, onClose, onSave }) {
  const [loadingLookups, setLoadingLookups] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
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
  const isForSale = watch("isForSale");
  const unitCost = watch("unitCost");
  const askingPrice = watch("askingPrice");
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
      itemType: item.item_type || "part",
      description: item.description || "",
      sku: item.sku || "",
      deviceLabel: item.device_label || "",
      unitCost: item.unit_cost != null ? String(item.unit_cost) : "0",
      askingPrice: item.asking_price != null ? String(item.asking_price) : "",
      qty: item.qty_on_hand != null ? String(item.qty_on_hand) : "1",
      categoryId: item.category_id || "",
      subcategoryId: item.subcategory_id || "",
      conditionId: item.condition_id || "",
      statusId: item.status_id || "",
      sourceId: item.source_id || "",
      isForSale: item.is_for_sale ?? item.asking_price != null,
      notes: item.notes || "",
    };

    reset(nextValues);
  }, [isOpen, item, reset]);

  useEffect(() => {
    if (!isOpen) return;

    (async () => {
      try {
        if (!categoryId) {
          setSubcategories([]);
          setValue("subcategoryId", "");
          return;
        }

        const subs = await listSubcategories(categoryId);
        setSubcategories(subs || []);
      } catch (e) {
        alert(e?.message || "Failed to load subcategories.");
      }
    })();
  }, [isOpen, categoryId, setValue]);

  async function submit(values) {
    if (!item?.id) {
      alert("Missing inventory item id.");
      return;
    }

    const cleanDesc = values.description.trim();
    const cleanSku = values.sku.trim();
    const cleanDeviceLabel = values.deviceLabel.trim();
    const cleanNotes = values.notes.trim();

    const unitCostNum = Number(values.unitCost);
    const askingPriceNum =
      values.askingPrice === "" || values.askingPrice == null ? null : Number(values.askingPrice);
    const qtyNum = parseInt(values.qty, 10);

    if (!cleanDesc) {
      alert("Description is required.");
      return;
    }

    if (Number.isNaN(unitCostNum) || unitCostNum < 0) {
      alert("Cost must be a valid number ≥ 0.");
      return;
    }

    if (Number.isNaN(qtyNum) || qtyNum < 0) {
      alert("Quantity must be a whole number ≥ 0.");
      return;
    }

    if (values.isForSale) {
      if (askingPriceNum == null || Number.isNaN(askingPriceNum) || askingPriceNum < 0) {
        alert("Asking price must be a valid number ≥ 0 for sale items.");
        return;
      }

      if (askingPriceNum < unitCostNum) {
        const ok = confirm("Asking price is lower than cost. Continue?");
        if (!ok) return;
      }
    }

    await onSave({
      id: item.id,
      item_type: values.itemType || "part",
      description: cleanDesc,
      sku: cleanSku || null,
      device_label: cleanDeviceLabel || null,
      unit_cost: unitCostNum,
      asking_price: values.isForSale ? askingPriceNum : null,
      is_for_sale: values.isForSale,
      quantity: qtyNum,
      qty_on_hand: qtyNum,
      category_id: values.categoryId || null,
      subcategory_id: values.subcategoryId || null,
      condition_id: values.conditionId || null,
      status_id: values.statusId || null,
      source_id: values.sourceId || null,
      notes: cleanNotes || null,
    });
  }

  const watchedCost = Number(unitCost || 0);
  const watchedPrice = Number(askingPrice || 0);
  const watchedQty = Number(qty || 0);

  if (!isOpen || !item?.id) return null;

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
              Update inventory details, stock values, classification, and pricing.
            </p>
          </div>
        </div>

        {loadingLookups ? (
          <div className="empty-state">Loading editor...</div>
        ) : (
          <form onSubmit={handleSubmit(submit)}>
            <div className="section-title">Item Details</div>

            <div className="form-grid">
              <div>
                <label className="label" htmlFor="itemType">
                  Item Type
                </label>
                <select id="itemType" {...register("itemType")} className="select">
                  <option value="donor_device">Donor Device</option>
                  <option value="part">Part</option>
                  <option value="finished_product">Finished Product</option>
                  <option value="supply">Supply</option>
                  <option value="tool">Tool</option>
                  <option value="accessory">Accessory</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="deviceLabel">
                  Device Label
                </label>
                <input
                  id="deviceLabel"
                  {...register("deviceLabel")}
                  className="input"
                  placeholder="Optional device label"
                />
              </div>

              <div>
                <label className="label" htmlFor="sku">
                  SKU
                </label>
                <input id="sku" {...register("sku")} className="input" />
              </div>

              <div>
                <label className="label" htmlFor="qty">
                  Quantity
                </label>
                <input
                  id="qty"
                  {...register("qty", {
                    required: "Quantity is required.",
                    validate: (value) => {
                      if (value === "" || value == null) return "Quantity is required.";
                      if (!/^\d+$/.test(String(value))) {
                        return "Quantity must be a whole number ≥ 0.";
                      }
                      if (parseInt(value, 10) < 0) {
                        return "Quantity must be a whole number ≥ 0.";
                      }
                      return true;
                    },
                  })}
                  className="input"
                  inputMode="numeric"
                />
                <FieldError error={errors.qty?.message} />
              </div>

              <div className="field-full">
                <label className="label" htmlFor="description">
                  Description
                </label>
                <textarea
                  id="description"
                  {...register("description", {
                    required: "Description is required.",
                    validate: (value) => value.trim() !== "" || "Description is required.",
                  })}
                  rows={3}
                  className="textarea"
                />
                <FieldError error={errors.description?.message} />
              </div>

              <div className="field-full">
                <label className="label" htmlFor="notes">
                  Notes
                </label>
                <textarea
                  id="notes"
                  {...register("notes")}
                  rows={3}
                  className="textarea"
                  placeholder="Condition notes, testing notes, source details, repair notes, etc."
                />
              </div>
            </div>

            <div className="section-title">Catalog Placement</div>

            <div className="form-grid">
              <div>
                <label className="label" htmlFor="categoryId">
                  Category
                </label>
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
                <label className="label" htmlFor="subcategoryId">
                  Subcategory
                </label>
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
                <label className="label" htmlFor="conditionId">
                  Condition
                </label>
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
                <label className="label" htmlFor="statusId">
                  Status
                </label>
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
                <label className="label" htmlFor="sourceId">
                  Source
                </label>
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
                <label className="label" htmlFor="unitCost">
                  Cost
                </label>
                <input
                  id="unitCost"
                  {...register("unitCost", {
                    required: "Cost is required.",
                    validate: (value) => {
                      if (value === "" || value == null) return "Cost is required.";
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
                <FieldError error={errors.unitCost?.message} />
              </div>

              <div>
                <label className="label" htmlFor="isForSale">
                  Item Use
                </label>
                <select
                  id="isForSale"
                  className="select"
                  {...register("isForSale", {
                    setValueAs: (value) => value === true || value === "true",
                  })}
                >
                  <option value="true">For Sale</option>
                  <option value="false">Internal Use / Non-Sale</option>
                </select>
              </div>

              <div>
                <label className="label" htmlFor="askingPrice">
                  Asking Price
                </label>
                <input
                  id="askingPrice"
                  {...register("askingPrice", {
                    validate: (value) => {
                      if (!isForSale) {
                        if (value === "" || value == null) return true;
                        const num = Number(value);
                        if (Number.isNaN(num) || num < 0) {
                          return "Asking price must be blank or a valid number ≥ 0.";
                        }
                        return true;
                      }

                      if (value === "" || value == null) {
                        return "Asking price is required for sale items.";
                      }

                      const num = Number(value);
                      if (Number.isNaN(num) || num < 0) {
                        return "Asking price must be a valid number ≥ 0.";
                      }

                      return true;
                    },
                  })}
                  className="input"
                  inputMode="decimal"
                />
                <FieldError error={errors.askingPrice?.message} />
              </div>

              <div className="inventory-summary-box">
                <div className="inventory-summary-row">
                  <span>Projected Margin</span>
                  <strong>${money(watchedPrice - watchedCost)}</strong>
                </div>
                <div className="inventory-summary-row">
                  <span>Qty Value</span>
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
              <button type="submit" className="button-primary" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
