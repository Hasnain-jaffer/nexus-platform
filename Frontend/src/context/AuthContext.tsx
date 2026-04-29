import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole, AuthContextType } from '../types';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = 'business_nexus_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount, then verify token with /auth/me
  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed); // optimistic — avoids flash of login page
        // Verify token is still valid with the backend
        authService.getMe()
          .then((freshUser) => {
            // Keep token from storage since /me doesn't return it
            setUser({ ...freshUser, token: parsed.token });
          })
          .catch(() => {
            // Token expired or invalid — log out
            localStorage.removeItem(USER_STORAGE_KEY);
            setUser(null);
          })
          .finally(() => setIsLoading(false));
      } catch {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  const persistUser = (u: User) => {
    setUser(u);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
  };

  const login = async (email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const loggedIn = await authService.login(email, password, role);
      persistUser(loggedIn);
      toast.success(`Welcome back, ${loggedIn.name}!`);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role: UserRole): Promise<void> => {
    setIsLoading(true);
    try {
      const newUser = await authService.register(name, email, password, role);
      persistUser(newUser);
      toast.success('Account created successfully!');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    toast.success('Logged out successfully');
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email);
      toast.success('If an account exists, reset instructions have been sent');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Something went wrong';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (token: string, newPassword: string): Promise<void> => {
    try {
      await authService.resetPassword(token, newPassword);
      toast.success('Password reset successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Reset failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const updateProfile = async (userId: string, updates: Partial<User>): Promise<void> => {
    try {
      const updated = await userService.updateProfile(userId, updates);
      // Preserve the JWT token that was already in state
      const withToken = { ...updated, token: user?.token };
      persistUser(withToken);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Update failed';
      toast.error(msg);
      throw new Error(msg);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
