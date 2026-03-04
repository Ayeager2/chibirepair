// Inventory.jsx (drop-in changes only)

import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";

import { listProducts, createProduct, deleteProduct } from "../data/products";
import {
  listCategories,
  listSubcategories,
  listDeviceModels,
  listConditions,
  listStatuses,
  listSources,
  listVariants,
} from "../data/lookups";

export default function Inventory() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Product fields
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [qty, setQty] = useState("0");

  // Lookup option lists
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  // Selected lookup IDs
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [deviceModelId, setDeviceModelId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [conditionId, setConditionId] = useState("");
  const [statusId, setStatusId] = useState("");
  const [sourceId, setSourceId] = useState("");

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

          setSubcategoryId("");
          setDeviceModelId("");
          setVariantId("");
          return;
        }

        const [subs, mods] = await Promise.all([
          listSubcategories(categoryId),
          listDeviceModels({ categoryId }),
        ]);

        setSubcategories(subs || []);
        setModels(mods || []);

        setSubcategoryId("");
        setDeviceModelId("");
        setVariantId("");
        setVariants([]);
      } catch (e) {
        alert(e?.message || "Failed to load subcategories/models.");
      }
    })();
  }, [categoryId]);

  useEffect(() => {
    (async () => {
      try {
        if (!subcategoryId) {
          const mods = categoryId ? await listDeviceModels({ categoryId }) : [];
          setModels(mods || []);
          setDeviceModelId("");
          setVariantId("");
          setVariants([]);
          return;
        }

        const mods = await listDeviceModels({ categoryId, subcategoryId });
        setModels(mods || []);
        setDeviceModelId("");
        setVariantId("");
        setVariants([]);
      } catch (e) {
        alert(e?.message || "Failed to load models.");
      }
    })();
  }, [subcategoryId, categoryId]);

  useEffect(() => {
    (async () => {
      try {
        if (!deviceModelId) {
          setVariants([]);
          setVariantId("");
          return;
        }

        const v = await listVariants(deviceModelId);
        setVariants(v || []);
        setVariantId("");
      } catch (e) {
        alert(e?.message || "Failed to load variants.");
      }
    })();
  }, [deviceModelId]);

  function resetForm() {
    setDescription("");
    setSku("");
    setCost("0");
    setPrice("0");
    setQty("0");

    setCategoryId("");
    setSubcategoryId("");
    setDeviceModelId("");
    setVariantId("");
    setConditionId("");
    setStatusId("");
    setSourceId("");

    setSubcategories([]);
    setModels([]);
    setVariants([]);
  }

  async function addProduct(e) {
    e.preventDefault();

    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    const cleanDesc = description.trim();
    if (!cleanDesc) {
      alert("Description is required.");
      return;
    }

    const costNum = Number(cost);
    const priceNum = Number(price);
    const qtyNum = parseInt(qty, 10);

    if (Number.isNaN(costNum) || costNum < 0) return alert("Cost must be a valid number ≥ 0.");
    if (Number.isNaN(priceNum) || priceNum < 0) return alert("Price must be a valid number ≥ 0.");
    if (Number.isNaN(qtyNum) || qtyNum < 0) return alert("Qty must be a whole number ≥ 0.");

    // optional: warn on price < cost
    if (priceNum < costNum) {
      const ok = confirm("Price is lower than cost. Continue?");
      if (!ok) return;
    }

    try {
      await createProduct(user.id, {
        description: cleanDesc,
        sku: sku.trim() || null,
        cost: costNum,
        price: priceNum,
        qty_on_hand: qtyNum,

        category_id: categoryId || null,
        subcategory_id: subcategoryId || null,
        device_model_id: deviceModelId || null,
        variant_id: variantId || null,
        condition_id: conditionId || null,
        status_id: statusId || null,
        source_id: sourceId || null,
      });

      setDescription("");
      setSku("");
      setCost("0");
      setPrice("0");
      setQty("0");

      await loadProducts();
    } catch (e) {
      alert(e?.message || "Failed to add product.");
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

  return (
    <div style={{ maxWidth: 1100, margin: "20px auto", padding: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Inventory</h2>
      </div>

      <form
        onSubmit={addProduct}
        style={{
          display: "grid",
          gap: 8,
          gridTemplateColumns: "repeat(3, 1fr)",
          alignItems: "end",
        }}
      >
        <div style={{ gridColumn: "1 / span 3" }}>
          <label>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            required
            style={{ width: "100%" }}
          />
        </div>

        <div>
          <label>SKU</label>
          <input value={sku} onChange={(e) => setSku(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <label>Qty</label>
          <input value={qty} onChange={(e) => setQty(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <label>Cost</label>
          <input value={cost} onChange={(e) => setCost(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <label>Price</label>
          <input value={price} onChange={(e) => setPrice(e.target.value)} style={{ width: "100%" }} />
        </div>

        <div>
          <label>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: "100%" }}>
            <option value="">(none)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Subcategory</label>
          <select
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            style={{ width: "100%" }}
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
          <label>Model</label>
          <select
            value={deviceModelId}
            onChange={(e) => setDeviceModelId(e.target.value)}
            style={{ width: "100%" }}
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
          <label>Variant</label>
          <select
            value={variantId}
            onChange={(e) => setVariantId(e.target.value)}
            style={{ width: "100%" }}
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
          <label>Condition</label>
          <select value={conditionId} onChange={(e) => setConditionId(e.target.value)} style={{ width: "100%" }}>
            <option value="">(none)</option>
            {conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Status</label>
          <select value={statusId} onChange={(e) => setStatusId(e.target.value)} style={{ width: "100%" }}>
            <option value="">(none)</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Source</label>
          <select value={sourceId} onChange={(e) => setSourceId(e.target.value)} style={{ width: "100%" }}>
            <option value="">(none)</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button type="button" onClick={resetForm}>
            Clear
          </button>
          <button type="submit">Add Product</button>
        </div>
      </form>

      <hr style={{ margin: "16px 0" }} />

      {loading ? (
        <div>Loading...</div>
      ) : rows.length === 0 ? (
        <div>No products yet.</div>
      ) : (
        <table width="100%" cellPadding="8" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th align="left">Description</th>
              <th align="left">SKU</th>
              <th align="left">Category</th>
              <th align="left">Subcategory</th>
              <th align="left">Model</th>
              <th align="left">Variant</th>
              <th align="left">Condition</th>
              <th align="left">Status</th>
              <th align="left">Source</th>
              <th align="right">Cost</th>
              <th align="right">Price</th>
              <th align="right">Qty</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.description ?? r.name ?? ""}</td>
                <td>{r.sku || ""}</td>

                <td>{getName(r, "category_name", "category")}</td>
                <td>{getName(r, "subcategory_name", "subcategory")}</td>
                <td>{getName(r, "model_name", "model")}</td>
                <td>{getName(r, "variant_name", "variant")}</td>

                <td>{getName(r, "condition_name", "condition")}</td>
                <td>{getName(r, "status_name", "status")}</td>
                <td>{getName(r, "source_name", "source")}</td>

                <td align="right">{Number(r.cost || 0).toFixed(2)}</td>
                <td align="right">{Number(r.price || 0).toFixed(2)}</td>
                <td align="right">{r.qty_on_hand ?? 0}</td>
                <td align="right">
                  <button onClick={() => onDelete(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}