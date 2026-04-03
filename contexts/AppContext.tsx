
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, ViewState } from '../types';
import * as api from '../services/api';

interface NotificationState {
    message: string;
    type: 'success' | 'error';
}

interface AppContextType {
    currentUser: User | null;
    currentView: ViewState;
    theme: 'light' | 'dark';
    searchTerm: string;
    locationFilter: { type: string; value: string };
    categoryFilter: string;
    isLoading: boolean;
    notification: NotificationState | null;
    favoriteIds: { posts: Set<string>; items: Set<string> };
    unreadCounts: { messages: number; appointments: number };
    login: (email: string, pass: string) => Promise<User | null>;
    loginWithGoogle: () => Promise<User | null>;
    logout: () => void;
    register: (name: string, email: string, pass: string) => Promise<User | null>;
    navigate: (page: ViewState['page'], props?: any) => void;
    toggleTheme: () => void;
    setSearchTerm: (term: string) => void;
    setLocationFilter: (filter: { type: string; value: string }) => void;
    setCategoryFilter: (category: string) => void;
    showNotification: (message: string, type?: 'success' | 'error') => void;
    updateCurrentUser: (user: User) => void;
    refreshFavorites: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState<ViewState>({ page: 'home' });
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [searchTerm, setSearchTerm] = useState('');
    const [locationFilter, setLocationFilter] = useState<{ type: string; value: string }>({ type: 'Cidade', value: '' });
    const [categoryFilter, setCategoryFilter] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState<NotificationState | null>(null);
    const [favoriteIds, setFavoriteIds] = useState<{ posts: Set<string>; items: Set<string> }>({ posts: new Set(), items: new Set() });
    const [unreadCounts, setUnreadCounts] = useState({ messages: 0, appointments: 0 });

    useEffect(() => {
        // Theme initialization
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) {
            setTheme(savedTheme);
        } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setTheme('dark');
        }
    }, []);

    useEffect(() => {
        // Apply theme to document
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    useEffect(() => {
        // Check for active session on load
        const checkUserSession = async () => {
            setIsLoading(true);
            const user = await api.checkSession();
            setCurrentUser(user);
            setIsLoading(false);
        };
        checkUserSession();
    }, []);
    
    // Load favorites and notifications when user changes
    useEffect(() => {
        if (currentUser) {
            refreshFavorites();
            refreshNotifications();
            // Poll for notifications
            const interval = setInterval(refreshNotifications, 10000); // 10s
            return () => clearInterval(interval);
        } else {
            setFavoriteIds({ posts: new Set(), items: new Set() });
            setUnreadCounts({ messages: 0, appointments: 0 });
        }
    }, [currentUser]);

    const refreshFavorites = async () => {
        if (!currentUser) return;
        const ids = await api.getUserFavoritesIds(currentUser.id);
        setFavoriteIds({
            posts: new Set(ids.posts),
            items: new Set(ids.items)
        });
    }

    const refreshNotifications = async () => {
        if (!currentUser) return;
        try {
            const counts = await api.getUnreadCount(currentUser.id);
            setUnreadCounts(counts);
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    }

    const navigate = (page: ViewState['page'], props: any = {}) => {
        window.scrollTo(0, 0);
        setCurrentView({ page, props });
    };

    const login = async (email: string, pass: string): Promise<User | null> => {
        setIsLoading(true);
        try {
            const user = await api.login(email, pass);
            if (user) {
                setCurrentUser(user);
                localStorage.setItem('sessionUserId', user.id);
                showNotification(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`, 'success');
                navigate(user.businessId ? 'dashboard' : 'home');
            }
            return user;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithGoogle = async (): Promise<User | null> => {
        setIsLoading(true);
        try {
            const user = await api.loginWithGoogle();
            if (user) {
                setCurrentUser(user);
                localStorage.setItem('sessionUserId', user.id);
                showNotification(`Bem-vindo de volta, ${user.name.split(' ')[0]}!`, 'success');
                navigate(user.businessId ? 'dashboard' : 'home');
            }
            return user;
        } catch (err: any) {
            showNotification(api.getErrorMessage(err, 'Erro ao fazer login com Google'), 'error');
            return null;
        } finally {
            setIsLoading(false);
        }
    };
    
    const register = async (name: string, email: string, pass: string): Promise<User | null> => {
        setIsLoading(true);
        try {
            const user = await api.register(name, email, pass);
            if (user) {
                showNotification('Conta criada com sucesso! Faça o login para continuar.', 'success');
                navigate('login');
            }
            return user;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('sessionUserId');
        navigate('home');
        showNotification('Você saiu da sua conta.', 'success');
    };
    
    const updateCurrentUser = (user: User) => {
        setCurrentUser(user);
    };

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3100); 
    };

    const value = {
        currentUser,
        currentView,
        theme,
        searchTerm,
        locationFilter,
        categoryFilter,
        isLoading,
        notification,
        favoriteIds,
        unreadCounts,
        login,
        loginWithGoogle,
        logout,
        register,
        navigate,
        toggleTheme,
        setSearchTerm,
        setLocationFilter,
        setCategoryFilter,
        showNotification,
        updateCurrentUser,
        refreshFavorites,
        refreshNotifications
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
