import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import {
    FileCheck2,
    ShieldCheck,
    Files,
    UploadCloud,
    CheckCircle,
    AlertTriangle,
    Info,
    RefreshCw,
    BookOpen,
    LayoutDashboard,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import nabhChapters from '../utils/nabhContent.json';
import './NABH.css';

const NABH = ({ userRole }) => {
    const isAdmin = userRole === 'admin';
    const [complianceData, setComplianceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(isAdmin ? 'dashboard' : 'guidelines');
    const [expandedStandards, setExpandedStandards] = useState({});

    const toggleStandard = (code) => {
        setExpandedStandards(prev => ({
            ...prev,
            [code]: !prev[code]
        }));
    };

    const fetchComplianceData = async () => {
        setLoading(true);
        // Assuming we always just want the most recent audit record
        const { data, error } = await supabase
            .from('nabh_compliance')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignore "no rows returned" error
            console.error("Error fetching NABH data:", error);
        } else if (data) {
            setComplianceData(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchComplianceData();
    }, []);

    // Provide default fallback variables for rendering if db empty
    const cd = complianceData || {
        overall_compliance_score: 0,
        consent_tracking_status: 'Pending',
        grievance_redressal_status: 'Pending',
        infection_rate: 0,
        avg_wait_time_minutes: 0,
        incident_reports_total: 0,
        incident_reports_resolved: 0
    };

    return (
        <div className="nabh-page fade-in">
            <div className="page-header">
                <div>
                    <h1>NABH Compliance & Guidelines</h1>
                    <p className="subtitle">6th Edition Standards Tracking & Management</p>
                </div>
                <div className="flex-row gap-3">
                    {isAdmin && activeTab === 'dashboard' && (
                        <button className="btn btn-outline btn-sm" onClick={fetchComplianceData}>
                            <RefreshCw size={16} className={loading ? 'spin' : ''} /> Refresh
                        </button>
                    )}
                    <div className="compliance-badge">
                        <ShieldCheck size={20} />
                        <span>{cd.overall_compliance_score}% Compliant</span>
                    </div>
                </div>
            </div>

            <div className="tab-navigation">
                {isAdmin && (
                    <button
                        className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <LayoutDashboard size={18} /> Compliance Dashboard
                    </button>
                )}
                <button
                    className={`tab-btn ${activeTab === 'guidelines' ? 'active' : ''}`}
                    onClick={() => setActiveTab('guidelines')}
                >
                    <BookOpen size={18} /> NABH Guidelines
                </button>
            </div>

            {activeTab === 'dashboard' && isAdmin ? (
                <div className="nabh-grid">
                    <div className="card compliance-card">
                        <div className="compliance-header">
                            <h3 className="section-title"><Info className="text-primary" /> Patient Rights & Education</h3>
                        </div>
                        <ul className="compliance-list">
                            <li>
                                <span><CheckCircle size={16} color="var(--success)" /> Consent Tracking System</span>
                                <span className={`badge ${cd.consent_tracking_status === 'Active' ? 'success' : 'warning'}`}>{cd.consent_tracking_status}</span>
                            </li>
                            <li>
                                <span><CheckCircle size={16} color="var(--success)" /> Patient Grievance Redressal</span>
                                <span className={`badge ${cd.grievance_redressal_status === 'Active' ? 'success' : 'warning'}`}>{cd.grievance_redressal_status}</span>
                            </li>
                            <li className="warning">
                                <span><AlertTriangle size={16} color="#F5A623" /> Education Materials Update</span>
                                <span className="badge warning">Pending</span>
                            </li>
                        </ul>
                    </div>

                    <div className="card compliance-card">
                        <div className="compliance-header">
                            <h3 className="section-title"><ShieldCheck className="text-teal" /> Quality Indicators</h3>
                        </div>
                        <div className="metrics-grid">
                            <div className="metric-box">
                                <p>Infection Rate</p>
                                <h4>{cd.infection_rate}%</h4>
                                <span className="target">Target: &lt;1%</span>
                            </div>
                            <div className="metric-box">
                                <p>Wait Time Benchmarks</p>
                                <h4>{cd.avg_wait_time_minutes}m</h4>
                                <span className="target text-danger">Target: 15m</span>
                            </div>
                            <div className="metric-box">
                                <p>Incident Reports</p>
                                <h4>{cd.incident_reports_total}</h4>
                                <span className="target">Resolved: {cd.incident_reports_resolved}</span>
                            </div>
                        </div>
                    </div>

                    <div className="card compliance-card">
                        <div className="compliance-header">
                            <h3 className="section-title"><Files className="text-secondary" /> Documentation Control</h3>
                        </div>
                        <ul className="compliance-list">
                            <li>
                                <span>Audit Logs Enabled</span>
                                <div className="progress-bar"><div className="fill w-100" style={{ background: 'var(--success)' }}></div></div>
                            </li>
                            <li>
                                <span>Medical Record Safety</span>
                                <div className="progress-bar"><div className="fill w-90" style={{ background: 'var(--success)' }}></div></div>
                            </li>
                            <li>
                                <span>Data Privacy Compliance</span>
                                <div className="progress-bar"><div className="fill w-85" style={{ background: '#F5A623' }}></div></div>
                            </li>
                        </ul>
                    </div>

                    <div className="card compliance-card">
                        <div className="compliance-header">
                            <h3 className="section-title"><FileCheck2 className="text-purple" /> Internal Audit Section</h3>
                        </div>
                        <div className="audit-upload">
                            <div className="upload-box">
                                <UploadCloud size={32} color="var(--text-muted)" />
                                <p>Drag & Drop Checklists or clicking to upload</p>
                                <button className="btn btn-outline btn-sm mt-2">Browse Files</button>
                            </div>
                        </div>
                        <div className="audit-status mt-3">
                            <h4>Latest Audit Status</h4>
                            <div className="status-indicator">
                                <div className="dot compliant"></div>
                                <span>Compliant - 85%</span>
                                <div className="dot partial"></div>
                                <span>Partial - 12%</span>
                                <div className="dot non-compliant"></div>
                                <span>Non-Compliant - 3%</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="guidelines-container">
                    {nabhChapters.map((chapter, idx) => (
                        <div key={idx} className="chapter-card card">
                            <div className="chapter-header">
                                <h2>{chapter.title}</h2>
                                <p className="intent-text"><strong>Intent:</strong> {chapter.intent}</p>
                            </div>

                            <div className="standards-grid">
                                {chapter.standards.map((std) => (
                                    <div key={std.code} className={`standard-item ${expandedStandards[std.code] ? 'expanded' : ''}`}>
                                        <div className="standard-header" onClick={() => toggleStandard(std.code)}>
                                            <div className="std-info">
                                                <span className="std-code">{std.code}</span>
                                                <p className="std-title">{std.standard}</p>
                                            </div>
                                            {expandedStandards[std.code] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>

                                        {expandedStandards[std.code] && (
                                            <div className="standard-details fade-in">
                                                <label>Objective Elements:</label>
                                                <ul>
                                                    {std.elements.map((el, i) => (
                                                        <li key={i}>{el}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NABH;
