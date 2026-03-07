import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import {
    CalendarClock,
    Activity,
    FileText,
    MessageSquarePlus,
    Users,
    Timer,
    Building2,
    Star,
    ShieldCheck,
    ArrowRight,
    HeartPulse,
    Calendar
} from 'lucide-react';
import './Dashboard.css';

const Dashboard = ({ userRole }) => {
    const isAdmin = userRole === 'admin';
    const navigate = useNavigate();
    const [patientName, setPatientName] = useState('');

    // Patient Stats
    const [upcomingApt, setUpcomingApt] = useState(null);
    const [recentVisits, setRecentVisits] = useState([]);

    // Admin Stats
    const [totalPatients, setTotalPatients] = useState(0);
    const [facilityUsage, setFacilityUsage] = useState(0);
    const [avgFeedback, setAvgFeedback] = useState(0);
    const [patientsList, setPatientsList] = useState([]);
    const [recentBookings, setRecentBookings] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                if (isAdmin) {
                    // Fetch Admin stats
                    const { count: patientCount } = await supabase.from('patients').select('*', { count: 'exact', head: true });
                    if (patientCount !== null) setTotalPatients(patientCount);

                    const { data: facilities } = await supabase.from('facilities').select('utilization_rate');
                    if (facilities && facilities.length > 0) {
                        const avg = facilities.reduce((acc, curr) => acc + Number(curr.utilization_rate), 0) / facilities.length;
                        setFacilityUsage(Math.round(avg));
                    }

                    const { data: feedbacks } = await supabase.from('feedback').select('rating');
                    if (feedbacks && feedbacks.length > 0) {
                        const avgRating = feedbacks.reduce((acc, curr) => acc + Number(curr.rating), 0) / feedbacks.length;
                        setAvgFeedback(avgRating.toFixed(1));
                    }

                    const { data: registeredPatients } = await supabase.from('patients').select('id, first_name, last_name, email').limit(10);
                    if (registeredPatients) setPatientsList(registeredPatients);

                    const { data: bookings } = await supabase
                        .from('appointments')
                        .select('*, patients(first_name, last_name)')
                        .order('created_at', { ascending: false })
                        .limit(5);
                    if (bookings) setRecentBookings(bookings);

                } else {
                    // Fetch Patient stats
                    const user = auth.currentUser;
                    if (!user) {
                        setLoading(false);
                        return;
                    }

                    const { data: patient } = await supabase.from('patients').select('id, first_name').eq('firebase_uid', user.uid).single();
                    if (patient) {
                        setPatientName(patient.first_name);

                        // Fetch upcoming
                        const { data: upcoming } = await supabase
                            .from('appointments')
                            .select('*')
                            .eq('patient_id', patient.id)
                            .gte('appointment_date', new Date().toISOString().split('T')[0])
                            .order('appointment_date', { ascending: true })
                            .limit(1)
                            .maybeSingle();
                        if (upcoming) setUpcomingApt(upcoming);

                        // Fetch past visits
                        const { data: past } = await supabase
                            .from('appointments')
                            .select('*')
                            .eq('patient_id', patient.id)
                            .lt('appointment_date', new Date().toISOString().split('T')[0])
                            .order('appointment_date', { ascending: false })
                            .limit(3);
                        if (past) setRecentVisits(past);
                    }
                }
            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
            } finally {
                setLoading(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            fetchDashboardData();
        });
        return () => unsubscribe();
    }, [isAdmin]);

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="spinner"></div>
                <p>Preparing your wellness dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>Welcome back, {isAdmin ? 'Admin' : (patientName || 'Patient')}! 👋</h1>
                    <p className="subtitle">Here is what's happening today.</p>
                </div>
            </div>

            {!isAdmin ? (
                // Patient Dashboard
                <div className="dashboard-content fade-in">
                    <div className="grid-cards">
                        <div className="card highlight-card primary patient-welcome">
                            <div className="card-icon">
                                <CalendarClock size={24} color="white" />
                            </div>
                            <div className="card-info">
                                <h3>Next Consultation</h3>
                                {upcomingApt ? (
                                    <>
                                        <p>{upcomingApt.doctor_name}</p>
                                        <span>{upcomingApt.department} • {upcomingApt.appointment_date}</span>
                                    </>
                                ) : (
                                    <p>Schedule your next checkup</p>
                                )}
                            </div>
                        </div>

                        <div className="card highlight-card success">
                            <div className="card-icon">
                                <FileText size={24} color="white" />
                            </div>
                            <div className="card-info">
                                <h3>Medical Records</h3>
                                <p>Recent Lab Reports</p>
                                <span>2 Documents Available</span>
                            </div>
                        </div>

                        <div className="card highlight-card warning">
                            <div className="card-icon">
                                <Activity size={24} color="white" />
                            </div>
                            <div className="card-info">
                                <h3>Pulse Rate</h3>
                                <p>72 BPM</p>
                                <span>Updated just now</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-sections">
                        <div className="card recent-activity">
                            <h3>Recent Visits</h3>
                            <ul className="activity-list">
                                {recentVisits.length > 0 ? recentVisits.map(visit => (
                                    <li key={visit.id}>
                                        <div className="activity-icon"><Building2 size={16} /></div>
                                        <div className="activity-details">
                                            <h4>{visit.department}</h4>
                                            <p>{visit.doctor_name}</p>
                                        </div>
                                        <div className="activity-date">{visit.appointment_date}</div>
                                    </li>
                                )) : (
                                    <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>No recent visits found.</p>
                                )}
                            </ul>
                            <button className="btn-link">View All History <ArrowRight size={16} /></button>
                        </div>

                        <div className="card wellness-section">
                            <div className="wellness-header">
                                <HeartPulse size={20} color="var(--primary)" />
                                <h3>Personalized Wellness</h3>
                            </div>
                            <div className="tip-card">
                                <h4>💡 Daily Health Tip</h4>
                                <p>Drinking warm lemon water in the morning can help kickstart your metabolism and hydration.</p>
                            </div>
                            <div className="actions-grid">
                                <button className="action-btn" onClick={() => navigate('/appointments')}>
                                    <CalendarClock size={20} />
                                    Book New Slot
                                </button>
                                <button className="action-btn accent" onClick={() => navigate('/feedback')}>
                                    <MessageSquarePlus size={20} />
                                    Send Feedback
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Admin Dashboard
                <div className="dashboard-content fade-in">
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon blue"><Users size={20} /></div>
                                <span className="trend positive">+New</span>
                            </div>
                            <h3>Total Patients</h3>
                            <h2>{totalPatients}</h2>
                        </div>

                        <div className="stat-card admin-stat">
                            <div className="stat-header">
                                <div className="stat-icon purple"><Building2 size={20} /></div>
                            </div>
                            <h3>Facility Status</h3>
                            <h2>{facilityUsage}% <span className="stat-sub">Active</span></h2>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon green"><Star size={20} /></div>
                            </div>
                            <h3>Feedback Score</h3>
                            <h2>{avgFeedback > 0 ? avgFeedback : 'N/A'} <span style={{ fontSize: '0.5em' }}>/5</span></h2>
                        </div>

                        <div className="stat-card">
                            <div className="stat-header">
                                <div className="stat-icon teal"><ShieldCheck size={20} /></div>
                            </div>
                            <h3>Audit Health</h3>
                            <h2>Verified</h2>
                        </div>
                    </div>

                    <div className="dashboard-sections admin">
                        <div className="card patient-registry-card">
                            <div className="registry-header">
                                <h3>Patient Registry</h3>
                                <button className="btn-link" onClick={() => navigate('/appointments')}>View Appointments</button>
                            </div>
                            <div className="patient-list-admin">
                                {patientsList.map(pt => (
                                    <div key={pt.id} className="patient-row-simple">
                                        <div className="pt-avatar">
                                            {pt.first_name?.[0]}{pt.last_name?.[0]}
                                        </div>
                                        <div className="pt-info">
                                            <h4>{pt.first_name} {pt.last_name}</h4>
                                            <p>{pt.email}</p>
                                        </div>
                                        <div className="pt-id-tag">#{pt.id.slice(0, 5)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card admin-list-card">
                            <h3>Recent Appointments</h3>
                            <div className="booking-list-admin">
                                {recentBookings.length > 0 ? recentBookings.map(bk => (
                                    <div key={bk.id} className="booking-row-simple">
                                        <div className="bk-details">
                                            <strong>{bk.patients?.first_name} {bk.patients?.last_name}</strong>
                                            <span>booked <b>{bk.doctor_name}</b></span>
                                        </div>
                                        <div className="bk-time">
                                            <Calendar size={12} /> {bk.appointment_date}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="empty-msg">No recent bookings</p>
                                )}
                            </div>
                            <button className="btn-link mt-2" onClick={() => navigate('/appointments')}>View All Schedule</button>
                        </div>

                        <div className="card admin-actions-card">
                            <h3>Administrative Actions</h3>
                            <div className="vertical-actions">
                                <button className="action-btn wide" onClick={() => navigate('/appointments')}>
                                    <Calendar size={20} />
                                    Manage All Schedules
                                </button>
                                <button className="action-btn wide accent" onClick={() => navigate('/feedback')}>
                                    <Star size={20} />
                                    Review Patient Feedback
                                </button>
                                <button className="action-btn wide outline" onClick={() => navigate('/nabh')}>
                                    <ShieldCheck size={20} />
                                    Audit Compliance
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
