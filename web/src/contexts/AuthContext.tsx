import React, { createContext, useContext, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { setTokenGetter } from '../lib/axios';

interface AuthContextType {
    isAuthenticated: boolean;
    isInitialized: boolean;
    authError: string | null;
    user: any;
    login: () => void;
    logout: () => void;
    hasRole: (role: string) => boolean;
    getAccessToken: () => Promise<string | undefined>;
}

export const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isInitialized: false,
    authError: null,
    user: null,
    login: () => { },
    logout: () => { },
    hasRole: () => false,
    getAccessToken: async () => undefined,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const {
        isAuthenticated,
        isLoading,
        error,
        user: auth0User,
        loginWithRedirect,
        logout: auth0Logout,
        getAccessTokenSilently,
    } = useAuth0();

    const user = auth0User
        ? {
            sub: auth0User.sub,
            username: auth0User.nickname,
            firstName: auth0User.given_name,
            lastName: auth0User.family_name,
            email: auth0User.email,
            name: auth0User.name,
            picture: auth0User.picture,
            // Custom roles claim set in Auth0 Actions
            roles: (auth0User[`${import.meta.env.VITE_AUTH0_AUDIENCE}/roles`] ||
                auth0User['https://department-platform/roles'] || []) as string[],
        }
        : null;

    const login = () => {
        console.log('[AuthContext] Initiating login with Auth0');
        loginWithRedirect();
    };
    
    const logout = () =>
        auth0Logout({ logoutParams: { returnTo: window.location.origin } });

    const hasRole = (role: string): boolean =>
        (user?.roles ?? []).includes(role);

    const getAccessToken = async (): Promise<string | undefined> => {
        try {
            return await getAccessTokenSilently({
                authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
            });
        } catch (err) {
            console.error('[AuthContext] Error getting access token:', err);
            return undefined;
        }
    };

    // Initialize axios token getter so Bearer tokens are attached to API requests
    useEffect(() => {
        if (isAuthenticated) {
            setTokenGetter(getAccessToken);
        }
    }, [isAuthenticated, getAccessToken]);

    // Debug logging for auth state
    useEffect(() => {
        console.log('[AuthContext] Auth state updated:', {
            isLoading,
            isAuthenticated,
            error: error?.message || null,
            userEmail: user?.email || null,
            isInitialized: !isLoading,
            timestamp: new Date().toISOString(),
        });
    }, [isLoading, isAuthenticated, error, user]);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isInitialized: !isLoading,
                authError: error ? error.message : null,
                user,
                login,
                logout,
                hasRole,
                getAccessToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
