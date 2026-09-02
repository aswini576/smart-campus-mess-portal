import { useState } from 'react';
import { Box, Button, Checkbox, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

function AppTable({ columns, rows }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const supportsBulkDelete = rows.some((row) => typeof row.bulkDelete === 'function');
  const selectableRows = rows.filter((row) => typeof row.bulkDelete === 'function');

  const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === selectableRows.length ? [] : selectableRows.map((row) => row.id));
  const deleteSelected = async () => {
    if (!selectedIds.length || !window.confirm(`Delete ${selectedIds.length} selected record(s)? This action cannot be undone.`)) return;
    setDeleting(true);
    try {
      await Promise.all(rows.filter((row) => selectedIds.includes(row.id)).map((row) => row.bulkDelete()));
      window.location.reload();
    } finally {
      setDeleting(false);
    }
  };

  return <>{supportsBulkDelete && <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}><Button variant="contained" color="error" disabled={!selectedIds.length || deleting} onClick={deleteSelected}>{deleting ? 'Deleting…' : `Delete Selected (${selectedIds.length})`}</Button></Box>}<TableContainer><Table size="small"><TableHead><TableRow>{supportsBulkDelete && <TableCell padding="checkbox"><Checkbox checked={Boolean(selectableRows.length) && selectedIds.length === selectableRows.length} indeterminate={selectedIds.length > 0 && selectedIds.length < selectableRows.length} onChange={toggleAll} /></TableCell>}{columns.map((column) => <TableCell key={column.key} sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' }}>{column.label}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map((row, index) => <TableRow key={row.id || index} hover>{supportsBulkDelete && <TableCell padding="checkbox"><Checkbox disabled={typeof row.bulkDelete !== 'function'} checked={selectedIds.includes(row.id)} onChange={() => toggle(row.id)} /></TableCell>}{columns.map((column) => <TableCell key={column.key} sx={{ borderBottom: 1, borderColor: 'divider' }}>{row[column.key]}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer></>;
}

export default AppTable;
