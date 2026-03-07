import { useState } from 'react';
import { Mail, Lock, User, ShieldCheck } from 'lucide-react';
import { auth, provider, signInWithPopup } from '../firebase';
import { supabase } from '../supabase';
import './Login.css';

const Login = ({ onLogin }) => {
    const [isLoginView, setIsLoginView] = useState(true);
    const [authMode, setAuthMode] = useState('patient'); // 'patient' or 'admin'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = (e) => {
        e.preventDefault();
        if (email === 'admin' && password === 'admin') {
            onLogin('admin');
        } else {
            setError('Invalid admin credentials. Hint: use admin/admin');
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Save user to Supabase
            const { error: dbError } = await supabase
                .from('patients')
                .upsert({
                    firebase_uid: user.uid,
                    email: user.email,
                    first_name: user.displayName?.split(' ')[0] || 'Patient',
                    last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
                }, { onConflict: 'firebase_uid' });

            if (dbError) {
                console.error("Supabase Sync Error:", dbError);
                // We still proceed as the user is authenticated with Firebase
            }

            onLogin('patient');
        } catch (err) {
            console.error("Firebase Auth Error:", err);
            if (err.code === 'auth/popup-blocked') {
                setError('Popup blocked by browser. Please allow popups for this site.');
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError('Login cancelled. Please try again.');
            } else if (err.code === 'auth/network-request-failed') {
                setError('Network error. Check your internet connection.');
            } else {
                setError(err.message || 'Failed to authenticate with Google.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card fade-in">
                <div className="login-header">
                    <ShieldCheck size={48} className="logo-icon-login" />
                    <h2>SmartCare Portal</h2>
                    <p>Sign in to access your dashboard</p>
                </div>

                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${authMode === 'patient' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('patient'); setError(''); }}
                    >
                        <User size={18} /> Patient
                    </button>
                    <button
                        className={`auth-tab ${authMode === 'admin' ? 'active' : ''}`}
                        onClick={() => { setAuthMode('admin'); setError(''); }}
                    >
                        <ShieldCheck size={18} /> Admin
                    </button>
                </div>

                {error && <div className="error-message">{error}</div>}

                {authMode === 'patient' ? (
                    <div className="patient-auth">
                        <div className="auth-toggle">
                            <button
                                className={isLoginView ? 'active' : ''}
                                onClick={() => setIsLoginView(true)}
                            >
                                Log In
                            </button>
                            <button
                                className={!isLoginView ? 'active' : ''}
                                onClick={() => setIsLoginView(false)}
                            >
                                Sign Up
                            </button>
                        </div>

                        <p className="auth-desc">
                            {isLoginView
                                ? 'Welcome back! Log in with your Google account.'
                                : 'New to SmartCare? Sign up instantly with Google.'}
                        </p>

                        <button
                            className={`google-btn ${loading ? 'loading' : ''}`}
                            onClick={handleGoogleAuth}
                            disabled={loading}
                        >
                            {loading ? (
                                <span>Authenticating...</span>
                            ) : (
                                <>
                                    <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                                        <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                                            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
                                            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
                                            <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
                                            <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
                                        </g>
                                    </svg>
                                    <span>{isLoginView ? 'Sign in with Google' : 'Sign up with Google'}</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <form className="admin-auth" onSubmit={handleAdminLogin}>
                        <div className="input-group">
                            <label>Username</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="text"
                                    placeholder="Enter admin username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    placeholder="Enter admin password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button type="submit" className="login-submit-btn">
                            Login to Admin Panel
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Login;
