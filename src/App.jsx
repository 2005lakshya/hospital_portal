import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import Facilities from './pages/Facilities';
import Feedback from './pages/Feedback';
import NABH from './pages/NABH';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { auth } from './firebase';
import { supabase } from './supabase';
import './App.css';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || null);
  const [profileComplete, setProfileComplete] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkProfile = async (user) => {
      if (userRole === 'patient' && user) {
        const { data } = await supabase
          .from('patients')
          .select('phone, age, gender')
          .eq('firebase_uid', user.uid)
          .single();

        if (!data || !data.phone || !data.age || !data.gender) {
          setProfileComplete(false);
          if (window.location.pathname !== '/profile' && window.location.pathname !== '/login') {
            navigate('/profile', { replace: true });
          }
        } else {
          setProfileComplete(true);
        }
      } else {
        setProfileComplete(true);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkProfile(user);
      } else if (!userRole && window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      } else if (userRole === 'admin') {
        setProfileComplete(true);
      }
    });

    return () => unsubscribe();
  }, [userRole, navigate]);

  const handleLogin = (role) => {
    setUserRole(role);
    localStorage.setItem('userRole', role);
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('userRole');
    navigate('/login', { replace: true });
  };

  if (!userRole) {
    return (
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onLogout={handleLogout} userRole={userRole} profileIncomplete={!profileComplete} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={profileComplete ? <Dashboard userRole={userRole} /> : <Navigate to="/profile" />} />
          <Route path="/appointments" element={profileComplete ? <Appointments userRole={userRole} /> : <Navigate to="/profile" />} />
          <Route path="/facilities" element={profileComplete ? <Facilities userRole={userRole} /> : <Navigate to="/profile" />} />
          <Route path="/feedback" element={profileComplete ? <Feedback userRole={userRole} /> : <Navigate to="/profile" />} />
          <Route path="/nabh" element={profileComplete ? <NABH userRole={userRole} /> : <Navigate to="/profile" />} />
          <Route path="/profile" element={<Profile onUpdate={() => setProfileComplete(true)} />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
