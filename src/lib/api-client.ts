 
import { env } from 'process';
import { ApiResponse, User, Test, Attempt, UserRole } from '../types';
import { log } from 'console';

// Detect base API URL
export const getApiUrl = (): string => {
  let url = (import.meta as any).env?.VITE_API_URL;
  console.log(url);
  

  if (url && !url.endsWith('/api/v1')) {
    url = `${url.replace(/\/$/, '')}/api/v1`;
  }
  return url;
};

const API_BASE = getApiUrl();

export class ApiError extends Error {
  statusCode: number;
  errors?: any[];

  constructor(message: string, statusCode: number, errors?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/**
 * Common fetch utility with credentials and unified error response parsing
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  // Set default headers
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Crucial for cookies/session
  };

  try {
    let response = await fetch(url, mergedOptions);
    
    // Automatically intercept 401 responses and attempt a quiet token refresh
    if (response.status === 401 && !endpoint.includes('/auth/refreshToken') && !endpoint.includes('/auth/loginUser')) {
      try {
        const refreshUrl = `${API_BASE}/users/auth/refreshToken`;
        const refreshResponse = await fetch(refreshUrl, {
          method: 'POST',
          credentials: 'include',
        });
        
        if (refreshResponse.ok) {
          // Token refreshed successfully! Re-fetch the original API request.
          response = await fetch(url, mergedOptions);
        } else {
          // Failed refresh. Let the application know to kick user out.
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('unauthorized-api-call'));
          }
        }
      } catch (refreshErr) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unauthorized-api-call'));
        }
      }
    }
    
    let responseData: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      responseData = { message: text || `Status code: ${response.status}` };
    }

    if (!response.ok) {
      // The server could return standard ApiResponse with success = false or simple { message }
      const errMessage = responseData.message || responseData.error || 'Request failed';
      throw new ApiError(errMessage, response.status, responseData.errors);
    }

    // Some endpoints may return { success: true, statusCode: 200, data, message }
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return responseData as ApiResponse<T>;
    } else {
      // Conforming to ApiResponse format for other types of requests
      return {
        success: true,
        statusCode: response.status,
        data: responseData as T,
        message: responseData?.message || 'Successful request',
      };
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Generic error fallback
    throw new ApiError(
      error instanceof Error ? error.message : 'Network failure or CORS restriction. Please check your connectivity.',
      500
    );
  }
}
