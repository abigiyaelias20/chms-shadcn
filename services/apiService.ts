import axiosInstance from '@/lib/axiosInstance';
import { AxiosResponse } from 'axios';

export const apiService = {
  // Generic GET request
  get: <T>(url: string, config = {}): Promise<AxiosResponse<T>> => 
    axiosInstance.get<T>(url, config),

  // Generic POST request
  post: <T>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> => 
    axiosInstance.post<T>(url, data, config),

  // Generic PUT request
  put: <T>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> => 
    axiosInstance.put<T>(url, data, config),

  // Generic PATCH request
  patch: <T>(url: string, data?: any, config = {}): Promise<AxiosResponse<T>> => 
    axiosInstance.patch<T>(url, data, config),

  // Generic DELETE request
  delete: <T>(url: string, config = {}): Promise<AxiosResponse<T>> => 
    axiosInstance.delete<T>(url, config),
};