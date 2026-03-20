import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, roles }) => {
    const { isAuthenticated, isInitialized, authError, hasRole, login } = useAuth();

    // Debug logging
    useEffect(() => {
        console.log('[ProtectedRoute] Auth State:', {
            isInitialized,
            isAuthenticated,
            authError,
            timestamp: new Date().toISOString(),
        });
    }, [isInitialized, isAuthenticated, authError]);

    if (!isInitialized) {
        console.log('[ProtectedRoute] Waiting for Auth0 initialization...');
        return (
            <div className="loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-body)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
                    <p style={{ color: 'var(--text-secondary, #555)' }}>Loading authentication...</p>
                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>Initializing Auth0...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        console.warn('[ProtectedRoute] User not authenticated. Triggering login...', {
            authError,
            origin: window.location.origin,
        });

        if (authError) {
            console.error('[ProtectedRoute] Auth Error:', authError);
            return (
                <div className="loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-body)' }}>
                    <div style={{ textAlign: 'center', maxWidth: 680, padding: '0 1rem' }}>
                        <h2 style={{ marginBottom: '0.8rem' }}>❌ Authentication Error</h2>
                        <p style={{ color: 'var(--text-secondary, #555)', marginBottom: '0.6rem', fontFamily: 'monospace', fontSize: '0.9rem' }}>{authError}</p>
                        <p style={{ color: 'var(--text-secondary, #555)', marginBottom: '1rem' }}>Please check the browser console for details.</p>
                        <button
                            onClick={() => {
                                console.log('[ProtectedRoute] Manual login triggered');
                                login();
                            }}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                            }}
                        >
                            Try Login Again
                        </button>
                    </div>
                </div>
            );
        }

        // Not authenticated and no error - trigger login
        console.log('[ProtectedRoute] Calling login() to redirect to Auth0');
        login();

        return (
            <div className="loading-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-body)' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔐</div>
                    <p style={{ color: 'var(--text-secondary, #555)' }}>Redirecting to Auth0 login...</p>
                    <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '1rem' }}>If not redirected, check console for errors</p>
                </div>
            </div>
        );
    }

    if (roles && roles.length > 0) {
        const hasRequiredRole = roles.some(role => hasRole(role));
        if (!hasRequiredRole) {
            console.warn('[ProtectedRoute] User does not have required role', { required: roles });
            return <Navigate to="/unauthorized" replace />;
        }
    }

    console.log('[ProtectedRoute] Authenticated user. Rendering content.');
    return <>{children}</>;
};
