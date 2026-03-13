import { useEffect, useState } from "react";

import CatalogAccordionTable from "@/components/catalog/CatalogAccordionTable";
import LoadingCard from "@/components/ui/LoadingCard";
import PageHeader from "@/components/ui/PageHeader";
import CatalogFilterPanel from "@/components/catalog/CatalogFilterPanel";

import { useAuth } from "../auth/useAuth";
import { db } from "../lib/db";

import "@/styles/catalog-manager.css";

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
  const [allSubcategories, setAllSubcategories] = useState([]);

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
    const [cats, allSubs, conds, stats, srcs] = await Promise.all([
      db((s) => s.from("product_categories").select("*").order("name")),
      db((s) => s.from("product_subcategories").select("*").order("name")),
      db((s) => s.from("product_conditions").select("*").order("name")),
      db((s) => s.from("product_statuses").select("*").order("name")),
      db((s) => s.from("sources").select("*").order("name")),
    ]);

    setCategories(cats.data || []);
    setAllSubcategories(allSubs.data || []);
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
    const value = newCategory.trim();
    if (!value) return;

    setSavingKey("add-category");
    try {
      await addRow("product_categories", { owner_id: user.id, name: value });
      setNewCategory("");
      await loadBase();
    } catch (e) {
      alert(e?.message || "Failed to add category.");
    } finally {
      setSavingKey("");
    }
  }

  async function addSubcategory() {
    const value = newSubcategory.trim();
    if (!value) return;
    if (!categoryId) return alert("Pick a category first.");

    setSavingKey("add-subcategory");
    try {
      await addRow("product_subcategories", {
        owner_id: user.id,
        category_id: categoryId,
        name: value,
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
    const value = newModel.trim();
    if (!value) return;
    if (!categoryId) return alert("Pick a category first.");

    setSavingKey("add-model");
    try {
      await addRow("device_models", {
        owner_id: user.id,
        category_id: categoryId,
        subcategory_id: subcategoryId || null,
        name: value,
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
    const value = newVariant.trim();
    if (!value) return;
    if (!modelId) return alert("Pick a model first.");

    setSavingKey("add-variant");
    try {
      await addRow("device_model_variants", {
        owner_id: user.id,
        device_model_id: modelId,
        name: value,
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
    const trimmed = value.trim();
    if (!trimmed) return;

    setSavingKey(savingName);
    try {
      await addRow(table, { owner_id: user.id, name: trimmed });
      setter("");
      await reloadFn();
    } catch (e) {
      alert(e?.message || "Failed to add item.");
    } finally {
      setSavingKey("");
    }
  }

  function beginEdit(table, item) {
    if (table === "device_models") {
      setEditingItem({
        table,
        id: item.id,
        value: item.name || "",
        category_id: item.category_id || "",
        subcategory_id: item.subcategory_id || "",
      });
      return;
    }

    if (table === "product_subcategories") {
      setEditingItem({
        table,
        id: item.id,
        value: item.name || "",
        category_id: item.category_id || "",
      });
      return;
    }

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

    let payload = { name: value };

    if (editingItem.table === "device_models") {
      if (!editingItem.category_id) {
        alert("Category is required.");
        return;
      }

      const validSubcategoryIds = getModelEditSubcategories(editingItem.category_id).map(
        (x) => x.id
      );

      const normalizedSubcategoryId =
        editingItem.subcategory_id && validSubcategoryIds.includes(editingItem.subcategory_id)
          ? editingItem.subcategory_id
          : null;

      payload = {
        name: value,
        category_id: editingItem.category_id,
        subcategory_id: normalizedSubcategoryId,
      };
    }

    if (editingItem.table === "product_subcategories") {
      if (!editingItem.category_id) {
        alert("Category is required.");
        return;
      }

      payload = {
        name: value,
        category_id: editingItem.category_id,
      };
    }

    setSavingKey(`edit-${editingItem.table}-${editingItem.id}`);
    try {
      await updateRow(editingItem.table, editingItem.id, payload);
      await refreshTable(editingItem.table);
      await loadBase();
      setEditingItem(null);
    } catch (e) {
      alert(e?.message || "Failed to save changes.");
    } finally {
      setSavingKey("");
    }
  }

  function getErrorMessage(error) {
    if (!error) return "";
    if (typeof error === "string") return error;

    return error.message || error.error_description || error.details || error.hint || "";
  }

  function isLinkedRecordDeleteError(error) {
    const message = getErrorMessage(error).toLowerCase();

    return (
      message.includes("foreign key") ||
      message.includes("violates foreign key constraint") ||
      message.includes("update or delete on table") ||
      message.includes("is still referenced") ||
      message.includes("constraint") ||
      message.includes("dependent") ||
      message.includes("reference")
    );
  }

  function getFriendlyDeleteError(table, item, error) {
    const rawMessage = getErrorMessage(error);

    if (isLinkedRecordDeleteError(error)) {
      switch (table) {
        case "product_categories":
          return `Cannot delete category "${item?.name || ""}" because subcategories, models, or other linked records still depend on it. Remove or reassign those records first.`;

        case "product_subcategories":
          return `Cannot delete subcategory "${item?.name || ""}" because models or other linked records still depend on it. Remove or reassign those records first.`;

        case "device_models":
          return `Cannot delete model "${item?.name || ""}" because variants, inventory items, or other linked records still depend on it. Remove or reassign those records first.`;

        case "device_model_variants":
          return `Cannot delete variant "${item?.name || ""}" because inventory items or other linked records still depend on it. Remove or reassign those records first.`;

        case "product_conditions":
          return `Cannot delete condition "${item?.name || ""}" because products or other linked records still use it. Remove or reassign those records first.`;

        case "product_statuses":
          return `Cannot delete status "${item?.name || ""}" because products or other linked records still use it. Remove or reassign those records first.`;

        case "sources":
          return `Cannot delete source "${item?.name || ""}" because products, purchases, or other linked records still use it. Remove or reassign those records first.`;

        default:
          return "Cannot delete this item because other records still depend on it. Remove or reassign linked records first.";
      }
    }

    return rawMessage || "Failed to delete item.";
  }

  async function handleDelete(table, item, options = {}) {
    const message = options.confirmMessage || `Delete "${item.name}"? This cannot be undone.`;

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
      alert(getFriendlyDeleteError(table, item, e));
    } finally {
      setSavingKey("");
    }
  }

  function findCategoryName(id) {
    return categories.find((x) => x.id === id)?.name || "—";
  }

  function findSubcategoryName(id) {
    return allSubcategories.find((x) => x.id === id)?.name || "—";
  }

  function findModelName(id) {
    return models.find((x) => x.id === id)?.name || "—";
  }

  function getModelEditSubcategories(categoryId) {
    if (!categoryId) return [];
    return allSubcategories.filter((x) => x.category_id === categoryId);
  }

  function resetFilters() {
    setCategoryId("");
    setSubcategoryId("");
    setModelId("");
    setSubcategories([]);
    setModels([]);
    setVariants([]);
  }

  const sectionConfigs = [
    {
      title: "Categories",
      table: "product_categories",
      items: categories,
      newValue: newCategory,
      setNewValue: setNewCategory,
      onAdd: addCategory,
      placeholder: "Add category",
      emptyText: "No categories yet.",
      defaultOpen: true,
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      deleteConfirmMessage: (item) =>
        `Delete category "${item.name}"? Make sure no subcategories or models still depend on it.`,
      addSavingKey: "add-category",
    },
    {
      title: "Subcategories",
      table: "product_subcategories",
      addSavingKey: "add-subcategory",
      items: subcategories,
      newValue: newSubcategory,
      setNewValue: setNewSubcategory,
      onAdd: addSubcategory,
      addDisabled: !categoryId,
      placeholder: "Add subcategory",
      emptyText: categoryId
        ? "No subcategories for this category yet."
        : "Select a category first.",
      columns: [
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
      ],
      getRowCells: (item) => [
        { content: item.name || "—" },
        { content: findCategoryName(item.category_id) },
      ],
      renderEditCells: ({ editingItem, setEditingItem }) => (
        <>
          <td className="td-left">
            <input
              type="text"
              value={editingItem?.value || ""}
              onChange={(e) =>
                setEditingItem((prev) =>
                  prev
                    ? {
                        ...prev,
                        value: e.target.value,
                      }
                    : prev
                )
              }
              className="input"
            />
          </td>

          <td className="td-left">
            <select
              value={editingItem?.category_id || ""}
              onChange={(e) =>
                setEditingItem((prev) =>
                  prev
                    ? {
                        ...prev,
                        category_id: e.target.value,
                      }
                    : prev
                )
              }
              className="select"
            >
              <option value="">(select category)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </td>
        </>
      ),
      deleteConfirmMessage: (item) =>
        `Delete subcategory "${item.name}"? Related models may still reference it.`,
    },
    {
      title: "Models",
      table: "device_models",
      addSavingKey: "add-model",
      items: models,
      newValue: newModel,
      setNewValue: setNewModel,
      onAdd: addModel,
      addDisabled: !categoryId,
      placeholder: "Add model",
      emptyText: categoryId ? "No models found." : "Select a category first.",
      columns: [
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "subcategory", label: "Subcategory" },
      ],
      getRowCells: (item) => [
        { content: item.name || "—" },
        { content: findCategoryName(item.category_id) },
        { content: findSubcategoryName(item.subcategory_id) },
      ],
      renderEditCells: ({ editingItem, setEditingItem }) => {
        const editSubcategories = getModelEditSubcategories(editingItem?.category_id);

        return (
          <>
            <td className="td-left">
              <input
                type="text"
                value={editingItem?.value || ""}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev
                      ? {
                          ...prev,
                          value: e.target.value,
                        }
                      : prev
                  )
                }
                className="input"
              />
            </td>

            <td className="td-left">
              <select
                value={editingItem?.category_id || ""}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev
                      ? {
                          ...prev,
                          category_id: e.target.value,
                          subcategory_id: "",
                        }
                      : prev
                  )
                }
                className="select"
              >
                <option value="">(select category)</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </td>

            <td className="td-left">
              <select
                value={editingItem?.subcategory_id || ""}
                onChange={(e) =>
                  setEditingItem((prev) =>
                    prev
                      ? {
                          ...prev,
                          subcategory_id: e.target.value,
                        }
                      : prev
                  )
                }
                className="select"
                disabled={!editingItem?.category_id}
              >
                <option value="">(none)</option>
                {editSubcategories.map((subcategory) => (
                  <option key={subcategory.id} value={subcategory.id}>
                    {subcategory.name}
                  </option>
                ))}
              </select>
            </td>
          </>
        );
      },
      deleteConfirmMessage: (item) =>
        `Delete model "${item.name}"? Variants under it may also be affected.`,
    },
    {
      title: "Variants",
      table: "device_model_variants",
      items: variants,
      newValue: newVariant,
      setNewValue: setNewVariant,
      onAdd: addVariant,
      addDisabled: !modelId,
      placeholder: "Add variant (e.g. 30GB, 64GB, Rev A)",
      emptyText: modelId ? "No variants for this model yet." : "Select a model first.",
      columns: [
        { key: "name", label: "Name" },
        { key: "model", label: "Model" },
      ],
      getRowCells: (item) => [
        { content: item.name || "—" },
        { content: findModelName(item.device_model_id) },
      ],
      addSavingKey: "add-variant",
    },
    {
      title: "Conditions",
      table: "product_conditions",
      items: conditions,
      newValue: newCondition,
      setNewValue: setNewCondition,
      onAdd: () =>
        addSimple("product_conditions", newCondition, setNewCondition, loadBase, "add-condition"),
      placeholder: "Add condition",
      emptyText: "No conditions yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-condition",
    },
    {
      title: "Statuses",
      table: "product_statuses",
      items: statuses,
      newValue: newStatus,
      setNewValue: setNewStatus,
      onAdd: () => addSimple("product_statuses", newStatus, setNewStatus, loadBase, "add-status"),
      placeholder: "Add status",
      emptyText: "No statuses yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-status",
    },
    {
      title: "Sources",
      table: "sources",
      items: sources,
      newValue: newSource,
      setNewValue: setNewSource,
      onAdd: () => addSimple("sources", newSource, setNewSource, loadBase, "add-source"),
      placeholder: "Add source",
      emptyText: "No sources yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-source",
    },
  ];

  let content;

  if (loading) {
    content = <LoadingCard>Loading catalog data...</LoadingCard>;
  } else {
    content = (
      <div className="catalog-layout">
        <CatalogFilterPanel
          categories={categories}
          subcategories={subcategories}
          models={models}
          variants={variants}
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          modelId={modelId}
          onCategoryChange={setCategoryId}
          onSubcategoryChange={setSubcategoryId}
          onModelChange={setModelId}
          onResetFilters={resetFilters}
          selectedCategoryName={categoryId ? findCategoryName(categoryId) : "None selected"}
          selectedSubcategoryName={
            subcategoryId ? findSubcategoryName(subcategoryId) : "None selected"
          }
          selectedModelName={modelId ? findModelName(modelId) : "None selected"}
        />

        <section className="catalog-main">
          <div className="catalog-sections">
            {sectionConfigs.map((section) => (
              <CatalogAccordionTable
                key={section.table}
                title={section.title}
                table={section.table}
                items={section.items}
                newValue={section.newValue}
                setNewValue={section.setNewValue}
                onAdd={section.onAdd}
                addSavingKey={section.addSavingKey}
                addDisabled={section.addDisabled}
                placeholder={section.placeholder}
                emptyText={section.emptyText}
                defaultOpen={section.defaultOpen}
                columns={section.columns}
                getRowCells={section.getRowCells}
                renderEditCells={section.renderEditCells}
                editingItem={editingItem}
                setEditingItem={setEditingItem}
                savingKey={savingKey}
                onBeginEdit={beginEdit}
                onCancelEdit={cancelEdit}
                onSaveEdit={saveEdit}
                onDelete={handleDelete}
                deleteConfirmMessage={section.deleteConfirmMessage}
              />
            ))}
          </div>
        </section>
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
