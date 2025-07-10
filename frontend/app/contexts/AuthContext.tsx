'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type AuthContextType = {
    userId: number | null;
    setUserId: (id: number | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [userId, setUserId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('user-id');
            return saved ? parseInt(saved, 10) : null;
        }
        return null;
    });

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
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 
