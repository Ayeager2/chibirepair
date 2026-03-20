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
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [repairStatuses, setRepairStatuses] = useState([]);
  const [sources, setSources] = useState([]);
  const [vendors, setVendors] = useState([]);

  const [categoryId, setCategoryId] = useState("");

  const [newCategory, setNewCategory] = useState("");
  const [newSubcategory, setNewSubcategory] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newRepairStatus, setNewRepairStatus] = useState("");
  const [newSource, setNewSource] = useState("");
  const [newVendor, setNewVendor] = useState("");

  const [editingItem, setEditingItem] = useState(null);

  async function loadBase() {
    const [cats, allSubs, conds, stats, repairStats, srcs, vends] = await Promise.all([
      db((s) => s.from("inventory_categories").select("*").order("name")),
      db((s) => s.from("inventory_subcategories").select("*").order("name")),
      db((s) => s.from("item_conditions").select("*").order("name")),
      db((s) => s.from("item_statuses").select("*").order("name")),
      db((s) => s.from("repair_statuses").select("*").order("name")),
      db((s) => s.from("sources").select("*").order("name")),
      db((s) => s.from("vendors").select("*").order("name")),
    ]);

    setCategories(cats.data || []);
    setAllSubcategories(allSubs.data || []);
    setConditions(conds.data || []);
    setStatuses(stats.data || []);
    setRepairStatuses(repairStats.data || []);
    setSources(srcs.data || []);
    setVendors(vends.data || []);
  }

  async function loadSubcategories(catId) {
    if (!catId) {
      setSubcategories([]);
      return;
    }

    const res = await db((s) =>
      s.from("inventory_subcategories").select("*").eq("category_id", catId).order("name")
    );

    setSubcategories(res.data || []);
  }

  async function refreshTable(table) {
    switch (table) {
      case "inventory_categories":
      case "item_conditions":
      case "item_statuses":
      case "repair_statuses":
      case "sources":
      case "vendors":
        await loadBase();
        break;
      case "inventory_subcategories":
        await loadSubcategories(categoryId);
        await loadBase();
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
        await loadSubcategories(categoryId);
      } catch (e) {
        alert(e?.message || "Failed to load subcategories.");
      }
    })();
  }, [categoryId]);

  async function addRow(table, payload) {
    if (!user?.id) {
      alert("Not logged in.");
      return;
    }

    const { error } = await db((s) => s.from(table).insert(payload));
    if (error) throw error;
  }

  async function updateRow(table, id, payload) {
    const { error } = await db((s) => s.from(table).update(payload).eq("id", id));
    if (error) throw error;
  }

  async function deleteRow(table, id) {
    const { error } = await db((s) => s.from(table).delete().eq("id", id));
    if (error) throw error;
  }

  async function addCategory() {
    const value = newCategory.trim();
    if (!value) return;

    setSavingKey("add-category");
    try {
      await addRow("inventory_categories", { owner_id: user.id, name: value });
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
    if (!categoryId) {
      alert("Pick a category first.");
      return;
    }

    setSavingKey("add-subcategory");
    try {
      await addRow("inventory_subcategories", {
        owner_id: user.id,
        category_id: categoryId,
        name: value,
      });
      setNewSubcategory("");
      await loadSubcategories(categoryId);
      await loadBase();
    } catch (e) {
      alert(e?.message || "Failed to add subcategory.");
    } finally {
      setSavingKey("");
    }
  }

  async function addSimple(table, value, setter, reloadFn, savingName, extraPayload = {}) {
    const trimmed = value.trim();
    if (!trimmed) return;

    setSavingKey(savingName);
    try {
      await addRow(table, { owner_id: user.id, name: trimmed, ...extraPayload });
      setter("");
      await reloadFn();
    } catch (e) {
      alert(e?.message || "Failed to add item.");
    } finally {
      setSavingKey("");
    }
  }

  function beginEdit(table, item) {
    if (table === "inventory_subcategories") {
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

    if (editingItem.table === "inventory_subcategories") {
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
        case "inventory_categories":
          return `Cannot delete category "${item?.name || ""}" because subcategories or inventory items still depend on it. Remove or reassign those records first.`;

        case "inventory_subcategories":
          return `Cannot delete subcategory "${item?.name || ""}" because inventory items still depend on it. Remove or reassign those records first.`;

        case "item_conditions":
          return `Cannot delete condition "${item?.name || ""}" because inventory items still use it. Remove or reassign those records first.`;

        case "item_statuses":
          return `Cannot delete status "${item?.name || ""}" because inventory items still use it. Remove or reassign those records first.`;

        case "repair_statuses":
          return `Cannot delete repair status "${item?.name || ""}" because builds still use it. Remove or reassign those records first.`;

        case "sources":
          return `Cannot delete source "${item?.name || ""}" because inventory items, purchases, or other linked records still use it. Remove or reassign those records first.`;

        case "vendors":
          return `Cannot delete vendor "${item?.name || ""}" because purchases or other linked records still use it. Remove or reassign those records first.`;

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

      if (table === "inventory_categories" && categoryId === item.id) {
        setCategoryId("");
        setSubcategories([]);
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

  function resetFilters() {
    setCategoryId("");
    setSubcategories([]);
  }

  const sectionConfigs = [
    {
      title: "Categories",
      table: "inventory_categories",
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
        `Delete category "${item.name}"? Make sure no subcategories or inventory items still depend on it.`,
      addSavingKey: "add-category",
    },
    {
      title: "Subcategories",
      table: "inventory_subcategories",
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
        `Delete subcategory "${item.name}"? Related inventory items may still reference it.`,
    },
    {
      title: "Item Conditions",
      table: "item_conditions",
      items: conditions,
      newValue: newCondition,
      setNewValue: setNewCondition,
      onAdd: () =>
        addSimple("item_conditions", newCondition, setNewCondition, loadBase, "add-condition"),
      placeholder: "Add condition",
      emptyText: "No conditions yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-condition",
    },
    {
      title: "Item Statuses",
      table: "item_statuses",
      items: statuses,
      newValue: newStatus,
      setNewValue: setNewStatus,
      onAdd: () => addSimple("item_statuses", newStatus, setNewStatus, loadBase, "add-status"),
      placeholder: "Add item status",
      emptyText: "No item statuses yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-status",
    },
    {
      title: "Repair Statuses",
      table: "repair_statuses",
      items: repairStatuses,
      newValue: newRepairStatus,
      setNewValue: setNewRepairStatus,
      onAdd: () =>
        addSimple(
          "repair_statuses",
          newRepairStatus,
          setNewRepairStatus,
          loadBase,
          "add-repair-status"
        ),
      placeholder: "Add repair status",
      emptyText: "No repair statuses yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-repair-status",
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
    {
      title: "Vendors",
      table: "vendors",
      items: vendors,
      newValue: newVendor,
      setNewValue: setNewVendor,
      onAdd: () => addSimple("vendors", newVendor, setNewVendor, loadBase, "add-vendor"),
      placeholder: "Add vendor",
      emptyText: "No vendors yet.",
      columns: [{ key: "name", label: "Name" }],
      getRowCells: (item) => [{ content: item.name || "—" }],
      addSavingKey: "add-vendor",
    },
  ];

  let content;

  if (loading) {
    content = <LoadingCard message="Loading catalog data..." />;
  } else {
    content = (
      <div className="catalog-layout">
        <CatalogFilterPanel
          categories={categories}
          subcategories={subcategories}
          models={[]}
          variants={[]}
          categoryId={categoryId}
          subcategoryId=""
          modelId=""
          onCategoryChange={setCategoryId}
          onSubcategoryChange={() => {}}
          onModelChange={() => {}}
          onResetFilters={resetFilters}
          selectedCategoryName={categoryId ? findCategoryName(categoryId) : "None selected"}
          selectedSubcategoryName="N/A"
          selectedModelName="N/A"
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
        subtitle="Manage categories, subcategories, conditions, statuses, repair statuses, sources, and vendors."
      />

      {content}
    </div>
  );
}
