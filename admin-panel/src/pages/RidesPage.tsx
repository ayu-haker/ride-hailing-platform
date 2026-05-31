import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Chip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { apiService } from '../services/api.service';
import { Ride } from '../types';

const statusColors: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  accepted: 'info',
  started: 'info',
  completed: 'success',
  cancelled: 'error',
  scheduled: 'default',
};

export const RidesPage: React.FC = () => {
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ['rides', paginationModel.page, paginationModel.pageSize],
    queryFn: () => apiService.getRides({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
    }),
  });

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    {
      field: 'riderId', headerName: 'Rider ID', width: 100,
    },
    {
      field: 'driverId', headerName: 'Driver ID', width: 100,
      valueFormatter: (value: string | undefined) => value || '—',
    },
    { field: 'pickupAddress', headerName: 'Pickup', flex: 1 },
    { field: 'dropoffAddress', headerName: 'Dropoff', flex: 1 },
    {
      field: 'rideType', headerName: 'Type', width: 90,
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ row }) => (
        <Chip label={row.status} size="small" color={statusColors[row.status] || 'default'} />
      ),
    },
    {
      field: 'actualFare', headerName: 'Fare', width: 100, type: 'number',
      valueFormatter: (value: number | undefined, row: Ride) => {
        const v = value ?? row.estimatedFare;
        return `₹${v.toLocaleString()}`;
      },
    },
    {
      field: 'paymentStatus', headerName: 'Payment', width: 110,
      renderCell: ({ row }) => (
        <Chip label={row.paymentStatus} size="small" color={row.paymentStatus === 'paid' ? 'success' : row.paymentStatus === 'pending' ? 'warning' : 'error'} variant="outlined" />
      ),
    },
    {
      field: 'createdAt', headerName: 'Date', width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const rows = (data?.data as any)?.data || [];
  const total = (data?.data as any)?.meta?.total || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Rides</Typography>
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
