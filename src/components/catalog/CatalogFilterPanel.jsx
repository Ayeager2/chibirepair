export default function CatalogFilterPanel({
  categories,
  subcategories,
  categoryId,
  subcategoryId,
  onCategoryChange,
  onSubcategoryChange,
  onResetFilters,
  selectedCategoryName,
  selectedSubcategoryName,
}) {
  const hasActiveFilters = Boolean(categoryId || subcategoryId);

  return (
    <aside className="catalog-sidebar">
      <div className="card catalog-sidebar-card">
        <div className="card-header card-header-panel">
          <h3 className="card-title">Catalog Filters</h3>
          <p className="card-subtitle">
            Choose a category to narrow the related subcategories and catalog records.
          </p>
        </div>

        <div className="catalog-stats-grid">
          <div className="stat-card">
            <div className="stat-label">Categories</div>
            <div className="stat-value-small">{categories.length}</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Subcategories</div>
            <div className="stat-value-small">{subcategories.length}</div>
          </div>
        </div>

        <div className="catalog-filter-group">
          <label htmlFor="category-select" className="label">
            Category
          </label>
          <select
            id="category-select"
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="select"
          >
            <option value="">(select category)</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="catalog-filter-group">
          <label htmlFor="subcategory-select" className="label">
            Subcategory Filter
          </label>
          <select
            id="subcategory-select"
            value={subcategoryId}
            onChange={(e) => onSubcategoryChange(e.target.value)}
            className="select"
            disabled={!categoryId}
          >
            <option value="">(all / none)</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>

        <div className="catalog-filter-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={onResetFilters}
            disabled={!hasActiveFilters}
          >
            Reset Filters
          </button>
        </div>

        <div className="catalog-filter-summary">
          <div className="small-muted">
            <strong>Selected category:</strong> {selectedCategoryName}
          </div>
          <div className="small-muted">
            <strong>Selected subcategory:</strong> {selectedSubcategoryName}
          </div>
        </div>
      </div>
    </aside>
  );
}
