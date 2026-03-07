import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import {
    Calendar,
    Clock,
    UserCircle,
    Stethoscope,
    ChevronRight,
    Filter,
    Search,
    User
} from 'lucide-react';
import './Appointments.css';

const Appointments = ({ userRole }) => {
    const isAdmin = userRole === 'admin';
    const [activeTab, setActiveTab] = useState('upcoming');
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingApt, setEditingApt] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Booking Form State
    const [newDept, setNewDept] = useState('');
    const [newDoctor, setNewDoctor] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');

    const fetchAppointments = async () => {
        setLoading(true);
        if (isAdmin) {
            // Admin fetches ALL appointments with patient details
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (first_name, last_name, email)
                `)
                .order('appointment_date', { ascending: true });
            if (data) setAppointments(data);
        } else {
            // Patient fetches only their own
            const user = auth.currentUser;
            if (!user) return;
            const { data: patientData } = await supabase
                .from('patients')
                .select('id')
                .eq('firebase_uid', user.uid)
                .single();

            if (patientData) {
                const { data } = await supabase
                    .from('appointments')
                    .select('*')
                    .eq('patient_id', patientData.id)
                    .order('appointment_date', { ascending: true });
                if (data) setAppointments(data);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user || isAdmin) fetchAppointments();
        });
        return () => unsubscribe();
    }, [isAdmin]);

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        const user = auth.currentUser;
        if (!user) return alert("Must be logged in to book.");

        const { data: patientData } = await supabase
            .from('patients')
            .select('id')
            .eq('firebase_uid', user.uid)
            .single();

        if (patientData) {
            const payload = {
                patient_id: patientData.id,
                doctor_name: newDoctor,
                department: newDept,
                appointment_date: newDate,
                appointment_time: newTime,
                status: 'Booked',
                wait_time: 'N/A'
            };

            const { error } = await supabase.from('appointments').insert([payload]);

            if (error) {
                console.error("Error booking:", error);
                alert("Failed to book appointment.");
            } else {
                setShowBookingModal(false);
                fetchAppointments();
                resetForm();
            }
        }
    };

    const handleDeleteAppointment = async (id) => {
        if (!window.confirm("Are you sure you want to cancel/delete this appointment?")) return;

        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Error deleting appointment.");
        } else {
            fetchAppointments();
        }
    };

    const handleEditClick = (apt) => {
        setEditingApt(apt);
        setNewDept(apt.department);
        setNewDoctor(apt.doctor_name);
        setNewDate(apt.appointment_date);
        setNewTime(apt.appointment_time);
        setIsEditing(true);
        setShowBookingModal(true);
    };

    const handleUpdateAppointment = async (e) => {
        e.preventDefault();
        const { error } = await supabase
            .from('appointments')
            .update({
                department: newDept,
                doctor_name: newDoctor,
                appointment_date: newDate,
                appointment_time: newTime,
                // If admin, they might have changed status elsewhere, but we keep it simple here
            })
            .eq('id', editingApt.id);

        if (error) {
            alert("Error updating appointment.");
        } else {
            setShowBookingModal(false);
            setIsEditing(false);
            setEditingApt(null);
            fetchAppointments();
            resetForm();
        }
    };

    const handleStatusUpdate = async (id, currentStatus) => {
        const statuses = ['Booked', 'Confirmed', 'Completed', 'Cancelled'];
        const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length];

        const { error } = await supabase
            .from('appointments')
            .update({ status: nextStatus })
            .eq('id', id);

        if (!error) fetchAppointments();
    };

    const resetForm = () => {
        setNewDept('');
        setNewDoctor('');
        setNewDate('');
        setNewTime('');
    };

    const getStatusColor = (status) => {
        if (status === 'Confirmed' || status === 'Completed') return 'success';
        if (status === 'Booked') return 'warning';
        return 'primary';
    };

    const filteredApts = appointments.filter((apt) => {
        const today = new Date().toISOString().split('T')[0];
        const tabMatch = activeTab === 'upcoming' ? apt.appointment_date >= today : apt.appointment_date < today;

        if (isAdmin && searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const patientName = `${apt.patients?.first_name} ${apt.patients?.last_name}`.toLowerCase();
            return tabMatch && (patientName.includes(searchLower) || apt.doctor_name.toLowerCase().includes(searchLower));
        }

        return tabMatch;
    });

    return (
        <div className="appointments-page fade-in">
            <div className="page-header">
                <div>
                    <h1>{isAdmin ? 'Operation Schedule' : 'Appointments'}</h1>
                    <p className="subtitle">
                        {isAdmin ? 'Monitor all hospital department bookings.' : 'Manage and schedule your medical consultations.'}
                    </p>
                </div>
                {!isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowBookingModal(true)}>
                        <Calendar size={18} />
                        Book New
                    </button>
                )}
            </div>

            <div className="appointments-controls">
                <div className="tabs">
                    <button
                        className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upcoming')}
                    >
                        {isAdmin ? 'Future Sessions' : 'Upcoming'}
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                        onClick={() => setActiveTab('past')}
                    >
                        {isAdmin ? 'Historical Data' : 'Past Visits'}
                    </button>
                </div>

                {isAdmin && (
                    <div className="search-bar-premium">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search Patients or Doctors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                <button className="btn btn-outline filter-btn">
                    <Filter size={16} /> Filter
                </button>
            </div>

            <div className="appointments-list">
                {loading ? (
                    <div className="card text-center" style={{ padding: '3rem' }}>Fetching records...</div>
                ) : filteredApts.length === 0 ? (
                    <div className="card text-center" style={{ padding: '2rem', color: 'var(--text-muted)' }}>
                        No records match the current criteria.
                    </div>
                ) : filteredApts.map((apt) => (
                    <div key={apt.id} className="appointment-card card">
                        <div className="apt-header">
                            <span className={`status-badge ${getStatusColor(apt.status)}`}>{apt.status}</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                {isAdmin && (
                                    <span className="patient-tag">
                                        <User size={12} /> {apt.patients?.first_name} {apt.patients?.last_name}
                                    </span>
                                )}
                                <span className="apt-id">#ID-{apt.id.slice(0, 4)}</span>
                            </div>
                        </div>
                        <div className="apt-body">
                            <div className="doctor-info">
                                <div className="doctor-avatar">
                                    <UserCircle size={48} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3>{apt.doctor_name}</h3>
                                    <p className="dept"><Stethoscope size={14} /> {apt.department}</p>
                                </div>
                            </div>
                            <div className="datetime-info">
                                <div className="dt-block">
                                    <span className="dt-label">Date</span>
                                    <span className="dt-val">{apt.appointment_date}</span>
                                </div>
                                <div className="dt-block">
                                    <span className="dt-label">Time</span>
                                    <span className="dt-val">{apt.appointment_time}</span>
                                </div>
                            </div>
                        </div>
                        <div className="apt-footer">
                            <button className="btn-link" onClick={() => isAdmin ? handleStatusUpdate(apt.id, apt.status) : handleEditClick(apt)}>
                                {isAdmin ? 'Update Status' : 'Reschedule'}
                            </button>
                            <button className="btn-link text-danger" onClick={() => handleDeleteAppointment(apt.id)}>
                                {isAdmin ? 'Delete Record' : 'Cancel'}
                            </button>
                            <div className="flex-spacer"></div>
                            <button className="btn btn-primary btn-sm">Details <ChevronRight size={16} /></button>
                        </div>
                    </div>
                ))}
            </div>

            {showBookingModal && (
                <div className="modal-overlay" onClick={() => { setShowBookingModal(false); setIsEditing(false); setEditingApt(null); resetForm(); }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{isEditing ? 'Update Appointment' : 'Book Appointment'}</h2>
                            <p className="subtitle">{isEditing ? 'Modify your session details below.' : 'Choose your preferred doctor and time.'}</p>
                        </div>
                        <form className="booking-form" onSubmit={isEditing ? handleUpdateAppointment : handleBookAppointment}>
                            <div className="form-group">
                                <label>Department</label>
                                <select required value={newDept} onChange={(e) => setNewDept(e.target.value)}>
                                    <option value="">Select Department</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Neurology">Neurology</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <option value="General Medicine">General Medicine</option>
                                    <option value="Pediatrics">Pediatrics</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Preferred Doctor</label>
                                <select required value={newDoctor} onChange={(e) => setNewDoctor(e.target.value)}>
                                    <option value="">Select Doctor</option>
                                    <option value="Dr. Arabella Thorne">Dr. Arabella Thorne</option>
                                    <option value="Dr. Julian Sterling">Dr. Julian Sterling</option>
                                    <option value="Dr. Elena Vance">Dr. Elena Vance</option>
                                    <option value="Dr. Maximilian Grant">Dr. Maximilian Grant</option>
                                </select>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input type="date" required value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Time</label>
                                    <input type="time" required value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => { setShowBookingModal(false); setIsEditing(false); setEditingApt(null); resetForm(); }}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{isEditing ? 'Save Changes' : 'Confirm Booking'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Appointments;
