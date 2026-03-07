import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Activity,
    ShieldPlus,
    History,
    Edit2,
    Save,
    X,
    AlertCircle
} from 'lucide-react';
import './Profile.css';

const Profile = ({ onUpdate }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        phone: '',
        age: '',
        gender: '',
        blood_group: '',
        address_street: '',
        address_city: ''
    });

    const fetchProfile = async () => {
        const user = auth.currentUser;
        if (user) {
            const { data, error } = await supabase
                .from('patients')
                .select('*')
                .eq('firebase_uid', user.uid)
                .single();
            if (data) {
                setProfile(data);
                setFormData({
                    phone: data.phone || '',
                    age: data.age || '',
                    gender: data.gender || '',
                    blood_group: data.blood_group || '',
                    address_street: data.address?.street || '',
                    address_city: data.address?.city || ''
                });

                // Check if profile was incomplete but now is complete
                if (data.phone && data.age && data.gender && onUpdate) {
                    onUpdate();
                }
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                fetchProfile();
                // Check if we should auto-start editing
                const checkAutoEdit = async () => {
                    const { data } = await supabase.from('patients').select('phone, age, gender').eq('firebase_uid', user.uid).single();
                    if (data && (!data.phone || !data.age || !data.gender)) {
                        setIsEditing(true);
                    }
                };
                checkAutoEdit();
            }
            else setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        const user = auth.currentUser;
        if (!user) return;

        // Validation
        if (!formData.phone || !formData.age || !formData.gender) {
            alert("Please fill in all mandatory fields (*)");
            return;
        }

        const { error } = await supabase
            .from('patients')
            .update({
                phone: formData.phone,
                age: formData.age,
                gender: formData.gender,
                blood_group: formData.blood_group,
                address: {
                    street: formData.address_street,
                    city: formData.address_city
                }
            })
            .eq('firebase_uid', user.uid);

        if (!error) {
            setIsEditing(false);
            fetchProfile();
        } else {
            alert("Error updating profile. Please try again.");
        }
    };

    if (loading) return <div className="profile-page fade-in" style={{ padding: '2rem' }}>Loading profile...</div>;

    const p = profile || {};
    const fullName = p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Patient Name';
    const isIncomplete = !p.phone || !p.age || !p.gender;

    return (
        <div className="profile-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Patient Profile</h1>
                    <p className="subtitle">Manage your personal and medical information.</p>
                </div>
                {!isEditing ? (
                    <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                        <Edit2 size={18} /> Edit Profile
                    </button>
                ) : (
                    <div className="btn-group" style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-outline" onClick={() => setIsEditing(false)}>
                            <X size={18} /> Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSave}>
                            <Save size={18} /> Save Changes
                        </button>
                    </div>
                )}
            </div>

            {isIncomplete && (
                <div className="mandatory-banner card warning mb-3" style={{ background: '#FFF4E5', border: '1px solid #FFD591', display: 'flex', alignItems: 'center', gap: '1rem', color: '#663C00', padding: '1.25rem' }}>
                    <AlertCircle size={24} />
                    <div>
                        <strong>Action Required:</strong> Please complete your profile details marked with <strong>*</strong> to access the full hospital dashboard.
                    </div>
                </div>
            )}

            <div className="profile-grid">
                <div className="profile-sidebar card">
                    <div className="profile-avatar-container">
                        <div className="profile-avatar">
                            <User size={64} color="white" />
                        </div>
                        <h2>{fullName}</h2>
                        <p className="patient-id">PID: {p.id ? p.id.split('-')[0] : 'NEW'}</p>
                    </div>

                    <div className="profile-contact">
                        <div className="contact-item">
                            <Mail size={16} /> <span>{p.email || 'No email'}</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={16} />
                            <label style={{ display: 'none' }}>Phone <span className="text-danger">*</span></label>
                            {isEditing ? (
                                <input
                                    className="profile-input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter Phone"
                                />
                            ) : (
                                <span>{p.phone || 'Not set'}</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    <div className="card info-card">
                        <div className="card-header">
                            <h3>Personal Details</h3>
                        </div>
                        <div className="info-grid">
                            <div className="info-group">
                                <label>Full Name</label>
                                <p>{fullName}</p>
                            </div>
                            <div className="info-group">
                                <label>Age <span className="text-danger">*</span></label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        className="profile-input"
                                        value={formData.age}
                                        onChange={e => setFormData({ ...formData, age: e.target.value })}
                                    />
                                ) : (
                                    <p>{p.age || 'N/A'} Years</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Gender <span className="text-danger">*</span></label>
                                {isEditing ? (
                                    <select
                                        className="profile-input"
                                        value={formData.gender}
                                        onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    >
                                        <option value="">Select</option>
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                        <option value="Other">Other</option>
                                    </select>
                                ) : (
                                    <p>{p.gender || 'N/A'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>Blood Group</label>
                                {isEditing ? (
                                    <input
                                        className="profile-input"
                                        value={formData.blood_group}
                                        onChange={e => setFormData({ ...formData, blood_group: e.target.value })}
                                        placeholder="e.g. O+"
                                    />
                                ) : (
                                    <p>{p.blood_group || 'N/A'}</p>
                                )}
                            </div>
                            <div className="info-group">
                                <label>City</label>
                                {isEditing ? (
                                    <input
                                        className="profile-input"
                                        value={formData.address_city}
                                        onChange={e => setFormData({ ...formData, address_city: e.target.value })}
                                    />
                                ) : (
                                    <p>{p.address?.city || 'N/A'}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {!isEditing && (
                        <>
                            <div className="card info-card mt-3">
                                <div className="card-header">
                                    <h3><Activity size={18} className="text-danger" /> Medical History</h3>
                                </div>
                                <div className="history-tags">
                                    {p.medical_history && p.medical_history.length > 0 ? (
                                        p.medical_history.map((hist, i) => (
                                            <span key={i} className="tag">{hist}</span>
                                        ))
                                    ) : (
                                        <span className="tag" style={{ background: 'transparent', border: '1px dashed #ccc', color: '#666' }}>No medical history recorded</span>
                                    )}
                                </div>
                            </div>

                            <div className="card info-card mt-3">
                                <div className="card-header">
                                    <h3><History size={18} className="text-primary" /> Previous Visits</h3>
                                </div>
                                <p style={{ color: 'var(--text-muted)' }}>No previous visits recorded yet.</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
