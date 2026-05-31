import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, TextField, InputAdornment, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Search, Star } from '@mui/icons-material';
import { apiService } from '../services/api.service';
import { Driver } from '../types';

export const DriversPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['drivers', paginationModel.page, paginationModel.pageSize, search],
    queryFn: () => apiService.getDrivers({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      search: search || undefined,
    }),
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'firstName', headerName: 'Name', flex: 1,
      valueGetter: (_, row: Driver) => `${row.firstName} ${row.lastName || ''}`.trim(),
    },
    { field: 'phone', headerName: 'Phone', width: 140 },
    {
      field: 'status', headerName: 'Status', width: 110,
      renderCell: ({ row }) => {
        const color = row.status === 'online' ? 'success' : row.status === 'busy' ? 'warning' : 'default';
        return <Chip label={row.status} size="small" color={color} />;
      },
    },
    {
      field: 'rating', headerName: 'Rating', width: 100,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={0.5}>
          <Star sx={{ fontSize: 16, color: '#FFA502' }} />
          <Typography variant="body2">{row.rating?.toFixed(1) || 'N/A'}</Typography>
        </Box>
      ),
    },
    { field: 'totalRides', headerName: 'Rides', width: 90, type: 'number' },
    {
      field: 'totalEarnings', headerName: 'Earnings', width: 130, type: 'number',
      valueFormatter: (value: number) => `₹${(value || 0).toLocaleString()}`,
    },
    {
      field: 'kycStatus', headerName: 'KYC', width: 120,
      renderCell: ({ row }) => {
        const color = row.kycStatus === 'verified' ? 'success' : row.kycStatus === 'pending' ? 'warning' : row.kycStatus === 'rejected' ? 'error' : 'default';
        return <Chip label={row.kycStatus?.replace('_', ' ')} size="small" color={color} variant="outlined" />;
      },
    },
    {
      field: 'createdAt', headerName: 'Joined', width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const rows = (data?.data as any)?.data || [];
  const total = (data?.data as any)?.meta?.total || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Drivers</Typography>
      <TextField
        size="small"
        placeholder="Search drivers..."
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
