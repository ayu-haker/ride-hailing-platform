import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Typography, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
  DialogContentText, DialogActions, Button, TextField,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { apiService } from '../services/api.service';
import { KYC } from '../types';

export const KYCPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedKyc, setSelectedKyc] = useState<KYC | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['kyc'],
    queryFn: () => apiService.getPendingKYC(),
  });

  const processKyc = useMutation({
    mutationFn: ({ documentId, status, reason }: { documentId: string; status: string; reason?: string }) =>
      apiService.processKYC(documentId, status, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc'] });
      toast.success('KYC status updated');
      setRejectDialogOpen(false);
      setSelectedKyc(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (doc: KYC) => {
    processKyc.mutate({ documentId: doc.id, status: 'verified' });
  };

  const handleReject = () => {
    if (!selectedKyc) return;
    processKyc.mutate({ documentId: selectedKyc.id, status: 'rejected', reason: rejectionReason || undefined });
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'driverId', headerName: 'Driver ID', width: 100 },
    {
      field: 'kycType', headerName: 'Document Type', width: 160,
      valueFormatter: (value: string) => value?.replace(/_/g, ' ')?.replace(/\b\w/g, (c) => c.toUpperCase()) || value,
    },
    { field: 'documentNumber', headerName: 'Doc Number', width: 140 },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: ({ row }) => {
        const color = row.status === 'verified' ? 'success' : row.status === 'pending' ? 'warning' : row.status === 'rejected' ? 'error' : 'default';
        return <Chip label={row.status} size="small" color={color} />;
      },
    },
    {
      field: 'createdAt', headerName: 'Submitted', width: 120,
      valueFormatter: (value: string) => new Date(value).toLocaleDateString(),
    },
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View Document">
            <IconButton size="small" color="info" onClick={() => window.open(row.documentUrl, '_blank')}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>
          {row.status === 'pending' && (
            <>
              <Tooltip title="Approve">
                <IconButton size="small" color="success" onClick={() => handleApprove(row)}>
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton size="small" color="error" onClick={() => { setSelectedKyc(row); setRejectDialogOpen(true); }}>
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  const rows = (data?.data as any)?.data || [];
  const total = (data?.data as any)?.meta?.total || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>KYC Verification</Typography>
      <Box sx={{ height: 600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          rowCount={total}
          paginationMode="server"
          initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
          pageSizeOptions={[10]}
          disableRowSelectionOnClick
          getRowId={(row) => row.id}
        />
      </Box>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject KYC Document</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Provide a reason for rejecting this KYC document.
          </DialogContentText>
          <TextField
            autoFocus
            fullWidth
            label="Rejection Reason"
            multiline
            rows={3}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleReject} color="error" variant="contained" disabled={processKyc.isPending}>
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
