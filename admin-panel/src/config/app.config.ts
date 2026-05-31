export const AppConfig = {
  appName: 'RideR Admin',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000',
  tokenKey: 'admin_token',
  refreshTokenKey: 'admin_refresh_token',
  pageSize: 10,
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm:ss',
};
