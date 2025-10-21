/**
 * Modern Grid Table - Professional Data Grid Component
 */

class ModernGrid {
  constructor(container, config = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.config = this.mergeConfig(config);
    this.data = [...(config.data || [])];
    this.filteredData = [...this.data];
    this.selectedRows = new Set();
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.currentPage = 1;
    this.editingCell = null;
    
    this.init();
  }

  mergeConfig(config) {
    const defaults = {
      columns: [],
      data: [],
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 50],
      sortable: true,
      editable: true,
      selectable: true,
      pagination: true,
      search: true,
      export: true,
      theme: 'light',
      validation: {
        name: { required: true, minLength: 2, maxLength: 50 },
        position: { required: true, minLength: 2 },
        office: { required: true },
        extension: { pattern: /^\d{4}$/, message: 'Extension must be 4 digits' },
        startDate: { pattern: /^\d{4}\/\d{2}\/\d{2}$/, message: 'Date format: YYYY/MM/DD' },
        salary: { pattern: /^\$[\d,]+$/, message: 'Salary format: $123,456' }
      }
    };
    return { ...defaults, ...config };
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = '';
    this.container.className = 'modern-grid';
    this.container.setAttribute('data-theme', this.config.theme);

    const gridHTML = `
      ${this.renderToolbar()}
      ${this.renderTable()}
      ${this.config.pagination ? this.renderPagination() : ''}
    `;

