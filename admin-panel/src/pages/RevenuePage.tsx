import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Paper, Grid, Card, CardContent,
} from '@mui/material';
import {
  AttachMoney, TrendingUp, AccountBalance, Receipt,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { apiService } from '../services/api.service';

const monthlyData = [
  { month: 'Jan', revenue: 125000, rides: 1200 },
  { month: 'Feb', revenue: 145000, rides: 1350 },
  { month: 'Mar', revenue: 168000, rides: 1420 },
  { month: 'Apr', revenue: 152000, rides: 1380 },
  { month: 'May', revenue: 182000, rides: 1550 },
  { month: 'Jun', revenue: 198000, rides: 1680 },
  { month: 'Jul', revenue: 215000, rides: 1720 },
  { month: 'Aug', revenue: 205000, rides: 1650 },
  { month: 'Sep', revenue: 225000, rides: 1800 },
  { month: 'Oct', revenue: 240000, rides: 1900 },
  { month: 'Nov', revenue: 258000, rides: 2100 },
  { month: 'Dec', revenue: 285000, rides: 2350 },
];

function StatCard({ title, value, sub, icon, color }: any) {
  return (
    <Card sx={{ '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' } }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>{title}</Typography>
            <Typography variant="h4" fontWeight="bold">{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
          </Box>
          <Box sx={{ width: 48, height: 48, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: color, color: 'white' }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export const RevenuePage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['revenue'],
    queryFn: () => apiService.getRevenue(),
  });

  const revenueData = data?.data;

  const todayRevenue = revenueData?.today || 0;
  const weekRevenue = revenueData?.week || 0;
  const monthRevenue = revenueData?.month || 0;
  const totalRevenue = revenueData?.total || 0;

  return (
    <Box>
      <Typography variant="h4" mb={3}>Revenue</Typography>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Today's Revenue" value={`₹${(todayRevenue || 18500).toLocaleString()}`} icon={<AttachMoney />} color="#6C63FF" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="This Week" value={`₹${(weekRevenue || 98500).toLocaleString()}`} icon={<TrendingUp />} color="#00D09C" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="This Month" value={`₹${(monthRevenue || 425000).toLocaleString()}`} icon={<AccountBalance />} color="#FFA502" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Revenue" value={`₹${(totalRevenue || 2450000).toLocaleString()}`} icon={<Receipt />} color="#FF6B6B" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" mb={2}>Revenue Overview (Yearly)</Typography>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#6C63FF" strokeWidth={2} name="Revenue (₹)" dot={{ r: 4 }} />
            <Line yAxisId="right" type="monotone" dataKey="rides" stroke="#00D09C" strokeWidth={2} name="Rides" dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" mb={2}>Monthly Revenue Breakdown</Typography>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="revenue" fill="#6C63FF" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};
