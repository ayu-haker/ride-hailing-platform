import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, TextField, InputAdornment, IconButton, Chip, Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Block, CheckCircle, HowToReg } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '../services/api.service';
import { User } from '../types';

export const UsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['users', paginationModel.page, paginationModel.pageSize, search],
    queryFn: () => apiService.getUsers({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      search: search || undefined,
    }),
  });

  const toggleStatus = useMutation({
    mutationFn: (user: User) =>
      user.isBlocked ? apiService.unblockUser(user.id) : apiService.blockUser(user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'firstName', headerName: 'Name', flex: 1,
      valueGetter: (_, row: User) => `${row.firstName} ${row.lastName || ''}`.trim(),
    },
    { field: 'email', headerName: 'Email', flex: 1 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'role', headerName: 'Role', width: 100,
      renderCell: ({ row }) => (
        <Chip label={row.role} size="small" color={row.role === 'admin' ? 'error' : row.role === 'driver' ? 'primary' : 'default'} variant="outlined" />
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ row }) => (
        <Chip
          label={row.isBlocked ? 'Blocked' : 'Active'}
          size="small"
          color={row.isBlocked ? 'error' : 'success'}
        />
      ),
    },
    {
      field: 'createdAt', headerName: 'Joined', width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions', headerName: 'Actions', width: 100, sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title={row.isBlocked ? 'Unblock User' : 'Block User'}>
          <IconButton size="small" color={row.isBlocked ? 'success' : 'error'} onClick={() => toggleStatus.mutate(row)}>
            {row.isBlocked ? <HowToReg fontSize="small" /> : <Block fontSize="small" />}
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const rows = (data?.data as any)?.data || [];
  const total = (data?.data as any)?.meta?.total || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Users</Typography>
      <TextField
        size="small"
        placeholder="Search users..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
        }}
        sx={{ mb: 2, width: 320 }}
      />
      <Box sx={{ height: 600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          paginationMode="server"
          rowCount={total}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>
    </Box>
  );
};
