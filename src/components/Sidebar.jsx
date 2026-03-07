import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    CalendarCheck,
    Building2,
    MessageSquare,
    FileCheck2,
    User,
    LogOut,
    Cross
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onLogout, userRole, profileIncomplete }) => {
    const navItems = [
        { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
        { name: 'Appointments', path: '/appointments', icon: <CalendarCheck size={18} /> },
        { name: 'Facilities', path: '/facilities', icon: <Building2 size={18} /> },
        { name: 'Feedback', path: '/feedback', icon: <MessageSquare size={18} /> },
        { name: userRole === 'admin' ? 'NABH Audit' : 'Guidelines', path: '/nabh', icon: <FileCheck2 size={18} /> },
        { name: 'Profile', path: '/profile', icon: <User size={18} /> },
    ];

    return (
        <header className="navbar-top">
            <div className="navbar-container glass">
                <div className="navbar-logo">
                    <Cross className="logo-icon" size={24} />
                    <span className="logo-text">SmartCare</span>
                </div>

                <nav className="navbar-links">
                    {navItems.map((item) => {
                        const isDisabled = profileIncomplete && item.path !== '/profile';
                        return (
                            <NavLink
                                key={item.path}
                                to={isDisabled ? '#' : item.path}
                                className={({ isActive }) => `navbar-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                                onClick={(e) => isDisabled && e.preventDefault()}
                            >
                                <span className="navbar-icon">{item.icon}</span>
                                <span>{item.name}</span>
                            </NavLink>
                        );
                    })}
                </nav>

                <div className="navbar-footer">
                    <div className="user-profile-simple">
                        <div className="avatar">
                            {userRole === 'admin' ? 'AD' : 'PT'}
                        </div>
                    </div>
                    <button className="logout-btn-nav" onClick={onLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Mobile Nav */}
            <nav className="mobile-nav glass">
                {navItems.slice(0, 5).map((item) => {
                    const isDisabled = profileIncomplete && item.path !== '/profile';
                    return (
                        <NavLink
                            key={item.path}
                            to={isDisabled ? '#' : item.path}
                            className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={(e) => isDisabled && e.preventDefault()}
                        >
                            {item.icon}
                            <span className="mobile-nav-label">{item.name}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </header>
    );
};

export default Sidebar;
