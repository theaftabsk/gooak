import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { customerApi } from '../../../lib/api-client';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at?: string;
}

interface CustomerContextType {
  customer: Customer | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const TOKEN_KEY = 'sf_customer_token';

const CustomerContext = createContext<CustomerContextType>({
  customer: null,
  token: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refresh: async () => {},
});

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    if (!stored) { setIsLoading(false); return; }
    try {
      setToken(stored);
      const me = await customerApi.getMe(stored);
      setCustomer(me);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const res = await customerApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setCustomer(res.customer);
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    const res = await customerApi.register({ name, email, password, phone });
    localStorage.setItem(TOKEN_KEY, res.token);
    setToken(res.token);
    setCustomer(res.customer);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  };

  return (
    <CustomerContext.Provider value={{ customer, token, isLoading, login, register, logout, refresh }}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => useContext(CustomerContext);