    this.container.innerHTML = gridHTML;
  }

  renderToolbar() {
    return `
      <div class="grid-toolbar">
        <div class="toolbar-left">
          ${this.config.search ? `
            <input type="text" class="input" id="search-input" placeholder="Search..." style="width: 300px; height: 36px;">
          ` : ''}
          ${this.config.pagination ? `
            <select class="select" id="page-size">
              ${this.config.pageSizeOptions.map(size => 
                `<option value="${size}" ${size === this.config.pageSize ? 'selected' : ''}>${size} rows</option>`
              ).join('')}
            </select>
          ` : ''}
        </div>
        <div class="toolbar-right">
          ${this.config.editable ? `
            <button class="btn btn-primary" id="add-row">
              ${this.getIcon('plus')}
              Add Row
            </button>
          ` : ''}
          ${this.config.selectable ? `
            <button class="btn btn-error" id="delete-selected" ${this.selectedRows.size === 0 ? 'disabled' : ''}>
              ${this.getIcon('trash')}
              Delete Selected (${this.selectedRows.size})
            </button>
          ` : ''}
          ${this.config.export ? `
            <button class="btn btn-secondary" id="export-csv">
              ${this.getIcon('download')}
              CSV
            </button>
            <button class="btn btn-secondary" id="export-json">
              ${this.getIcon('code')}
              JSON
            </button>
          ` : ''}
          <button class="btn btn-secondary" id="theme-toggle" title="Toggle theme">
            ${this.getIcon('theme')}
          </button>
        </div>
      </div>
    `;
  }

  renderTable() {
    return `
      <div class="table-container">
        <table class="table">
          <thead>
            ${this.renderHeader()}
          </thead>
          <tbody>
            ${this.renderRows()}
          </tbody>
        </table>
      </div>
    `;
  }

  renderHeader() {
    return `
      <tr>
        ${this.config.selectable ? '<th><input type="checkbox" class="checkbox" id="select-all"></th>' : ''}
        ${this.config.columns.map(col => `
          <th class="${this.config.sortable && col.sortable !== false ? 'sortable' : ''} 
                     ${this.sortColumn === col.field ? `sort-${this.sortDirection}` : ''}"
              data-field="${col.field}"
              style="${col.width ? `width: ${col.width};` : ''}">
            ${col.title || col.field}
          </th>
        `).join('')}
        ${this.config.editable ? '<th style="width: 120px;">Actions</th>' : ''}
      </tr>
    `;
  }

  renderRows() {
    if (this.filteredData.length === 0) {
      return `<tr><td colspan="${this.getColumnCount()}" class="empty-state">No data available</td></tr>`;
    }

    const startIndex = (this.currentPage - 1) * this.config.pageSize;
    const endIndex = startIndex + this.config.pageSize;
    const pageData = this.filteredData.slice(startIndex, endIndex);

    return pageData.map((row, index) => {
      const actualIndex = this.data.findIndex(dataRow => 
        this.config.columns.every(col => dataRow[col.field] === row[col.field])
      );
      return `
        <tr data-index="${actualIndex}" class="${this.selectedRows.has(actualIndex) ? 'selected' : ''}">
          ${this.config.selectable ? `
            <td><input type="checkbox" class="checkbox row-select" ${this.selectedRows.has(actualIndex) ? 'checked' : ''}></td>
          ` : ''}
          ${this.config.columns.map(col => `
            <td data-field="${col.field}" ${this.config.editable && col.editable !== false ? 'class="editable-cell" tabindex="0"' : ''}>
              ${this.formatCellValue(row[col.field], col)}
            </td>
          `).join('')}
          ${this.config.editable ? `
            <td class="actions">
              <button class="btn btn-sm btn-secondary edit-btn" title="Edit Row">
                ${this.getIcon('edit')}
              </button>
              <button class="btn btn-sm btn-error delete-btn" title="Delete Row">
                ${this.getIcon('trash')}
              </button>
            </td>
          ` : ''}
        </tr>
      `;
    }).join('');
  }

  renderPagination() {
    const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
    const startRecord = Math.min((this.currentPage - 1) * this.config.pageSize + 1, this.filteredData.length);
    const endRecord = Math.min(this.currentPage * this.config.pageSize, this.filteredData.length);

    if (totalPages <= 1) return '';

    return `
      <div class="pagination">
        <div class="pagination-info">
          Showing ${startRecord}-${endRecord} of ${this.filteredData.length} entries
        </div>
        <div class="pagination-controls">
          <button class="page-btn" id="first-page" ${this.currentPage === 1 ? 'disabled' : ''} title="First Page">
            ${this.getIcon('chevron-double-left')}
          </button>
          <button class="page-btn" id="prev-page" ${this.currentPage === 1 ? 'disabled' : ''} title="Previous Page">
            ${this.getIcon('chevron-left')}
          </button>
          ${this.renderPageNumbers(totalPages)}
          <button class="page-btn" id="next-page" ${this.currentPage === totalPages ? 'disabled' : ''} title="Next Page">
            ${this.getIcon('chevron-right')}
          </button>
          <button class="page-btn" id="last-page" ${this.currentPage === totalPages ? 'disabled' : ''} title="Last Page">
            ${this.getIcon('chevron-double-right')}
          </button>
        </div>
      </div>
    `;
  }

  renderPageNumbers(totalPages) {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(`
        <button class="page-btn ${i === this.currentPage ? 'active' : ''}" data-page="${i}" title="Page ${i}">
          ${i}
        </button>
      `);
    }

    return pages.join('');
  }

  attachEventListeners() {
    // Search
    const searchInput = this.container.querySelector('#search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
    }

    // Page size
    const pageSizeSelect = this.container.querySelector('#page-size');
    if (pageSizeSelect) {
      pageSizeSelect.addEventListener('change', (e) => {
        this.config.pageSize = parseInt(e.target.value);
        this.currentPage = 1;
        this.render();
        this.attachEventListeners();
      });
    }

    // Theme toggle
    const themeToggle = this.container.querySelector('#theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Add row
    const addBtn = this.container.querySelector('#add-row');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addRow());
    }

    // Delete selected
    const deleteBtn = this.container.querySelector('#delete-selected');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteSelected());
    }

    // Export
    const exportCsvBtn = this.container.querySelector('#export-csv');
    const exportJsonBtn = this.container.querySelector('#export-json');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => this.exportData('csv'));
    }
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener('click', () => this.exportData('json'));
    }

    // Table events
    this.attachTableEventListeners();
    this.attachPaginationEventListeners();
  }

  attachTableEventListeners() {
    const table = this.container.querySelector('.table');
    
    // Column sorting
    table.addEventListener('click', (e) => {
      if (e.target.matches('th[data-field]') || e.target.closest('th[data-field]')) {
        const th = e.target.matches('th[data-field]') ? e.target : e.target.closest('th[data-field]');
        if (th.classList.contains('sortable')) {
          this.handleSort(th.dataset.field);
        }
      }
    });

    // Row selection
    table.addEventListener('change', (e) => {
      if (e.target.matches('#select-all')) {
        this.selectAll(e.target.checked);
      } else if (e.target.matches('.row-select')) {
        this.selectRow(e.target.closest('tr').dataset.index, e.target.checked);
        this.updateToolbar();
      }
    });

    // Cell editing
    table.addEventListener('dblclick', (e) => {
      if (e.target.matches('.editable-cell') && this.config.editable) {
        this.startEdit(e.target);
      }
    });

    // Action buttons
    table.addEventListener('click', (e) => {
      if (e.target.matches('.edit-btn') || e.target.closest('.edit-btn')) {
        this.editRow(e.target.closest('tr'));
      } else if (e.target.matches('.delete-btn') || e.target.closest('.delete-btn')) {
        this.deleteRow(e.target.closest('tr'));
      }
    });

    // Keyboard navigation
    table.addEventListener('keydown', (e) => {
      if (e.target.matches('.editable-cell')) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.startEdit(e.target);
        }
      }
    });
  }

  attachPaginationEventListeners() {
    const pagination = this.container.querySelector('.pagination');
    if (!pagination) return;

    pagination.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.disabled) return;

      if (btn.id === 'first-page') {
        this.goToPage(1);
      } else if (btn.id === 'prev-page') {
        this.goToPage(this.currentPage - 1);
      } else if (btn.id === 'next-page') {
        this.goToPage(this.currentPage + 1);
      } else if (btn.id === 'last-page') {
        const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
        this.goToPage(totalPages);
      } else if (btn.dataset.page) {
        this.goToPage(parseInt(btn.dataset.page));
      }
    });
  }

  // Data manipulation methods
  handleSearch(query) {
    if (!query.trim()) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter(row => 
        this.config.columns.some(col => 
          String(row[col.field] || '').toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    this.currentPage = 1;
    this.selectedRows.clear();
    this.render();
    this.attachEventListeners();
  }

  handleSort(field) {
    if (this.sortColumn === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = a[field] || '';
      const bVal = b[field] || '';
      
      // Handle numeric values
      const aNum = parseFloat(aVal.toString().replace(/[^0-9.-]/g, ''));
      const bNum = parseFloat(bVal.toString().replace(/[^0-9.-]/g, ''));
      
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return this.sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }
      
      // Handle string values
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.render();
    this.attachEventListeners();
  }

  // CRUD operations
  addRow() {
    const maxId = Math.max(...this.data.map(row => {
      const idNum = parseInt(row.id.toString().replace(/\D/g, ''));
      return isNaN(idNum) ? 0 : idNum;
    }), 0);
    const newRow = { id: `EMP${String(maxId + 1).padStart(3, '0')}` };
    this.config.columns.forEach(col => {
      if (col.field !== 'id') {
        newRow[col.field] = col.defaultValue || '';
      }
    });
    
    this.data.unshift(newRow);
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.render();
    this.attachEventListeners();
    
    // Auto-edit the first editable cell
    setTimeout(() => {
      const firstEditableCell = this.container.querySelector('.editable-cell');
      if (firstEditableCell) {
        this.startEdit(firstEditableCell);
      }
    }, 100);
  }

  deleteRow(row) {
    const index = parseInt(row.dataset.index);
    const rowData = this.data[index];
    const rowName = rowData.name || rowData.id || 'this row';
    
    if (confirm(`Delete ${rowName}?`)) {
      this.data.splice(index, 1);
      this.filteredData = this.data.filter(dataRow => 
        this.filteredData.some(filteredRow => 
          this.config.columns.every(col => dataRow[col.field] === filteredRow[col.field])
        )
      );
      this.selectedRows.delete(index);
      
      // Adjust current page if necessary
      const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
      if (this.currentPage > totalPages && totalPages > 0) {
        this.currentPage = totalPages;
      }
      
      this.render();
      this.attachEventListeners();
    }
  }

  deleteSelected() {
    if (this.selectedRows.size === 0) {
      alert('Please select rows to delete');
      return;
    }
    
    if (confirm(`Delete ${this.selectedRows.size} selected row(s)?`)) {
      const indices = Array.from(this.selectedRows).sort((a, b) => b - a);
      indices.forEach(index => {
        if (index >= 0 && index < this.data.length) {
          this.data.splice(index, 1);
        }
      });
      
      this.filteredData = [...this.data];
      this.selectedRows.clear();
      this.currentPage = 1;
      this.render();
      this.attachEventListeners();
    }
  }

  editRow(row) {
    const cells = row.querySelectorAll('.editable-cell');
    if (cells.length > 0) {
      this.startEdit(cells[0]);
    }
  }

  startEdit(cell) {
    if (this.editingCell) {
      this.finishEdit();
    }
    
    this.editingCell = cell;
    const originalValue = cell.textContent.trim();
    const field = cell.dataset.field;
    
    cell.contentEditable = true;
    cell.classList.add('editing');
    cell.focus();
    
    // Select all text
    const range = document.createRange();
    range.selectNodeContents(cell);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    
    const finishEdit = () => {
      if (this.editingCell === cell) {
        this.finishEdit();
      }
    };

    const cancelEdit = () => {
      cell.textContent = originalValue;
      finishEdit();
    };

    // Real-time validation
    cell.addEventListener('input', () => {
      const value = cell.textContent.trim();
      const validation = this.validateField(field, value);
      
      cell.classList.toggle('invalid', !validation.isValid);
      
      if (!validation.isValid) {
        cell.title = validation.message;
      } else {
        cell.removeAttribute('title');
      }
    });

    cell.addEventListener('blur', finishEdit, { once: true });
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEdit();
      }
    }, { once: true });
  }

  finishEdit() {
    if (!this.editingCell) return;
    
    const cell = this.editingCell;
    const field = cell.dataset.field;
    const rowIndex = parseInt(cell.closest('tr').dataset.index);
    const newValue = cell.textContent.trim();
    
    // Validate before saving
    const validation = this.validateField(field, newValue);
    
    if (!validation.isValid) {
      alert(`Validation Error: ${validation.message}`);
      cell.focus();
      return;
    }
    
    if (rowIndex >= 0 && rowIndex < this.data.length) {
      this.data[rowIndex][field] = newValue;
      
      // Update filtered data
      const filteredIndex = this.filteredData.findIndex(row => 
        this.config.columns.every(col => row[col.field] === this.data[rowIndex][col.field])
      );
      if (filteredIndex >= 0) {
        this.filteredData[filteredIndex][field] = newValue;
      }
    }
    
    cell.contentEditable = false;
    cell.classList.remove('editing', 'invalid');
    cell.removeAttribute('title');
    this.editingCell = null;
  }

  // Selection methods
  selectAll(checked) {
    this.selectedRows.clear();
    if (checked) {
      this.data.forEach((_, index) => this.selectedRows.add(index));
    }
    this.updateToolbar();
    this.render();
    this.attachEventListeners();
  }

  selectRow(index, checked) {
    const idx = parseInt(index);
    if (checked) {
      this.selectedRows.add(idx);
    } else {
      this.selectedRows.delete(idx);
    }
  }

  updateToolbar() {
    const deleteBtn = this.container.querySelector('#delete-selected');
    if (deleteBtn) {
      deleteBtn.disabled = this.selectedRows.size === 0;
      deleteBtn.innerHTML = `
        ${this.getIcon('trash')}
        Delete Selected (${this.selectedRows.size})
      `;
    }
  }

  // Utility methods
  formatCellValue(value, column) {
    if (column.formatter) {
      return column.formatter(value);
    }
    return value || '';
  }

  getColumnCount() {
    let count = this.config.columns.length;
    if (this.config.selectable) count++;
    if (this.config.editable) count++;
    return count;
  }

  goToPage(page) {
    const totalPages = Math.ceil(this.filteredData.length / this.config.pageSize);
    if (page >= 1 && page <= totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.render();
      this.attachEventListeners();
    }
  }

  toggleTheme() {
    this.config.theme = this.config.theme === 'light' ? 'dark' : 'light';
    this.container.setAttribute('data-theme', this.config.theme);
    
    // Save theme preference
    localStorage.setItem('grid-theme', this.config.theme);
  }

  exportData(format) {
    const selectedData = this.selectedRows.size > 0 
      ? this.data.filter((_, index) => this.selectedRows.has(index))
      : this.filteredData;

    if (format === 'csv') {
      this.exportCSV(selectedData);
    } else if (format === 'json') {
      this.exportJSON(selectedData);
    }
  }

  exportCSV(data) {
    const headers = this.config.columns.map(col => col.title || col.field);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        this.config.columns.map(col => `"${(row[col.field] || '').toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    this.downloadFile(csvContent, `grid-export-${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
  }

  exportJSON(data) {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, `grid-export-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // SVG Icons
  getIcon(name) {
    const icons = {
      plus: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
      trash: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/></svg>',
      edit: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"/></svg>',
      download: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/></svg>',
      code: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8,3A2,2 0 0,0 6,5V9A2,2 0 0,1 4,11H3V13H4A2,2 0 0,1 6,15V19A2,2 0 0,0 8,21H10V19H8V14A2,2 0 0,0 6,12A2,2 0 0,0 8,10V5H10V3M16,3A2,2 0 0,1 18,5V9A2,2 0 0,0 20,11H21V13H20A2,2 0 0,0 18,15V19A2,2 0 0,1 16,21H14V19H16V14A2,2 0 0,1 18,12A2,2 0 0,1 16,10V5H14V3H16Z"/></svg>',
      theme: '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12,18C11.11,18 10.26,17.8 9.5,17.45C11.56,16.5 13,14.42 13,12C13,9.58 11.56,7.5 9.5,6.55C10.26,6.2 11.11,6 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/></svg>',
      'chevron-left': '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z"/></svg>',
      'chevron-right': '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"/></svg>',
      'chevron-double-left': '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M18.41,16.59L13.82,12L18.41,7.41L17,6L11,12L17,18L18.41,16.59M6,6H8V18H6V6Z"/></svg>',
      'chevron-double-right': '<svg class="icon" viewBox="0 0 24 24" fill="currentColor"><path d="M5.59,7.41L10.18,12L5.59,16.59L7,18L13,12L7,6L5.59,7.41M16,6H18V18H16V6Z"/></svg>'
    };
    return icons[name] || '';
  }

  // Validation method
  validateField(field, value) {
    const rules = this.config.validation[field];
    if (!rules) return { isValid: true };
    
    // Required validation
    if (rules.required && (!value || value.trim() === '')) {
      return { isValid: false, message: `${field} is required` };
    }
    
    // Skip other validations if empty and not required
    if (!value || value.trim() === '') {
      return { isValid: true };
    }
    
    // Length validations
    if (rules.minLength && value.length < rules.minLength) {
      return { isValid: false, message: `${field} must be at least ${rules.minLength} characters` };
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return { isValid: false, message: `${field} must be no more than ${rules.maxLength} characters` };
    }
    
    // Pattern validation
    if (rules.pattern && !rules.pattern.test(value)) {
      return { isValid: false, message: rules.message || `${field} format is invalid` };
    }
    
    return { isValid: true };
  }

  // Public API methods
  getData() {
    return [...this.data];
  }

  setData(data) {
    this.data = [...data];
    this.filteredData = [...this.data];
    this.currentPage = 1;
    this.selectedRows.clear();
    this.render();
    this.attachEventListeners();
  }

  getSelectedRows() {
    return Array.from(this.selectedRows).map(index => this.data[index]).filter(Boolean);
  }

  refresh() {
    this.filteredData = [...this.data];
    this.render();
    this.attachEventListeners();
  }

  destroy() {
    this.container.innerHTML = '';
    this.container.className = '';
    this.container.removeAttribute('data-theme');
  }
}

// Factory function
function createGrid(container, config) {
  return new ModernGrid(container, config);
}

// ES6 Module exports
export { ModernGrid, createGrid };

// Global usage
if (typeof window !== 'undefined') {
  window.ModernGrid = ModernGrid;
  window.createGrid = createGrid;
}