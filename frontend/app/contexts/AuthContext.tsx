'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type AuthContextType = {
    userId: number | null;
    setUserId: (id: number | null) => void;
    isHydrated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [userId, setUserId] = useState<number | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user-id');
            setUserId(saved ? parseInt(saved, 10) : null);
            setIsHydrated(true);
        }
    }, []);

    const handleSetUserId = (id: number | null) => {
        setUserId(id);
        if (typeof window !== 'undefined') {
            if (id !== null) {
                localStorage.setItem('user-id', id.toString());
            } else {
                localStorage.removeItem('user-id');
            }
        }
    };

    const value = {
        userId,
        setUserId: handleSetUserId,
        isHydrated,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 
