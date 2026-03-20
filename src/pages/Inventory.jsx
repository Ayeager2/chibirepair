import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import "../styles/inventory.css";
import InventoryEditModal from "@/components/inventory/InventoryEditModal";
import PageHeader from "@/components/ui/PageHeader";
import LoadingCard from "@/components/ui/LoadingCard";
import EmptyState from "@/components/ui/EmptyState";
import FieldError from "@/components/ui/FieldError";
import InventoryTable from "@/components/inventory/InventoryTable";

import {
  listCategories,
  listSubcategories,
  listConditions,
  listStatuses,
  listSources,
} from "../data/lookups";
import { useAuth } from "../auth/useAuth";
import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
} from "../data/inventory";

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

function getName(row, key, nested) {
  return row?.[key] ?? row?.[nested]?.name ?? "";
}

export default function Inventory() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [editSaving, setEditSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("description");
  const [sortDirection, setSortDirection] = useState("asc");

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

  const watchedCost = Number(unitCost || 0);
  const watchedPrice = Number(askingPrice || 0);
  const watchedQty = Number(qty || 0);

  async function loadInventoryData() {
    setLoading(true);
    try {
      const data = await listInventory();
      setRows(data || []);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to load inventory.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await loadInventoryData();

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
          setValue("subcategoryId", "");
          return;
        }

        const subs = await listSubcategories(categoryId);
        setSubcategories(subs || []);
        setValue("subcategoryId", "");
      } catch (e) {
        alert(e?.message || "Failed to load subcategories.");
      }
    })();
  }, [categoryId, setValue]);

  function resetForm() {
    reset(defaultValues);
    setSubcategories([]);
  }

  async function onSubmit(values) {
    if (!user?.id) {
      alert("Not logged in.");
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

    try {
      setSaving(true);

      await createInventoryItem({
        owner_id: user.id,
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

      resetForm();
      await loadInventoryData();
    } catch (e) {
      alert(e?.message || "Failed to add inventory item.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    const ok = confirm("Delete this inventory item?");
    if (!ok) return;

    try {
      await deleteInventoryItem(id);
      await loadInventoryData();
    } catch (e) {
      alert(e?.message || "Failed to delete inventory item.");
    }
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
      await updateInventoryItem(payload.id, payload);
      setEditingItem(null);
      await loadInventoryData();
    } catch (e) {
      alert(e?.message || "Failed to update inventory item.");
    } finally {
      setEditSaving(false);
    }
  }

  function toggleSort(column) {
    if (sortBy === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(column);
    setSortDirection("asc");
  }

  const inventoryStats = useMemo(() => {
    const totalItems = rows.length;
    const totalQty = rows.reduce((sum, r) => sum + Number(r.qty_on_hand || 0), 0);
    const totalCostValue = rows.reduce(
      (sum, r) => sum + Number(r.unit_cost || 0) * Number(r.qty_on_hand || 0),
      0
    );
    const totalRetailValue = rows.reduce(
      (sum, r) => sum + Number(r.asking_price || 0) * Number(r.qty_on_hand || 0),
      0
    );

    return {
      totalItems,
      totalQty,
      totalCostValue,
      totalRetailValue,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return rows.filter((r) => {
      const categoryName = getName(r, "category_name", "category");
      const subcategoryName = getName(r, "subcategory_name", "subcategory");
      const conditionName = getName(r, "condition_name", "condition");
      const statusName = getName(r, "status_name", "status");
      const sourceName = getName(r, "source_name", "source");

      const searchableText = [
        r.description,
        r.sku,
        r.device_label,
        r.item_type,
        categoryName,
        subcategoryName,
        conditionName,
        statusName,
        sourceName,
        r.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !term || searchableText.includes(term);
      const matchesStatus = !statusFilter || String(r.status_id || "") === statusFilter;
      const matchesStock = !inStockOnly || Number(r.qty_on_hand || 0) > 0;
      const matchesSource = !sourceFilter || String(r.source_id || "") === sourceFilter;
      const matchesCondition = !conditionFilter || String(r.condition_id || "") === conditionFilter;

      return matchesSearch && matchesStatus && matchesSource && matchesCondition && matchesStock;
    });
  }, [rows, searchTerm, statusFilter, inStockOnly, sourceFilter, conditionFilter]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows];

    sorted.sort((a, b) => {
      const getSortableValue = (row) => {
        switch (sortBy) {
          case "description":
            return String(row.description ?? "").toLowerCase();
          case "itemType":
            return String(row.item_type ?? "").toLowerCase();
          case "source":
            return String(getName(row, "source_name", "source") || "").toLowerCase();
          case "condition":
            return String(getName(row, "condition_name", "condition") || "").toLowerCase();
          case "status":
            return String(getName(row, "status_name", "status") || "").toLowerCase();
          case "cost":
            return Number(row.unit_cost || 0);
          case "price":
            return Number(row.asking_price || 0);
          case "qty":
            return Number(row.qty_on_hand || 0);
          default:
            return String(row.description ?? "").toLowerCase();
        }
      };

      const aValue = getSortableValue(a);
      const bValue = getSortableValue(b);

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [filteredRows, sortBy, sortDirection]);

  let tableContent;

  if (loading) {
    tableContent = <LoadingCard message="Loading inventory..." />;
  } else if (rows.length === 0) {
    tableContent = (
      <EmptyState
        title="No inventory yet"
        message="Add your first inventory item to start tracking devices, parts, costs, and stock."
      />
    );
  } else {
    tableContent = (
      <InventoryTable
        rows={sortedRows}
        statuses={statuses}
        sources={sources}
        conditions={conditions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        conditionFilter={conditionFilter}
        setConditionFilter={setConditionFilter}
        inStockOnly={inStockOnly}
        setInStockOnly={setInStockOnly}
        onClearFilters={() => {
          setSearchTerm("");
          setStatusFilter("");
          setSourceFilter("");
          setConditionFilter("");
          setInStockOnly(false);
        }}
        sortBy={sortBy}
        sortDirection={sortDirection}
        toggleSort={toggleSort}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  const rowItemLabel = rows.length === 1 ? "item" : "items";
  const sortedMatchLabel = sortedRows.length === 1 ? "match" : "matches";

  const inventoryCountLabel =
    sortedRows.length === rows.length
      ? `${rows.length} ${rowItemLabel}`
      : `${sortedRows.length} ${sortedMatchLabel} of ${rows.length}`;

  return (
    <div className="page">
      <PageHeader
        title="Inventory"
        subtitle="Add devices, parts, finished products, and repair stock."
      />

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Items</div>
          <div className="stat-value">{inventoryStats.totalItems}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Units On Hand</div>
          <div className="stat-value">{inventoryStats.totalQty}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cost Value</div>
          <div className="stat-value">${money(inventoryStats.totalCostValue)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Retail Value</div>
          <div className="stat-value">${money(inventoryStats.totalRetailValue)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Add Inventory Item</h3>
            <p className="card-subtitle">
              Capture inventory details, classification, pricing, and stock in one place.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="section-title">Item Details</div>

          <div className="form-grid">
            <div>
              <label htmlFor="itemType" className="label">
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
              <label htmlFor="deviceLabel" className="label">
                Device Label
              </label>
              <input
                id="deviceLabel"
                {...register("deviceLabel")}
                className="input"
                placeholder="Optional label like DONOR-001"
              />
            </div>

            <div>
              <label htmlFor="sku" className="label">
                SKU
              </label>
              <input
                id="sku"
                {...register("sku")}
                className="input"
                placeholder="Optional internal SKU"
              />
            </div>

            <div>
              <label htmlFor="qty" className="label">
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
                placeholder="1"
                inputMode="numeric"
              />
              <FieldError error={errors.qty?.message} />
            </div>

            <div className="field-full">
              <label htmlFor="description" className="label">
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
                placeholder="Example: iPod Classic 5th Gen, tested, scratched faceplate, working HDD"
              />
              <FieldError error={errors.description?.message} />
            </div>

            <div className="field-full">
              <label htmlFor="notes" className="label">
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
              <label htmlFor="categoryId" className="label">
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
              <label htmlFor="subcategoryId" className="label">
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
              <label htmlFor="conditionId" className="label">
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
              <label htmlFor="statusId" className="label">
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
              <label htmlFor="sourceId" className="label">
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
              <label htmlFor="unitCost" className="label">
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
                placeholder="0.00"
                inputMode="decimal"
              />
              <FieldError error={errors.unitCost?.message} />
            </div>

            <div>
              <label htmlFor="isForSale" className="label">
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
              <label htmlFor="askingPrice" className="label">
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
                placeholder="0.00"
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
              onClick={resetForm}
              className="button-secondary"
              disabled={saving}
            >
              Clear
            </button>
            <button type="submit" className="button-primary" disabled={saving}>
              {saving ? "Saving..." : "Add Inventory Item"}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div>
            <h3 className="card-title">Current Inventory</h3>
            <p className="card-subtitle">
              Review stock, pricing, category placement, and source information.
            </p>
          </div>
          <div className="count-badge">{inventoryCountLabel}</div>
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
