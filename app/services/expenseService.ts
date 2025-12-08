import * as SecureStore from "expo-secure-store";

// const API_URL = process.env.EXPO_PUBLIC_API_URL; 
import Constants from "expo-constants";

const API_URL = Constants.expoConfig?.extra?.apiUrl as string;
// ⚠️ replace with your local IP or backend URL

export interface Expense {
  id?: string;
  title: string;
  category: string;
  amount: number;
  date: string;
}

export interface PaginatedExpenses {
  data: Expense[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

// Helper for authenticated fetch
const apiClient = async (endpoint: string, options: RequestInit = {}) => {
  const token = await SecureStore.getItemAsync("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
};

// Fetch all expenses
export const getExpenses = async (page: number = 1): Promise<PaginatedExpenses> => {
  return apiClient(`/api/smart/expenses?page=${page}`);
};

// Create a new expense
export const createExpense = async (expense: Expense): Promise<Expense> => {
  return apiClient("/api/smart/expenses", {
    method: "POST",
    body: JSON.stringify(expense),
  });
};

// Update an existing expense
export const updateExpense = async (id: string, expense: Expense): Promise<Expense> => {
  return apiClient(`/api/smart/expenses/${id}`, {
    method: "POST", // use PUT instead of POST
    body: JSON.stringify(expense),
  });
};

// Delete an expense
export const deleteExpense = async (id: string): Promise<void> => {
  await apiClient(`/api/smart/expenses/${id}`, { method: "DELETE" });
};
