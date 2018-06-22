function initDataTable () {
  $('#my-table').DataTable();
}

// https://www.datatables.net/
// this is obviously a hack, but $(document).ready() does not work because plotly Dash is based on React components
setTimeout(initDataTable, 2000);
