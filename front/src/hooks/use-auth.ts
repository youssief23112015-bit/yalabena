import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const setUser = (nextUser: User | null) => {
    if (!nextUser) {
      useAuthStore.getState().clearAuth();
      return;
    }

    const current = useAuthStore.getState();
    useAuthStore.setState({
      user: nextUser,
      isAuthenticated: true,
      isLoading: false,
      permissions: nextUser.permissions ?? current.permissions,
    });
  };

  return { user, isLoading, isAuthenticated, setUser };
}
