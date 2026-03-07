import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import {
    Activity,
    TestTube2,
    Pill,
    HeartPulse,
    Stethoscope,
    Clock,
    CheckCircle2,
    AlertCircle,
    Clock4,
    Plus,
    Trash2,
    Edit2,
    Calendar,
    UserCircle
} from 'lucide-react';
import './Facilities.css';

const getFacilityIcon = (name) => {
    switch (name) {
        case 'MRI Scan': return <Activity size={32} />;
        case 'CT Scan': return <Activity size={32} />;
        case 'X-Ray': return <HeartPulse size={32} />;
        case 'Blood Test': return <TestTube2 size={32} />;
        case 'Pharmacy': return <Pill size={32} />;
        case 'ICU': return <HeartPulse size={32} />;
        case 'OPD': return <Stethoscope size={32} />;
        default: return <Activity size={32} />;
    }
};

const Facilities = ({ userRole }) => {
    const isAdmin = userRole === 'admin';
    const [facilities, setFacilities] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingFac, setEditingFac] = useState(null);

    // Facility Management State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Consultation');
    const [status, setStatus] = useState('Available');
    const [utilization, setUtilization] = useState(0);
    const [requiresBooking, setRequiresBooking] = useState(false);

    // Appointment Booking State (for patients)
    const [showBookingAptModal, setShowBookingAptModal] = useState(false);
    const [aptDept, setAptDept] = useState('');
    const [aptDoctor, setAptDoctor] = useState('');
    const [aptDate, setAptDate] = useState('');
    const [aptTime, setAptTime] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const fetchFacilities = async () => {
        const { data, error } = await supabase.from('facilities').select('*');
        if (error) {
            console.error("Error fetching facilities:", error);
        } else if (data) {
            setFacilities(data);
        }
    };

    useEffect(() => {
        fetchFacilities();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        const payload = {
            name,
            category,
            status,
            utilization_rate: Number(utilization),
            requires_booking: requiresBooking
        };

        if (editingFac) {
            const { error } = await supabase.from('facilities').update(payload).eq('id', editingFac.id);
            if (error) alert("Error updating facility");
            else closeModal();
        } else {
            const { error } = await supabase.from('facilities').insert([payload]);
            if (error) alert("Error adding facility");
            else closeModal();
        }
        fetchFacilities();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to remove this facility?")) return;
        const { error } = await supabase.from('facilities').delete().eq('id', id);
        if (error) alert("Error deleting facility");
        else fetchFacilities();
    };

    const openEdit = (fac) => {
        setEditingFac(fac);
        setName(fac.name);
        setCategory(fac.category || 'Consultation');
        setStatus(fac.status);
        setUtilization(fac.utilization_rate || 0);
        setRequiresBooking(fac.requires_booking);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFac(null);
        setName('');
        setCategory('Consultation');
        setStatus('Available');
        setUtilization(0);
        setRequiresBooking(false);
    };

    // Patient booking logic
    const openBookingModal = (fac) => {
        setAptDept(fac.category || 'General Medicine');
        setAptDoctor(''); // Let patient pick or assign default
        setShowBookingAptModal(true);
    };

    const handleAptBook = async (e) => {
        e.preventDefault();
        setBookingLoading(true);
        const user = auth.currentUser;
        if (!user) {
            alert("Please login to book.");
            setBookingLoading(false);
            return;
        }

        const { data: patientData } = await supabase
            .from('patients')
            .select('id')
            .eq('firebase_uid', user.uid)
            .single();

        if (patientData) {
            const payload = {
                patient_id: patientData.id,
                doctor_name: aptDoctor,
                department: aptDept,
                appointment_date: aptDate,
                appointment_time: aptTime,
                status: 'Booked',
                wait_time: 'N/A'
            };

            const { error } = await supabase.from('appointments').insert([payload]);
            if (error) {
                alert("Failed to confirm booking.");
            } else {
                alert("Appointment Booked Successfully!");
                setShowBookingAptModal(false);
                setAptDoctor('');
                setAptDate('');
                setAptTime('');
            }
        }
        setBookingLoading(false);
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Available':
            case 'Open':
                return <CheckCircle2 size={16} color="var(--success)" />;
            case 'Busy':
                return <Clock4 size={16} color="#F5A623" />;
            default:
                return <AlertCircle size={16} color="var(--danger)" />;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'Available':
            case 'Open': return 'status-avail';
            case 'Busy': return 'status-busy';
            default: return 'status-full';
        }
    };

    return (
        <div className="facilities-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Hospital Facilities</h1>
                    <p className="subtitle">Overview of available medical services.</p>
                </div>
                {isAdmin && (
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        <Plus size={18} /> Add Facility
                    </button>
                )}
            </div>

            <div className="facilities-grid">
                {facilities.map((fac) => (
                    <div key={fac.id} className="facility-card card">
                        <div className="fac-header">
                            <div className="fac-icon">{getFacilityIcon(fac.name)}</div>
                            <div className={`fac-status ${getStatusClass(fac.status)}`}>
                                {getStatusIcon(fac.status)} <span>{fac.status}</span>
                            </div>
                        </div>

                        <div className="fac-body">
                            <h3>{fac.name}</h3>
                            <div className="fac-meta-row">
                                <div className="fac-dept">
                                    <Stethoscope size={14} /> <span>{fac.category || 'Medical Dept'}</span>
                                </div>
                            </div>
                            {isAdmin && (
                                <div className="util-bar">
                                    <div className="util-label">Usage: {fac.utilization_rate}%</div>
                                    <div className="progress-bg">
                                        <div className="progress-fill" style={{ width: `${fac.utilization_rate}%` }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="fac-footer">
                            {isAdmin ? (
                                <div className="admin-actions">
                                    <button className="btn-icon" onClick={() => openEdit(fac)}><Edit2 size={18} /></button>
                                    <button className="btn-icon text-danger" onClick={() => handleDelete(fac.id)}><Trash2 size={18} /></button>
                                </div>
                            ) : (
                                fac.requires_booking ? (
                                    <button className="btn btn-primary w-100" onClick={() => openBookingModal(fac)}>Book Slot</button>
                                ) : (
                                    <button className="btn btn-outline w-100" disabled>Walk-in Only</button>
                                )
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Admin Management Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingFac ? 'Edit Facility' : 'Add New Facility'}</h2>
                        </div>
                        <form className="fac-form" onSubmit={handleSave}>
                            <div className="form-group">
                                <label>Facility Name</label>
                                <input type="text" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label>Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} required>
                                    <option value="Radiology">Radiology</option>
                                    <option value="Consultation">Consultation</option>
                                    <option value="Services">Services</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="Laboratory">Laboratory</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select value={status} onChange={e => setStatus(e.target.value)}>
                                    <option value="Available">Available</option>
                                    <option value="Busy">Busy</option>
                                    <option value="Full">Full</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Utilization Rate (%)</label>
                                <input type="number" value={utilization} onChange={e => setUtilization(e.target.value)} min="0" max="100" />
                            </div>
                            <div className="form-group check-group">
                                <input type="checkbox" checked={requiresBooking} onChange={e => setRequiresBooking(e.target.checked)} id="reqBooking" />
                                <label htmlFor="reqBooking">Requires Pre-booking</label>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Facility</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Patient Booking Modal */}
            {showBookingAptModal && (
                <div className="modal-overlay" onClick={() => setShowBookingAptModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Reserve Facility Slot</h2>
                            <p className="subtitle">Book your session for {aptDept}</p>
                        </div>
                        <form className="booking-form" onSubmit={handleAptBook}>
                            <div className="form-group">
                                <label>Department (Auto-selected)</label>
                                <input type="text" value={aptDept} readOnly className="profile-input" />
                            </div>
                            <div className="form-group">
                                <label>Specialist Doctor</label>
                                <select required value={aptDoctor} onChange={(e) => setAptDoctor(e.target.value)}>
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
                                    <input type="date" required value={aptDate} onChange={(e) => setAptDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label>Time</label>
                                    <input type="time" required value={aptTime} onChange={(e) => setAptTime(e.target.value)} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowBookingAptModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={bookingLoading}>
                                    {bookingLoading ? 'Processing...' : 'Confirm Reservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Facilities;
