import { useMemo, useState } from "react";

export default function CatalogAccordionTable({
  title,
  table,
  items = [],
  newValue,
  setNewValue,
  onAdd,
  addSavingKey,
  addDisabled = false,
  placeholder = "Add item",
  emptyText = "No items found.",
  defaultOpen = false,
  columns = [],
  getRowCells,
  renderEditCells,
  editingItem,
  setEditingItem,
  savingKey,
  onBeginEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  deleteConfirmMessage,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [searchTerm, setSearchTerm] = useState("");

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!normalizedSearch) return items;

    return items.filter((item) => {
      const cells = getRowCells ? getRowCells(item) : [];
      const searchableText = [item?.name || "", ...cells.map((cell) => String(cell?.content || ""))]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [items, getRowCells, normalizedSearch]);

  const isEditingRow = (item) => editingItem?.table === table && editingItem?.id === item.id;

  const isSavingAdd = savingKey === addSavingKey;
  const hasSearch = items.length > 0;

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      onAdd();
    }
  }

  return (
    <div className="card">
      <button
        type="button"
        className="catalog-accordion-toggle"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>

        <span className="info-badge">{isOpen ? "Hide" : "Show"}</span>
      </button>

      {isOpen && (
        <div className="catalog-accordion-body">
          <div className="catalog-add-row">
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="input"
              disabled={addDisabled}
            />

            <button
              type="button"
              className="button-primary"
              onClick={onAdd}
              disabled={addDisabled || !newValue.trim() || isSavingAdd}
            >
              {isSavingAdd ? "Adding..." : "Add"}
            </button>
          </div>

          {hasSearch && (
            <div className="catalog-search-row">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${title.toLowerCase()}...`}
                className="input"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {filteredItems.length === 0 ? (
            <div className="empty-state">
              {normalizedSearch ? `No ${title.toLowerCase()} match "${searchTerm}".` : emptyText}
            </div>
          ) : (
            <div className="table-wrap">
              <table className="app-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key} className="th-left">
                        {column.label}
                      </th>
                    ))}
                    <th className="th-right">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredItems.map((item) => {
                    const rowEditing = isEditingRow(item);
                    const rowSavingEdit = savingKey === `edit-${table}-${item.id}`;
                    const rowSavingDelete = savingKey === `delete-${table}-${item.id}`;
                    const cells = getRowCells ? getRowCells(item) : [];

                    return (
                      <tr key={item.id}>
                        {rowEditing ? (
                          <>
                            {renderEditCells ? (
                              renderEditCells({
                                item,
                                editingItem,
                                setEditingItem,
                              })
                            ) : (
                              <td colSpan={Math.max(columns.length, 1)}>
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
                            )}

                            <td className="td-right">
                              <div className="action-row">
                                <button
                                  type="button"
                                  className="button-primary"
                                  onClick={onSaveEdit}
                                  disabled={rowSavingEdit}
                                >
                                  {rowSavingEdit ? "Saving..." : "Save"}
                                </button>
                                <button
                                  type="button"
                                  className="button-secondary"
                                  onClick={onCancelEdit}
                                  disabled={rowSavingEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            {cells.map((cell, index) => (
                              <td
                                key={`${item.id}-${columns[index]?.key || index}`}
                                className="td-left"
                              >
                                {cell.content}
                              </td>
                            ))}
                            <td className="td-right">
                              <div className="action-row">
                                <button
                                  type="button"
                                  className="button-secondary"
                                  onClick={() => onBeginEdit(table, item)}
                                  disabled={rowSavingDelete}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="button-danger"
                                  onClick={() =>
                                    onDelete(table, item, {
                                      confirmMessage: deleteConfirmMessage?.(item),
                                    })
                                  }
                                  disabled={rowSavingDelete}
                                >
                                  {rowSavingDelete ? "Deleting..." : "Delete"}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
