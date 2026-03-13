import { useEffect, useState } from "react";

import CatalogAccordionTable from "@/components/catalog/CatalogAccordionTable";
import LoadingCard from "@/components/ui/LoadingCard";
import PageHeader from "@/components/ui/PageHeader";

import { useAuth } from "../auth/useAuth";
import { db } from "../lib/db";

import "@/styles/catalog-manager.css"

export default function CatalogManager() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [models, setModels] = useState([]);
  const [variants, setVariants] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [sources, setSources] = useState([]);

  const [categoryId, setCategoryId] = useState("");
  const [subcategoryId, setSubcategoryId] = useState("");
  const [modelId, setModelId] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newVariant, setNewVariant] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newSource, setNewSource] = useState("");

  const [editingItem, setEditingItem] = useState(null);

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
      s
        .from("product_subcategories")
        .select("*")
        .eq("category_id", catId)
        .order("name")
    );

    setSubcategories(res.data || []);
  }

  async function loadModels(catId, subId) {
    if (!catId) {
      setModels([]);
      return;
    }

    const res = await db((s) => {
      let q = s
        .from("device_models")
        .select("*")
        .eq("category_id", catId)
        .order("name");
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
      s
        .from("device_model_variants")
        .select("*")
        .eq("device_model_id", mId)
        .order("name")
    );

    setVariants(res.data || []);
  }

  async function refreshTable(table) {
    switch (table) {
      case "product_categories":
      case "product_conditions":
      case "product_statuses":
      case "sources":
        await loadBase();
        break;
      case "product_subcategories":
        await loadSubcategories(categoryId);
        break;
      case "device_models":
        await loadModels(categoryId, subcategoryId);
        break;
      case "device_model_variants":
        await loadVariants(modelId);
        break;
      default:
        break;
    }
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

    await db((s) => s.from(table).insert(payload));
  }

  async function updateRow(table, id, payload) {
    await db((s) => s.from(table).update(payload).eq("id", id));
  }

  async function deleteRow(table, id) {
    await db((s) => s.from(table).delete().eq("id", id));
  }

  async function addCategory() {
    const v = newCategory.trim();
    if (!v) return;

    setSavingKey("add-category");
    try {
      await addRow("product_categories", { owner_id: user.id, name: v });
      setNewCategory("");
      await loadBase();
    } catch (e) {
      alert(e?.message || "Failed to add category.");
    } finally {
      setSavingKey("");
    }
  }

  async function addSubcategory() {
    const v = newSubcategory.trim();
    if (!v) return;
    if (!categoryId) return alert("Pick a category first.");

    setSavingKey("add-subcategory");
    try {
      await addRow("product_subcategories", {
        owner_id: user.id,
        category_id: categoryId,
        name: v,
      });
      setNewSubcategory("");
      await loadSubcategories(categoryId);
    } catch (e) {
      alert(e?.message || "Failed to add subcategory.");
    } finally {
      setSavingKey("");
    }
  }

  async function addModel() {
    const v = newModel.trim();
    if (!v) return;
    if (!categoryId) return alert("Pick a category first.");

    setSavingKey("add-model");
    try {
      await addRow("device_models", {
        owner_id: user.id,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        name: v,
      });
      setNewModel("");
      await loadModels(categoryId, subcategoryId);
    } catch (e) {
      alert(e?.message || "Failed to add model.");
    } finally {
      setSavingKey("");
    }
  }

  async function addVariant() {
    const v = newVariant.trim();
    if (!v) return;
    if (!modelId) return alert("Pick a model first.");

    setSavingKey("add-variant");
    try {
      await addRow("device_model_variants", {
        owner_id: user.id,
        device_model_id: modelId,
        name: v,
      });
      setNewVariant("");
      await loadVariants(modelId);
    } catch (e) {
      alert(e?.message || "Failed to add variant.");
    } finally {
      setSavingKey("");
    }
  }

  async function addSimple(table, value, setter, reloadFn, savingName) {
    const v = value.trim();
    if (!v) return;

    setSavingKey(savingName);
    try {
      await addRow(table, { owner_id: user.id, name: v });
      setter("");
      await reloadFn();
    } catch (e) {
      alert(e?.message || "Failed to add item.");
    } finally {
      setSavingKey("");
    }
  }

  function beginEdit(table, item) {
    setEditingItem({
      table,
      id: item.id,
      value: item.name || "",
    });
  }

  function cancelEdit() {
    setEditingItem(null);
  }

  async function saveEdit() {
    if (!editingItem) return;

    const value = editingItem.value.trim();
    if (!value) {
      alert("Name cannot be blank.");
      return;
    }

    setSavingKey(`edit-${editingItem.table}-${editingItem.id}`);
    try {
      await updateRow(editingItem.table, editingItem.id, { name: value });
      await refreshTable(editingItem.table);
      setEditingItem(null);
    } catch (e) {
      alert(e?.message || "Failed to save changes.");
    } finally {
      setSavingKey("");
    }
  }

  async function handleDelete(table, item, options = {}) {
    const message =
      options.confirmMessage || `Delete "${item.name}"? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setSavingKey(`delete-${table}-${item.id}`);
    try {
      await deleteRow(table, item.id);

      if (table === "product_categories" && categoryId === item.id) {
        setCategoryId("");
        setSubcategoryId("");
        setModelId("");
        setSubcategories([]);
        setModels([]);
        setVariants([]);
      }

      if (table === "product_subcategories" && subcategoryId === item.id) {
        setSubcategoryId("");
        setModelId("");
        setModels([]);
        setVariants([]);
      }

      if (table === "device_models" && modelId === item.id) {
        setModelId("");
        setVariants([]);
      }

      await refreshTable(table);
    } catch (e) {
      alert(e?.message || "Failed to delete item.");
    } finally {
      setSavingKey("");
    }
  }

  function findCategoryName(id) {
    return categories.find((x) => x.id === id)?.name || "—";
  }

  function findSubcategoryName(id) {
    return subcategories.find((x) => x.id === id)?.name || "—";
  }

  function findModelName(id) {
    return models.find((x) => x.id === id)?.name || "—";
  }

  let content;

  if (loading) {
    content = <LoadingCard>Loading catalog data...</LoadingCard>;
  } else {
    content = (
      <div className="catalog-grid">
        <div className="card">
          <div className="card-header card-header-panel">
            <h3 className="card-title">Category Selection</h3>
          </div>

          <label htmlFor="category-select" className="label">
            Category
          </label>
          <select
            id="category-select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="select"
          >
            <option value="">(select category)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label
            htmlFor="subcategory-select"
            className="label catalog-label-spaced"
          >
            Subcategory Filter
          </label>
          <select
            id="subcategory-select"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className="select"
            disabled={!categoryId}
          >
            <option value="">(all / none)</option>
            {subcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <label htmlFor="model-select" className="label catalog-label-spaced">
            Model
          </label>
          <select
            id="model-select"
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="select"
            disabled={!categoryId}
          >
            <option value="">(select model)</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <CatalogAccordionTable
          title="Categories"
          table="product_categories"
          items={categories}
          newValue={newCategory}
          setNewValue={setNewCategory}
          onAdd={addCategory}
          placeholder="Add category"
          emptyText="No categories yet."
          defaultOpen={true}
          columns={[{ key: "name", label: "Name" }]}
          getRowCells={(item) => [{ content: item.name || "—" }]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
          deleteConfirmMessage={(item) =>
            `Delete category "${item.name}"? Make sure no subcategories or models still depend on it.`
          }
        />

        <CatalogAccordionTable
          title="Subcategories"
          table="product_subcategories"
          items={subcategories}
          newValue={newSubcategory}
          setNewValue={setNewSubcategory}
          onAdd={addSubcategory}
          addDisabled={!categoryId}
          placeholder="Add subcategory"
          emptyText={
            categoryId
              ? "No subcategories for this category yet."
              : "Select a category first."
          }
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
          ]}
          getRowCells={(item) => [
            { content: item.name || "—" },
            { content: findCategoryName(item.category_id) },
          ]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
          deleteConfirmMessage={(item) =>
            `Delete subcategory "${item.name}"? Related models may still reference it.`
          }
        />

        <CatalogAccordionTable
          title="Models"
          table="device_models"
          items={models}
          newValue={newModel}
          setNewValue={setNewModel}
          onAdd={addModel}
          addDisabled={!categoryId}
          placeholder="Add model"
          emptyText={
            categoryId ? "No models found." : "Select a category first."
          }
          columns={[
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "subcategory", label: "Subcategory" },
          ]}
          getRowCells={(item) => [
            { content: item.name || "—" },
            { content: findCategoryName(item.category_id) },
            { content: findSubcategoryName(item.subcategory_id) },
          ]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
          deleteConfirmMessage={(item) =>
            `Delete model "${item.name}"? Variants under it may also be affected.`
          }
        />

        <CatalogAccordionTable
          title="Variants"
          table="device_model_variants"
          items={variants}
          newValue={newVariant}
          setNewValue={setNewVariant}
          onAdd={addVariant}
          addDisabled={!modelId}
          placeholder="Add variant (e.g. 30GB, 64GB, Rev A)"
          emptyText={
            modelId
              ? "No variants for this model yet."
              : "Select a model first."
          }
          columns={[
            { key: "name", label: "Name" },
            { key: "model", label: "Model" },
          ]}
          getRowCells={(item) => [
            { content: item.name || "—" },
            { content: findModelName(item.device_model_id) },
          ]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
        />

        <CatalogAccordionTable
          title="Conditions"
          table="product_conditions"
          items={conditions}
          newValue={newCondition}
          setNewValue={setNewCondition}
          onAdd={() =>
            addSimple(
              "product_conditions",
              newCondition,
              setNewCondition,
              loadBase,
              "add-condition"
            )
          }
          placeholder="Add condition"
          emptyText="No conditions yet."
          columns={[{ key: "name", label: "Name" }]}
          getRowCells={(item) => [{ content: item.name || "—" }]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
        />

        <CatalogAccordionTable
          title="Statuses"
          table="product_statuses"
          items={statuses}
          newValue={newStatus}
          setNewValue={setNewStatus}
          onAdd={() =>
            addSimple(
              "product_statuses",
              newStatus,
              setNewStatus,
              loadBase,
              "add-status"
            )
          }
          placeholder="Add status"
          emptyText="No statuses yet."
          columns={[{ key: "name", label: "Name" }]}
          getRowCells={(item) => [{ content: item.name || "—" }]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
        />

        <CatalogAccordionTable
          title="Sources"
          table="sources"
          items={sources}
          newValue={newSource}
          setNewValue={setNewSource}
          onAdd={() =>
            addSimple(
              "sources",
              newSource,
              setNewSource,
              loadBase,
              "add-source"
            )
          }
          placeholder="Add source"
          emptyText="No sources yet."
          columns={[{ key: "name", label: "Name" }]}
          getRowCells={(item) => [{ content: item.name || "—" }]}
          editingItem={editingItem}
          setEditingItem={setEditingItem}
          savingKey={savingKey}
          onBeginEdit={beginEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEdit}
          onDelete={handleDelete}
        />
      </div>
    );
  }

  return (
    <div className="page catalog-page">
      <PageHeader
        title="Catalog Manager"
        subtitle="Manage categories, models, variants, conditions, statuses, and sources."
      />

      {content}
    </div>
  );
}