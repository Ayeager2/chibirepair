import TableWrap from "@/components/ui/TableWrap";

function StatusBadge({ children, tone = "neutral" }) {
  let className = "inventory-badge";

  if (tone === "good") {
    className = "inventory-badge inventory-badge-good";
  } else if (tone === "warn") {
    className = "inventory-badge inventory-badge-warn";
  } else if (tone === "info") {
    className = "inventory-badge inventory-badge-info";
  }

  return <span className={className}>{children || "—"}</span>;
}

function getQtyPillClass(qty) {
  const value = Number(qty || 0);

  if (value <= 0) return "inventory-qty-pill-low";
  if (value <= 2) return "inventory-qty-pill-warn";
  return "inventory-qty-pill";
}

function getName(row, key, nested) {
  return row?.[key] ?? row?.[nested]?.name ?? "";
}

function money(n) {
  return Number(n || 0).toFixed(2);
}

function formatItemType(value) {
  if (!value) return "—";

  switch (value) {
    case "donor_device":
      return "Donor Device";
    case "finished_product":
      return "Finished Product";
    case "part":
      return "Part";
    case "supply":
      return "Supply";
    case "tool":
      return "Tool";
    case "accessory":
      return "Accessory";
    default:
      return value;
  }
}

export default function InventoryTable({
  rows,
  statuses,
  sources,
  conditions,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  sourceFilter,
  setSourceFilter,
  conditionFilter,
  setConditionFilter,
  inStockOnly,
  setInStockOnly,
  onClearFilters,
  sortBy,
  sortDirection,
  toggleSort,
  onEdit,
  onDelete,
}) {
  function sortIndicator(column) {
    if (sortBy !== column) return "";
    return sortDirection === "asc" ? "▲" : "▼";
  }

  return (
    <TableWrap>
      <div className="inventory-filter-row">
        <input
          type="text"
          className="input inventory-filter-search"
          placeholder="Search description, SKU, label, notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          className="select inventory-filter-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="select inventory-filter-select"
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
        >
          <option value="">All sources</option>
          {sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          className="select inventory-filter-select"
          value={conditionFilter}
          onChange={(e) => setConditionFilter(e.target.value)}
        >
          <option value="">All conditions</option>
          {conditions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label className="inventory-checkbox-row">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
          />
          <span>In stock only</span>
        </label>

        <button type="button" className="button-secondary" onClick={onClearFilters}>
          Clear Filters
        </button>
      </div>

      <table className="app-table inventory-table">
        <thead>
          <tr>
            <th
              className={`th-left inventory-th-sticky inventory-sortable ${sortBy === "description" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("description")}
            >
              Item {sortIndicator("description")}
            </th>

            <th
              className={`th-left inventory-th-sticky inventory-sortable ${sortBy === "itemType" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("itemType")}
            >
              Type {sortIndicator("itemType")}
            </th>

            <th className="th-left inventory-th-sticky">Catalog</th>

            <th
              className={`th-left inventory-th-sticky inventory-sortable ${sortBy === "condition" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("condition")}
            >
              Condition / Status {sortIndicator("condition")}
            </th>

            <th
              className={`th-left inventory-th-sticky inventory-sortable ${sortBy === "source" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("source")}
            >
              Source {sortIndicator("source")}
            </th>

            <th
              className={`th-right inventory-th-sticky inventory-sortable ${sortBy === "cost" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("cost")}
            >
              Cost {sortIndicator("cost")}
            </th>

            <th
              className={`th-right inventory-th-sticky inventory-sortable ${sortBy === "price" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("price")}
            >
              Asking {sortIndicator("price")}
            </th>

            <th
              className={`th-right inventory-th-sticky inventory-sortable ${sortBy === "qty" ? "inventory-sortable-active" : ""}`}
              onClick={() => toggleSort("qty")}
            >
              Qty {sortIndicator("qty")}
            </th>

            <th className="th-right inventory-th-sticky">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr className="tr">
              <td colSpan={9} className="td-top inventory-empty-row">
                No matching inventory found. Try adjusting your search or filters.
              </td>
            </tr>
          ) : (
            rows.map((r) => {
              const categoryName = getName(r, "category_name", "category");
              const subcategoryName = getName(r, "subcategory_name", "subcategory");
              const conditionName = getName(r, "condition_name", "condition");
              const statusName = getName(r, "status_name", "status");
              const sourceName = getName(r, "source_name", "source");

              return (
                <tr key={r.id} className="tr">
                  <td className="td-top">
                    <div className="inventory-item-title">{r.description || "—"}</div>
                    <div className="inventory-item-meta">SKU: {r.sku || "—"}</div>
                    <div className="inventory-item-meta">Label: {r.device_label || "—"}</div>
                  </td>

                  <td className="td-top">
                    <StatusBadge tone="info">{formatItemType(r.item_type)}</StatusBadge>
                  </td>

                  <td className="td-top">
                    <div className="inventory-stack-text">
                      <div>
                        <strong>{categoryName || "—"}</strong>
                      </div>
                      <div className="small-muted">{subcategoryName || "—"}</div>
                    </div>
                  </td>

                  <td className="td-top">
                    <div className="inventory-badge-row">
                      <StatusBadge tone="info">{conditionName || "No condition"}</StatusBadge>
                      <StatusBadge tone="good">{statusName || "No status"}</StatusBadge>
                    </div>
                  </td>

                  <td className="td-top">{sourceName || "—"}</td>

                  <td className="td-right">${money(r.unit_cost)}</td>
                  <td className="td-right">
                    {r.asking_price == null ? "—" : `$${money(r.asking_price)}`}
                  </td>
                  <td className="td-right">
                    <span className={getQtyPillClass(r.qty_on_hand)}>{r.qty_on_hand ?? 0}</span>
                  </td>
                  <td className="td-right">
                    <div className="action-row">
                      <button type="button" onClick={() => onEdit(r)} className="button-secondary">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(r.id)}
                        className="button-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </TableWrap>
  );
}
