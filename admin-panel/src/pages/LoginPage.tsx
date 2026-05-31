import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Typography, Button, CircularProgress, Stepper, Step, StepLabel, Alert,
} from '@mui/material';
import toast from 'react-hot-toast';
import axios from 'axios';
import { AppConfig } from '../config/app.config';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('+911234567890');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const sendOtp = async () => {
    if (!phone.startsWith('+')) { toast.error('Phone must include country code (e.g. +911234567890)'); return; }
    setLoading(true);
    setDevOtp('');
    setOtpError('');
    try {
      await axios.post(`${AppConfig.apiBaseUrl}/auth/send-otp`, { phone });
      toast.success('OTP sent!');

      pollRef.current = setInterval(async () => {
        try {
          const res = await axios.get('http://localhost:3001/auth/dev-otp', { params: { phone: phone.replace('+', '') } });
          if (res.data?.otp) {
            setDevOtp(res.data.otp);
            if (pollRef.current) clearInterval(pollRef.current);
          }
        } catch {}
      }, 500);

      setStep(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.error?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setOtpError('');
    try {
      const res = await axios.post(`${AppConfig.apiBaseUrl}/auth/verify-otp`, { phone, otp });
      const token = res.data?.data?.tokens?.accessToken;
      if (token) {
        localStorage.setItem(AppConfig.tokenKey, token);
        toast.success('Login successful');
        navigate('/');
      } else {
        setOtpError('No token in response');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'Verification failed';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h4" textAlign="center" mb={1} color="primary" fontWeight="bold">
            RideR Admin
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" mb={3}>
            Sign in with your phone
          </Typography>
          <Stepper activeStep={step} sx={{ mb: 3 }}>
            <Step><StepLabel>Phone</StepLabel></Step>
            <Step><StepLabel>OTP</StepLabel></Step>
          </Stepper>
          {step === 0 ? (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); sendOtp(); }} noValidate>
              <TextField fullWidth label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+911234567890" margin="normal" autoFocus />
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 3, py: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
              </Button>
            </Box>
          ) : (
            <Box component="form" onSubmit={(e) => { e.preventDefault(); verifyOtp(); }} noValidate>
              <TextField fullWidth label="OTP" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="Enter 6-digit OTP" margin="normal" autoFocus />
              {devOtp && (
                <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
                  Dev OTP: <strong>{devOtp}</strong>
                </Alert>
              )}
              {!devOtp && (
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={1}>
                  Fetching OTP...
                </Typography>
              )}
              {otpError && (
                <Alert severity="error" sx={{ mt: 1 }}>{otpError}</Alert>
              )}
              <Button fullWidth type="submit" variant="contained" size="large" disabled={loading || !otp} sx={{ mt: 2, py: 1.5 }}>
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
              </Button>
              <Button fullWidth size="small" sx={{ mt: 1 }} onClick={() => { setStep(0); setDevOtp(''); setOtpError(''); if (pollRef.current) clearInterval(pollRef.current); }}>
                Change phone
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
