import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Grid, Card, CardContent, Typography, Box, Paper,
} from '@mui/material';
import {
  People, DirectionsCar, Receipt, AttachMoney,
  TrendingUp, TrendingDown, OnlinePrediction, VerifiedUser,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { apiService } from '../services/api.service';

const weeklyData = [
  { day: 'Mon', rides: 45, revenue: 12000 },
  { day: 'Tue', rides: 52, revenue: 15000 },
  { day: 'Wed', rides: 38, revenue: 9800 },
  { day: 'Thu', rides: 61, revenue: 18500 },
  { day: 'Fri', rides: 55, revenue: 16200 },
  { day: 'Sat', rides: 72, revenue: 22000 },
  { day: 'Sun', rides: 48, revenue: 13500 },
];

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiService.getDashboardStats(),
  });

  const statCards = [
    { title: 'Total Users', value: '1,234', icon: <People />, color: '#6C63FF', trend: '+12%', up: true },
    { title: 'Total Drivers', value: '456', icon: <DirectionsCar />, color: '#00D09C', trend: '+8%', up: true },
    { title: 'Total Rides', value: '8,901', icon: <Receipt />, color: '#FF6B6B', trend: '+23%', up: true },
    { title: 'Revenue', value: '₹2.4L', icon: <AttachMoney />, color: '#FFA502', trend: '+15%', up: true },
    { title: 'Online Drivers', value: '89', icon: <OnlinePrediction />, color: '#00D09C', trend: '92% active' },
    { title: 'Pending KYC', value: '12', icon: <VerifiedUser />, color: '#FF6B6B', trend: 'Need review' },
  ];

  return (
    <Box>
      <Typography variant="h4" mb={3}>Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Welcome back, Admin. Here's your platform overview.
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card sx={{ '&:hover': { transform: 'translateY(-4px)', transition: '0.3s' } }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography color="text.secondary" variant="body2" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" fontWeight="bold">
                      {card.value}
                    </Typography>
                    <Box display="flex" alignItems="center" mt={1}>
                      {card.up
                        ? <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
                        : <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
                      }
                      <Typography variant="caption" color={card.up ? 'success.main' : 'error.main'}>
                        {card.trend}
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar sx={{ bgcolor: card.color, width: 48, height: 48 }}>
                    {card.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Weekly Revenue & Rides</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="revenue" fill="#6C63FF" name="Revenue (₹)" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="rides" fill="#00D09C" name="Rides" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" mb={2}>Recent Activity</Typography>
            <Box>
              {[1, 2, 3, 4, 5].map((i) => (
                <Box key={i} display="flex" alignItems="center" py={1} borderBottom="1px solid #f0f0f0">
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#6C63FF', mr: 1.5 }} />
                  <Box flex={1}>
                    <Typography variant="body2" fontWeight={500}>
                      New ride completed #{1000 + i}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {i} min ago
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

function Avatar({ children, sx }: any) {
  return (
    <Box sx={{
      width: 48, height: 48, borderRadius: '12px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', ...sx,
    }}>
      {children}
    </Box>
  );
}
