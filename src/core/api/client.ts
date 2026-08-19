import axios, {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { API_CONSTANTS } from "./constants/API_CONSTANTS";
import { store } from "@core/store/store";
import { logout } from "@core/store/auth/auth.slice";

export class ApiError extends Error {
  constructor(
    public status: number,
    msg: string,
    public details?: unknown
  ) {
    super(msg);
    this.name = "ApiError";
  }
}

/* ---------------------------------------------------------
   1. Axios Instance
--------------------------------------------------------- */
const axiosInstance = axios.create({
  baseURL: API_CONSTANTS.BASE_URL,
  timeout: API_CONSTANTS.TIMEOUT,
  headers: API_CONSTANTS.HEADERS,
});

/* ---------------------------------------------------------
   2. REQUEST Interceptor (token del store)
--------------------------------------------------------- */
axiosInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const state = store.getState();
    const token = state.auth.token; // token del store de Redux
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/* ---------------------------------------------------------
   3. RESPONSE Interceptor (401 => logout)
--------------------------------------------------------- */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      store.dispatch(logout());
    }
    return Promise.reject(error);
  }
);

/* ---------------------------------------------------------
   4. Central Error (payload del backend: { error, message, details })
--------------------------------------------------------- */
const handleError = (error: any): never => {
  if (error instanceof ApiError) throw error;

  const data = error?.response?.data as
    | { message?: string; details?: unknown }
    | undefined;
  const status = error?.response?.status ?? 0;
  const message =
    data?.message ?? error?.message ?? "Error de red o del servidor";
  throw new ApiError(status, message, data);
};

/* ---------------------------------------------------------
   5. Métodos (resuelven con la data cruda del backend)
--------------------------------------------------------- */
export const get = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.get(url, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const post = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.post(url, data, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const patch = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.patch(url, data, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const put = async <T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.put(url, data, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export const remove = async <T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const response: AxiosResponse<T> = await axiosInstance.delete(url, config);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

/* ---------------------------------------------------------
   API wrapper (compat con módulos existentes)
--------------------------------------------------------- */
export const api = {
  get: <T>(path: string, config?: AxiosRequestConfig) => get<T>(path, config),
  post: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    post<T>(path, body, config),
  put: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    put<T>(path, body, config),
  patch: <T>(path: string, body?: unknown, config?: AxiosRequestConfig) =>
    patch<T>(path, body, config),
  delete: <T>(path: string, config?: AxiosRequestConfig) => remove<T>(path, config),
};

export { axiosInstance };