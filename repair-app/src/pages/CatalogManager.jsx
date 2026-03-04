import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { db } from "../lib/db";

export default function CatalogManager() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);

  // Base lists
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  // Selections
  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [modelId, setModelId] = useState("");

  // New values
  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newVariant, setNewVariant] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newSource, setNewSource] = useState("");

  async function loadBase() {
    const [cats, conds, stats, srcs] = await Promise.all([
      db((s) => s.from("product_categories").select("*").order("name")),
      db((s) => s.from("product_conditions").select("*").order("name")),
      db((s) => s.from("product_statuses").select("*").order("name")),
      db((s) => s.from("sources").select("*").order("name")),
    ]);

    setCategories(cats.data || []);
    setConditions(conds.data || []);
    setStatuses(stats.data || []);
    setSources(srcs.data || []);
  }

  async function loadSubcategories(catId) {
    if (!catId) {
      setSubcategories([]);
      return;
    }
    const res = await db((s) =>
      s.from("product_subcategories").select("*").eq("category_id", catId).order("name")
    );
    setSubcategories(res.data || []);
  }

  async function loadModels(catId, subId) {
    if (!catId) {
      setModels([]);
      return;
    }

    const res = await db((s) => {
      let q = s.from("device_models").select("*").eq("category_id", catId).order("name");
      if (subId) q = q.eq("subcategory_id", subId);
      return q;
    });

    setModels(res.data || []);
  }

  async function loadVariants(mId) {
    if (!mId) {
      setVariants([]);
      return;
    }
    const res = await db((s) =>
      s.from("device_model_variants").select("*").eq("device_model_id", mId).order("name")
    );
    setVariants(res.data || []);
  }

  useEffect(() => {
    (async () => {
      try {
        if (!user?.id) return;
        setLoading(true);
        await loadBase();
      } catch (e) {
        alert(e?.message || "Failed to load catalog data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // When category changes -> reload subcategories + models
  useEffect(() => {
    (async () => {
      try {
        setSubcategoryId("");
        setModelId("");
        setVariants([]);

        await loadSubcategories(categoryId);
        await loadModels(categoryId, "");
      } catch (e) {
        alert(e?.message || "Failed to load subcategories/models.");
      }
    })();
  }, [categoryId]);

  // When subcategory changes -> reload models
  useEffect(() => {
    (async () => {
      try {
        setModelId("");
        setVariants([]);
        await loadModels(categoryId, subcategoryId);
      } catch (e) {
        alert(e?.message || "Failed to load models.");
      }
    })();
  }, [subcategoryId, categoryId]);

  // When model changes -> reload variants
  useEffect(() => {
    (async () => {
      try {
        await loadVariants(modelId);
      } catch (e) {
        alert(e?.message || "Failed to load variants.");
      }
    })();
  }, [modelId]);

  async function addRow(table, payload) {
    if (!user?.id) {
      alert("Not logged in.");
      return;
    }
    const { error } = await db((s) => s.from(table).insert(payload));
    if (error) throw error;
  }

  async function addCategory() {
    const v = newCategory.trim();
    if (!v) return;
    await addRow("product_categories", { owner_id: user.id, name: v });
    setNewCategory("");
    await loadBase();
  }

  async function addSubcategory() {
    const v = newSubcategory.trim();
    if (!v) return;
    if (!categoryId) return alert("Pick a category first.");
    await addRow("product_subcategories", { owner_id: user.id, category_id: categoryId, name: v });
    setNewSubcategory("");
    await loadSubcategories(categoryId);
  }

  async function addModel() {
    const v = newModel.trim();
    if (!v) return;
    if (!categoryId) return alert("Pick a category first.");
    await addRow("device_models", {
      owner_id: user.id,
      category_id: categoryId,
      subcategory_id: subcategoryId || null,
      name: v,
    });
    setNewModel("");
    await loadModels(categoryId, subcategoryId);
  }

  async function addVariant() {
    const v = newVariant.trim();
    if (!v) return;
    if (!modelId) return alert("Pick a model first.");
    await addRow("device_model_variants", {
      owner_id: user.id,
      device_model_id: modelId,
      name: v,
    });
    setNewVariant("");
    await loadVariants(modelId);
  }

  async function addSimple(table, value, setter, reloadFn) {
    const v = value.trim();
    if (!v) return;
    await addRow(table, { owner_id: user.id, name: v });
    setter("");
    await reloadFn();
  }

  return (
    <div style={{ maxWidth: 1000, margin: "20px auto", padding: 12 }}>
      <h2>Catalog Manager</h2>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* Category */}
          <div style={{ marginBottom: 30 }}>
            <h3>Categories</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Add category" />
              <button onClick={addCategory}>Add</button>
            </div>

            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ width: "100%" }}>
              <option value="">(select category)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div style={{ marginBottom: 30 }}>
            <h3>Subcategories</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={newSubcategory}
                onChange={(e) => setNewSubcategory(e.target.value)}
                placeholder="Add subcategory"
                disabled={!categoryId}
              />
              <button onClick={addSubcategory} disabled={!categoryId}>
                Add
              </button>
            </div>

            <select
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              style={{ width: "100%" }}
              disabled={!categoryId}
            >
              <option value="">(all / none)</option>
              {subcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <ul>
              {subcategories.map((s) => (
                <li key={s.id}>{s.name}</li>
              ))}
            </ul>
          </div>

          {/* Models */}
          <div style={{ marginBottom: 30 }}>
            <h3>Models</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Add model"
                disabled={!categoryId}
              />
              <button onClick={addModel} disabled={!categoryId}>
                Add
              </button>
            </div>

            <select value={modelId} onChange={(e) => setModelId(e.target.value)} style={{ width: "100%" }} disabled={!categoryId}>
              <option value="">(select model)</option>
              {models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <ul>
              {models.map((m) => (
                <li key={m.id}>{m.name}</li>
              ))}
            </ul>
          </div>

          {/* Variants */}
          <div style={{ marginBottom: 30 }}>
            <h3>Variants</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input
                value={newVariant}
                onChange={(e) => setNewVariant(e.target.value)}
                placeholder="Add variant (e.g. 30GB)"
                disabled={!modelId}
              />
              <button onClick={addVariant} disabled={!modelId}>
                Add
              </button>
            </div>

            <ul>
              {variants.map((v) => (
                <li key={v.id}>{v.name}</li>
              ))}
            </ul>
          </div>

          {/* Simple lists */}
          <div style={{ marginBottom: 30 }}>
            <h3>Conditions</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newCondition} onChange={(e) => setNewCondition(e.target.value)} placeholder="Add condition" />
              <button onClick={() => addSimple("product_conditions", newCondition, setNewCondition, loadBase)}>Add</button>
            </div>
            <ul>{conditions.map((c) => <li key={c.id}>{c.name}</li>)}</ul>
          </div>

          <div style={{ marginBottom: 30 }}>
            <h3>Statuses</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newStatus} onChange={(e) => setNewStatus(e.target.value)} placeholder="Add status" />
              <button onClick={() => addSimple("product_statuses", newStatus, setNewStatus, loadBase)}>Add</button>
            </div>
            <ul>{statuses.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
          </div>

          <div style={{ marginBottom: 30 }}>
            <h3>Sources</h3>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newSource} onChange={(e) => setNewSource(e.target.value)} placeholder="Add source" />
              <button onClick={() => addSimple("sources", newSource, setNewSource, loadBase)}>Add</button>
            </div>
            <ul>{sources.map((s) => <li key={s.id}>{s.name}</li>)}</ul>
          </div>
        </>
      )}
    </div>
  );
}