import React, { createContext, useContext, useEffect, useState } from "react";
import { checkAuth, login as apiLogin, logout as apiLogout } from "./api";

interface AuthContextType {
    user: { username: string, roles: string[] } | null;
    isLoading: boolean;
    login: (u: string, p: string) => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    isContributor: boolean;
    isReviewer: boolean;
    canMutate: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<{ username: string, roles: string[] } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuth()
            .then((data) => {
                if (data.isAuthenticated) {
                    setUser({ username: data.username, roles: data.roles || [] });
                } else {
                    setUser(null);
                }
            })
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    async function login(u: string, p: string) {
        await apiLogin(u, p);
        const data = await checkAuth();
        if (data.isAuthenticated) {
            setUser({ username: data.username, roles: data.roles || [] });
        } else {
            throw new Error("Login failed to establish session");
        }
    }

    async function logout() {
        try {
            await apiLogout();
        } catch (e) { console.error(e); }
        setUser(null);
    }

    const isAdmin = user?.roles.includes("Admin") || false;
    const isContributor = user?.roles.includes("Contributor") || false;
    const isReviewer = user?.roles.includes("Reviewer") || false;
    const canMutate = isAdmin || isContributor;

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin, isContributor, isReviewer, canMutate }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
