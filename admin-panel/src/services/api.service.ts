import axios, { AxiosInstance, AxiosError } from 'axios';
import { AppConfig } from '../config/app.config';
import toast from 'react-hot-toast';
import { ApiResponse } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: AppConfig.apiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000,
    });

    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem(AppConfig.tokenKey);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(AppConfig.tokenKey);
          localStorage.removeItem(AppConfig.refreshTokenKey);
          window.location.href = '/login';
        }
        const message = (error.response?.data as any)?.error?.message || 'An error occurred';
        toast.error(message);
        return Promise.reject(error);
      },
    );
  }

  async get<T>(url: string, params?: any): Promise<T> {
    const { data } = await this.api.get<T>(url, { params });
    return data;
  }

  async post<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.api.post<T>(url, body);
    return data;
  }

  async put<T>(url: string, body?: any): Promise<T> {
    const { data } = await this.api.put<T>(url, body);
    return data;
  }

  async delete<T>(url: string): Promise<T> {
    const { data } = await this.api.delete<T>(url);
    return data;
  }

  // Dashboard
  async getDashboardStats() {
    return this.get<ApiResponse<any>>('/admin/dashboard');
  }

  // Users
  async getUsers(params?: any) {
    return this.get<ApiResponse<any>>('/admin/users', params);
  }

  async getUser(id: string) {
    return this.get<ApiResponse<any>>(`/admin/users/${id}`);
  }

  async blockUser(id: string) {
    return this.put<ApiResponse<any>>(`/admin/users/${id}/block`);
  }

  async unblockUser(id: string) {
    return this.put<ApiResponse<any>>(`/admin/users/${id}/unblock`);
  }

  // Drivers
  async getDrivers(params?: any) {
    return this.get<ApiResponse<any>>('/admin/drivers', params);
  }

  async getDriver(id: string) {
    return this.get<ApiResponse<any>>(`/admin/drivers/${id}`);
  }

  async updateDriverCommission(id: string, rate: number) {
    return this.put<ApiResponse<any>>(`/admin/drivers/${id}/commission`, { commissionRate: rate });
  }

  // KYC
  async getPendingKYC() {
    return this.get<ApiResponse<any>>('/admin/kyc/pending');
  }

  async processKYC(documentId: string, status: string, rejectionReason?: string) {
    return this.put<ApiResponse<any>>(`/admin/kyc/${documentId}/process`, { status, rejectionReason });
  }

  // Rides
  async getRides(params?: any) {
    return this.get<ApiResponse<any>>('/admin/rides', params);
  }

  async getRide(id: string) {
    return this.get<ApiResponse<any>>(`/admin/rides/${id}`);
  }

  // Revenue
  async getRevenue(params?: any) {
    return this.get<ApiResponse<any>>('/admin/revenue', params);
  }

  // Coupons
  async getCoupons(params?: any) {
    return this.get<ApiResponse<any>>('/admin/coupons', params);
  }

  async createCoupon(data: any) {
    return this.post<ApiResponse<any>>('/admin/coupons', data);
  }

  async updateCoupon(id: string, data: any) {
    return this.put<ApiResponse<any>>(`/admin/coupons/${id}`, data);
  }

  async deleteCoupon(id: string) {
    return this.delete<ApiResponse<any>>(`/admin/coupons/${id}`);
  }

  // Config
  async getSystemConfig(key: string) {
    return this.get<ApiResponse<any>>(`/admin/config/${key}`);
  }

  async upsertSystemConfig(data: { key: string; value: any; description?: string }) {
    return this.post<ApiResponse<any>>('/admin/config', data);
  }
}

export const apiService = new ApiService();
