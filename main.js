import './modern-grid.css'
import { ModernGrid } from './modern-grid.js';
import { Model } from './model/model';

// Transform old data format to new format with intelligent ID mapping
function transformData(gridData) {
  return gridData.map((row, index) => ({
    id: `EMP${String(index + 1).padStart(3, '0')}`,
    name: row[0],
    position: row[1],
    office: row[2],
    extension: row[3],
    startDate: row[4],
    salary: row[5]
  }));
}

const model = new Model();
const transformedData = transformData(model.gridData);

// Initialize modern grid
const grid = new ModernGrid('#grid-container', {
  columns: [
    { field: 'id', title: 'ID', width: '60px', editable: false, sortable: true },
    { field: 'name', title: 'Name', sortable: true, editable: true },
    { field: 'position', title: 'Position', sortable: true, editable: true },
    { field: 'office', title: 'Office', sortable: true, editable: true },
    { field: 'extension', title: 'Extension', sortable: true, editable: true },
    { field: 'startDate', title: 'Start Date', sortable: true, editable: true },
    { field: 'salary', title: 'Salary', sortable: true, editable: true }
  ],
  data: transformedData,
  pageSize: 10,
  sortable: true,
  editable: true,
  selectable: true,
  search: true,
  export: true,
  pagination: true
});




