import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Button, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Switch, FormControlLabel,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Delete, Edit } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiService } from '../services/api.service';
import { Coupon } from '../types';

const couponSchema = z.object({
  code: z.string().min(3, 'Code must be at least 3 characters').toUpperCase(),
  type: z.enum(['percentage', 'fixed', 'free_ride', 'referral']),
  value: z.coerce.number().positive('Value must be positive'),
  maxDiscount: z.coerce.number().optional(),
  minOrderAmount: z.coerce.number().optional(),
  maxUses: z.coerce.number().int().positive(),
  isActive: z.boolean(),
  expiresAt: z.string().optional(),
});

type CouponForm = z.infer<typeof couponSchema>;

const defaultValues: CouponForm = {
  code: '',
  type: 'percentage',
  value: 0,
  maxDiscount: undefined,
  minOrderAmount: undefined,
  maxUses: 100,
  isActive: true,
  expiresAt: '',
};

export const CouponsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 10 });

  const { control, handleSubmit, reset, formState: { errors } } = useForm<CouponForm>({
    resolver: zodResolver(couponSchema),
    defaultValues,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['coupons', paginationModel.page, paginationModel.pageSize],
    queryFn: () => apiService.getCoupons({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
    }),
  });

  const createCoupon = useMutation({
    mutationFn: (form: CouponForm) => apiService.createCoupon(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon created');
      setDialogOpen(false);
      reset(defaultValues);
    },
  });

  const deleteCoupon = useMutation({
    mutationFn: (id: string) => apiService.deleteCoupon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success('Coupon deleted');
    },
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCoupon.mutate(id);
    }
  };

  const onSubmit = (form: CouponForm) => {
    createCoupon.mutate(form);
  };

  const columns: GridColDef[] = [
    { field: 'code', headerName: 'Code', width: 130, renderCell: ({ value }) => <Chip label={value} size="small" color="primary" variant="outlined" /> },
    {
      field: 'type', headerName: 'Type', width: 110,
      renderCell: ({ value }) => value?.replace('_', ' ') || '',
    },
    {
      field: 'value', headerName: 'Discount', width: 100,
      renderCell: ({ row }) => row.type === 'percentage' ? `${row.value}%` : `₹${row.value}`,
    },
    { field: 'minOrderAmount', headerName: 'Min Order', width: 110, type: 'number', valueFormatter: (v: number | undefined) => v ? `₹${v}` : '—' },
    { field: 'maxUses', headerName: 'Max Uses', width: 90, type: 'number' },
    {
      field: 'totalUses', headerName: 'Used', width: 80, type: 'number',
    },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      renderCell: ({ row }) => <Chip label={row.isActive ? 'Active' : 'Inactive'} size="small" color={row.isActive ? 'success' : 'default'} />,
    },
    {
      field: 'expiresAt', headerName: 'Expiry', width: 120,
      valueFormatter: (value: string | undefined) => value ? new Date(value).toLocaleDateString() : 'Never',
    },
    {
      field: 'createdAt', headerName: 'Created', width: 110,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false,
      renderCell: ({ row }) => (
        <Tooltip title="Delete Coupon">
          <IconButton size="small" color="error" onClick={() => handleDelete(row.id)}>
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  const rows = (data?.data as any)?.data || [];
  const total = (data?.data as any)?.meta?.total || 0;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Coupons</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => { reset(defaultValues); setDialogOpen(true); }}>
          Create Coupon
        </Button>
      </Box>

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

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>Create Coupon</DialogTitle>
          <DialogContent>
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Coupon Code" margin="normal" error={!!errors.code} helperText={errors.code?.message} />
              )}
            />
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth select label="Discount Type" margin="normal" error={!!errors.type} helperText={errors.type?.message}>
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                  <MenuItem value="free_ride">Free Ride</MenuItem>
                  <MenuItem value="referral">Referral</MenuItem>
                </TextField>
              )}
            />
            <Controller
              name="value"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Discount Value" type="number" margin="normal" error={!!errors.value} helperText={errors.value?.message} />
              )}
            />
            <Controller
              name="maxDiscount"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Max Discount (optional)" type="number" margin="normal" value={field.value ?? ''} />
              )}
            />
            <Controller
              name="minOrderAmount"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Min Order Amount (optional)" type="number" margin="normal" value={field.value ?? ''} />
              )}
            />
            <Controller
              name="maxUses"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Max Uses" type="number" margin="normal" error={!!errors.maxUses} helperText={errors.maxUses?.message} />
              )}
            />
            <Controller
              name="expiresAt"
              control={control}
              render={({ field }) => (
                <TextField {...field} fullWidth label="Expiry Date (optional)" type="date" margin="normal" InputLabelProps={{ shrink: true }} value={field.value ?? ''} />
              )}
            />
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <FormControlLabel control={<Switch checked={field.value} onChange={field.onChange} />} label="Active" sx={{ mt: 1 }} />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createCoupon.isPending}>
              {createCoupon.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
};
