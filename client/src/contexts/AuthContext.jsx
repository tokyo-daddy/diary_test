import { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await authAPI.me();
            setUser(response.data.data);
        } catch (error) {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (username, password) => {
        const response = await authAPI.login(username, password);
        const { sessionId, ...userData } = response.data.data;
        if (sessionId) {
            localStorage.setItem('nikky_session_id', sessionId);
        }
        setUser(userData);
    };


    const logout = async () => {
        try {
            await authAPI.logout();
        } finally {
            localStorage.removeItem('nikky_session_id');
            setUser(null);
        }
    };


    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
