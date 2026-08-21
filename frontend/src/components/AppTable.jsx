import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

function AppTable({ columns, rows }) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead><TableRow>{columns.map((column) => <TableCell key={column.key} sx={{ fontWeight: 800, color: 'text.secondary', borderBottom: 1, borderColor: 'divider' }}>{column.label}</TableCell>)}</TableRow></TableHead>
        <TableBody>{rows.map((row, index) => <TableRow key={row.id || index} hover>{columns.map((column) => <TableCell key={column.key} sx={{ borderBottom: 1, borderColor: 'divider' }}>{row[column.key]}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </TableContainer>
  );
}

export default AppTable;
