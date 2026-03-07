import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { auth } from '../firebase';
import {
    Star,
    MessageSquareQuote,
    CheckCircle2,
    User,
    Calendar,
    Building2,
    ThumbsUp,
    ThumbsDown
} from 'lucide-react';
import './Feedback.css';

const Feedback = ({ userRole }) => {
    const isAdmin = userRole === 'admin';
    const [activeCategory, setActiveCategory] = useState('appointment');
    const [rating, setRating] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form state variables
    const [referenceId, setReferenceId] = useState('');
    const [comments, setComments] = useState('');
    const [wouldRecommend, setWouldRecommend] = useState(null);

    // Admin state for list
    const [feedbackList, setFeedbackList] = useState([]);

    // Dropdown options
    const [pastAppointments, setPastAppointments] = useState([]);
    const [facilities, setFacilities] = useState([]);

    const fetchFeedbackList = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('feedback')
            .select(`
                *,
                patients (first_name, last_name)
            `)
            .order('created_at', { ascending: false });

        if (data) setFeedbackList(data);
        setLoading(false);
    };

    const fetchDropdownData = async () => {
        if (!isAdmin) {
            const user = auth.currentUser;
            if (user) {
                const { data: patient } = await supabase.from('patients').select('id').eq('firebase_uid', user.uid).single();
                if (patient) {
                    const { data: pastApts } = await supabase
                        .from('appointments')
                        .select('id, doctor_name, appointment_date')
                        .eq('patient_id', patient.id)
                        .lt('appointment_date', new Date().toISOString().split('T')[0])
                        .order('appointment_date', { ascending: false });
                    if (pastApts) setPastAppointments(pastApts);
                }
            }
        }

        const { data: facs } = await supabase.from('facilities').select('id, name');
        if (facs) setFacilities(facs);
    };

    useEffect(() => {
        if (isAdmin) {
            fetchFeedbackList();
        } else {
            fetchDropdownData();
        }

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user && !isAdmin) fetchDropdownData();
        });
        return () => unsubscribe();
    }, [isAdmin]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const user = auth.currentUser;
        if (!user) return alert("Must be logged in to submit feedback.");

        const { data: patientData } = await supabase
            .from('patients')
            .select('id')
            .eq('firebase_uid', user.uid)
            .single();

        if (patientData) {
            const insertPayload = {
                patient_id: patientData.id,
                feedback_type: activeCategory,
                rating: rating,
                comments: comments,
                reference_id: referenceId === 'none' ? null : referenceId,
                would_recommend: wouldRecommend === 'yes'
            };

            const { error } = await supabase.from('feedback').insert([insertPayload]);

            if (error) {
                console.error("Error submitting feedback:", error);
                alert("Could not submit feedback.");
            } else {
                setSubmitted(true);
                // Reset form
                setRating(0);
                setComments('');
                setReferenceId('');
                setWouldRecommend(null);

                setTimeout(() => setSubmitted(false), 3000);
            }
        }
        setLoading(false);
    };

    const renderStars = (currentRating, editable = true) => {
        return (
            <div className="star-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        className={`star-btn ${star <= currentRating ? 'active' : ''} ${!editable ? 'readonly' : ''}`}
                        onClick={() => editable && setRating(star)}
                    >
                        <Star size={editable ? 32 : 16} fill={star <= currentRating ? "currentColor" : "none"} />
                    </button>
                ))}
            </div>
        );
    };

    const handleDeleteFeedback = async (id) => {
        if (!window.confirm("Delete this feedback?")) return;
        const { error } = await supabase.from('feedback').delete().eq('id', id);
        if (error) alert("Error deleting feedback");
        else fetchFeedbackList();
    };

    if (isAdmin) {
        return (
            <div className="feedback-page fade-in">
                <div className="page-header">
                    <div>
                        <h1>Feedback Gallery</h1>
                        <p className="subtitle">Review patient experiences and suggestions.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="card text-center" style={{ padding: '4rem' }}>Loading feedbacks...</div>
                ) : (
                    <div className="feedback-grid">
                        {feedbackList.map((item) => (
                            <div key={item.id} className="feedback-card card">
                                <div className="feedback-header">
                                    <div className="patient-meta">
                                        <div className="mini-avatar">
                                            {item.patients?.first_name?.[0]}{item.patients?.last_name?.[0]}
                                        </div>
                                        <div>
                                            <h4>{item.patients?.first_name} {item.patients?.last_name}</h4>
                                            <span className="feedback-date">{new Date(item.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                                        <div className="feedback-badge">
                                            {item.feedback_type === 'appointment' ? <Calendar size={14} /> : <Building2 size={14} />}
                                            {item.feedback_type}
                                        </div>
                                        <button className="btn-icon-sm text-danger" onClick={() => handleDeleteFeedback(item.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="feedback-stars">
                                    {renderStars(item.rating, false)}
                                </div>
                                <p className="feedback-comment">"{item.comments}"</p>
                                <div className="feedback-footer">
                                    {item.would_recommend ? (
                                        <span className="recommend-tag yes"><ThumbsUp size={14} /> Recommended</span>
                                    ) : (
                                        item.would_recommend === false && <span className="recommend-tag no"><ThumbsDown size={14} /> Not Recommended</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="feedback-page fade-in">
            <div className="page-header">
                <div>
                    <h1>Feedback & Surveys</h1>
                    <p className="subtitle">Help us improve your healthcare experience.</p>
                </div>
            </div>

            <div className="feedback-content flex-row">
                <div className="feedback-sidebar card">
                    <button
                        className={`category-btn ${activeCategory === 'appointment' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('appointment')}
                    >
                        Appointment Feedback
                    </button>
                    <button
                        className={`category-btn ${activeCategory === 'facility' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('facility')}
                    >
                        Facility Feedback
                    </button>
                    <button
                        className={`category-btn ${activeCategory === 'overall' ? 'active' : ''}`}
                        onClick={() => setActiveCategory('overall')}
                    >
                        Overall Experience
                    </button>
                </div>

                <div className="feedback-form-container card">
                    {submitted ? (
                        <div className="success-message">
                            <CheckCircle2 size={64} className="text-success" />
                            <h2>Thank You!</h2>
                            <p>Your feedback has been submitted successfully.</p>
                        </div>
                    ) : (
                        <form className="feedback-form" onSubmit={handleSubmit}>
                            <h2>
                                {activeCategory === 'appointment' ? 'Rate your recent visit' :
                                    activeCategory === 'facility' ? 'Facility Experience' : 'Overall Satisfaction'}
                            </h2>

                            {activeCategory === 'appointment' && (
                                <div className="form-group">
                                    <label>Select Appointment</label>
                                    <select required value={referenceId} onChange={(e) => setReferenceId(e.target.value)}>
                                        <option value="">Choose recent visit</option>
                                        {pastAppointments.map(apt => (
                                            <option key={apt.id} value={apt.id}>{apt.doctor_name} - {apt.appointment_date}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {activeCategory === 'facility' && (
                                <div className="form-group">
                                    <label>Facility Used</label>
                                    <select required value={referenceId} onChange={(e) => setReferenceId(e.target.value)}>
                                        <option value="">Select Facility</option>
                                        {facilities.map(fac => (
                                            <option key={fac.id} value={fac.id}>{fac.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Your Rating</label>
                                {renderStars(rating)}
                            </div>

                            <div className="form-group">
                                <label>Comments</label>
                                <textarea
                                    rows="4"
                                    placeholder="Share your thoughts..."
                                    value={comments}
                                    onChange={(e) => setComments(e.target.value)}
                                    required
                                ></textarea>
                            </div>

                            {activeCategory === 'overall' && (
                                <div className="form-group">
                                    <label>Would you recommend us?</label>
                                    <div className="radio-group" style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="radio" name="recommend" value="yes" onChange={(e) => setWouldRecommend(e.target.value)} required />
                                            <span>Yes, Definitely</span>
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <input type="radio" name="recommend" value="no" onChange={(e) => setWouldRecommend(e.target.value)} />
                                            <span>Maybe next time</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="form-actions mt-2">
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    <MessageSquareQuote size={18} />
                                    {loading ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Feedback;
