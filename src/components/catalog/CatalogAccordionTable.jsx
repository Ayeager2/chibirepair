import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import TableWrap from "@/components/ui/TableWrap";

export default function CatalogAccordionTable({
  title,
  subtitle,
  table,
  items,
  columns,
  getRowCells,
  newValue,
  setNewValue,
  onAdd,
  addDisabled = false,
  placeholder = "Add item",
  emptyText = "No items yet.",
  defaultOpen = false,

  editingItem,
  setEditingItem,
  savingKey,
  onBeginEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  deleteConfirmMessage,
}) {
  const itemCountLabel = `${items.length} item${items.length === 1 ? "" : "s"}`;

  return (
    <details className="card" open={defaultOpen}>
      <summary className="card-header-row catalog-summary">
        <div>
          <h3 className="card-title">{title}</h3>
          <p className="card-subtitle">{subtitle || itemCountLabel}</p>
        </div>

        <StatusBadge tone="neutral">{items.length}</StatusBadge>
      </summary>

      <div className="catalog-details-body">
        <div className="catalog-input-row">
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={placeholder}
            disabled={addDisabled}
            className="input catalog-input-flex"
          />
          <button
            type="button"
            onClick={onAdd}
            disabled={addDisabled || !newValue.trim()}
            className="button-primary"
          >
            Add
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState className="catalog-empty-state">{emptyText}</EmptyState>
        ) : (
          <TableWrap>
            <table className="app-table">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={col.align === "right" ? "th-right" : "th-left"}
                    >
                      {col.label}
                    </th>
                  ))}
                  <th className="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const isEditing =
                    editingItem?.table === table && editingItem?.id === item.id;

                  const isBusy =
                    savingKey === `edit-${table}-${item.id}` ||
                    savingKey === `delete-${table}-${item.id}`;

                  return (
                    <tr key={item.id} className="tr">
                      {isEditing ? (
                        <>
                          <td className="td-top">
                            <input
                              value={editingItem.value}
                              onChange={(e) =>
                                setEditingItem((prev) => ({
                                  ...prev,
                                  value: e.target.value,
                                }))
                              }
                              className="input"
                            />
                          </td>

                          {columns.slice(1).map((col) => (
                            <td key={col.key} className="td-top">
                              <span className="muted-text">—</span>
                            </td>
                          ))}

                          <td className="td-right">
                            <div className="action-row">
                              <button
                                type="button"
                                onClick={onSaveEdit}
                                disabled={!editingItem.value.trim() || isBusy}
                                className="button-primary"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={onCancelEdit}
                                disabled={isBusy}
                                className="button-secondary"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {getRowCells(item).map((cell, index) => (
                            <td
                              key={`${item.id}-${index}`}
                              className={
                                cell.align === "right" ? "td-right" : "td-top"
                              }
                            >
                              {cell.content}
                            </td>
                          ))}

                          <td className="td-right">
                            <div className="action-row">
                              <button
                                type="button"
                                onClick={() => onBeginEdit(table, item)}
                                disabled={isBusy}
                                className="button-secondary"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  onDelete(table, item, {
                                    confirmMessage: deleteConfirmMessage
                                      ? deleteConfirmMessage(item)
                                      : undefined,
                                  })
                                }
                                disabled={isBusy}
                                className="button-danger"
                              >
                                Delete
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
          </TableWrap>
        )}
      </div>
    </details>
  );
}