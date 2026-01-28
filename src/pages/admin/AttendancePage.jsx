import { useState, useEffect } from 'react';
import './AttendancePage.css';
import { FiUsers, FiCheckCircle, FiXCircle, FiDownload, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import {
    getOverallAttendance,
    getSubEventAttendance,
    markOverallAttendance,
    markSubEventAttendance,
    bulkMarkAttendance,
    exportAttendancePDF,
    exportAttendanceCSV,
    exportAttendanceHTML
} from '../../services/attendanceService';
import { getSubEvents } from '../../services/subEventService';

const AttendancePage = () => {
    const [activeTab, setActiveTab] = useState('overall');
    const [participants, setParticipants] = useState([]);
    const [subEvents, setSubEvents] = useState([]);
    const [selectedSubEvent, setSelectedSubEvent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, present: 0, absent: 0 });
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPresent, setFilterPresent] = useState('all');
    const [selectedParticipants, setSelectedParticipants] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        fetchSubEvents();
    }, []);

    useEffect(() => {
        if (activeTab === 'overall') {
            fetchOverallAttendance();
        } else if (selectedSubEvent) {
            fetchSubEventAttendance(selectedSubEvent);
        }
    }, [activeTab, selectedSubEvent, searchTerm, filterPresent]);

    const fetchSubEvents = async () => {
        try {
            const response = await getSubEvents();
            setSubEvents(response.data || []);
            if (response.data && response.data.length > 0) {
                setSelectedSubEvent(response.data[0]._id);
            }
        } catch (error) {
            console.error('Error fetching sub-events:', error);
        }
    };

    const fetchOverallAttendance = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filterPresent !== 'all') params.present = filterPresent === 'present';

            const response = await getOverallAttendance(params);
            setParticipants(response.data || []);
            setStats(response.stats || { total: 0, present: 0, absent: 0 });
        } catch (error) {
            toast.error('Failed to fetch attendance data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubEventAttendance = async (subEventId) => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (filterPresent !== 'all') params.present = filterPresent === 'present';

            const response = await getSubEventAttendance(subEventId, params);
            setParticipants(response.data || []);
            setStats(response.stats || { total: 0, present: 0, absent: 0 });
        } catch (error) {
            toast.error('Failed to fetch attendance data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async (participantId, isPresent) => {
        try {
            if (activeTab === 'overall') {
                await markOverallAttendance([participantId], isPresent);
            } else {
                await markSubEventAttendance(selectedSubEvent, [participantId], isPresent);
            }

            toast.success(`Marked as ${isPresent ? 'present' : 'absent'}`);

            // Refresh data
            if (activeTab === 'overall') {
                fetchOverallAttendance();
            } else {
                fetchSubEventAttendance(selectedSubEvent);
            }
        } catch (error) {
            toast.error('Failed to mark attendance');
            console.error(error);
        }
    };

    const handleBulkMark = async (isPresent) => {
        if (selectedParticipants.length === 0) {
            toast.error('Please select participants first');
            return;
        }

        try {
            if (activeTab === 'overall') {
                await markOverallAttendance(selectedParticipants, isPresent);
            } else {
                await markSubEventAttendance(selectedSubEvent, selectedParticipants, isPresent);
            }

            toast.success(`Marked ${selectedParticipants.length} participant(s) as ${isPresent ? 'present' : 'absent'}`);
            setSelectedParticipants([]);
            setSelectAll(false);

            // Refresh data
            if (activeTab === 'overall') {
                fetchOverallAttendance();
            } else {
                fetchSubEventAttendance(selectedSubEvent);
            }
        } catch (error) {
            toast.error('Failed to mark attendance');
            console.error(error);
        }
    };

    const handleMarkAll = async (isPresent) => {
        try {
            await bulkMarkAttendance(
                activeTab === 'overall' ? 'overall' : 'subevent',
                isPresent,
                activeTab === 'subevent' ? selectedSubEvent : null
            );

            toast.success(`Marked all participants as ${isPresent ? 'present' : 'absent'}`);

            // Refresh data
            if (activeTab === 'overall') {
                fetchOverallAttendance();
            } else {
                fetchSubEventAttendance(selectedSubEvent);
            }
        } catch (error) {
            toast.error('Failed to mark attendance');
            console.error(error);
        }
    };

    const toggleSelectParticipant = (participantId) => {
        setSelectedParticipants(prev => {
            if (prev.includes(participantId)) {
                return prev.filter(id => id !== participantId);
            } else {
                return [...prev, participantId];
            }
        });
    };

    const toggleSelectAll = () => {
        if (selectAll) {
            setSelectedParticipants([]);
        } else {
            setSelectedParticipants(participants.map(p => p._id));
        }
        setSelectAll(!selectAll);
    };

    const getAttendanceStatus = (participant) => {
        if (activeTab === 'overall') {
            return participant.attendance?.overall?.isPresent || false;
        } else {
            const subEventAttendance = participant.attendance?.subEvents?.find(
                se => se.subEventId === selectedSubEvent
            );
            return subEventAttendance?.isPresent || false;
        }
    };

    const handleExport = async (format) => {
        const type = activeTab === 'overall' ? 'overall' : 'subevent';
        const subEventId = activeTab === 'subevent' ? selectedSubEvent : null;

        try {
            switch (format) {
                case 'pdf':
                    toast.loading('Generating PDF...', { id: 'export' });
                    await exportAttendancePDF(type, subEventId);
                    toast.success('PDF exported successfully', { id: 'export' });
                    break;
                case 'csv':
                    toast.loading('Generating CSV...', { id: 'export' });
                    await exportAttendanceCSV(type, subEventId);
                    toast.success('CSV exported successfully', { id: 'export' });
                    break;
                case 'html':
                    toast.loading('Generating HTML...', { id: 'export' });
                    await exportAttendanceHTML(type, subEventId);
                    toast.success('HTML report opened', { id: 'export' });
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export attendance data', { id: 'export' });
        }
    };

    return (
        <div className="attendance-page">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <div className="header-left">
                        <FiUsers className="header-icon" />
                        <div>
                            <h1>Attendance Management</h1>
                            <p>Track and manage participant attendance</p>
                        </div>
                    </div>
                    <div className="export-options">
                        <span className="export-label ">Export {activeTab === 'overall' ? 'Overall' : 'Sub-Event'} List:</span>
                        <div className="export-buttons">
                            <button onClick={() => handleExport('pdf')} className="btn-export">
                                <span className='text-blue-500 flex items-center gap-2'> <FiDownload /> PDF</span>
                            </button>
                            <button onClick={() => handleExport('csv')} className="btn-export">
                                <span className='text-blue-500 flex items-center gap-2'> <FiDownload /> CSV</span>
                            </button>
                            <button onClick={() => handleExport('html')} className="btn-export">
                                <span className='text-blue-500 flex items-center gap-2'> <FiDownload /> HTML</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card total">
                    <div className="stat-icon">
                        <FiUsers />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Total Participants</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stat-card present">
                    <div className="stat-icon">
                        <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Present</div>
                        <div className="stat-value">{stats.present}</div>
                    </div>
                </div>
                <div className="stat-card absent">
                    <div className="stat-icon">
                        <FiXCircle />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label">Absent</div>
                        <div className="stat-value">{stats.absent}</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'overall' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overall')}
                    >
                        Overall Attendance
                    </button>
                    <button
                        className={`tab ${activeTab === 'subevent' ? 'active' : ''}`}
                        onClick={() => setActiveTab('subevent')}
                    >
                        Sub-Event Attendance
                    </button>
                </div>
            </div>

            {/* Sub-Event Selector */}
            {activeTab === 'subevent' && (
                <div className="subevent-selector">
                    <label>Select Sub-Event:</label>
                    <select
                        value={selectedSubEvent || ''}
                        onChange={(e) => setSelectedSubEvent(e.target.value)}
                        className="select-input"
                    >
                        {subEvents.map(subEvent => (
                            <option key={subEvent._id} value={subEvent._id}>
                                {subEvent.name}
                            </option>
                        ))}
                    </select>
                </div>
            )
            }

            {/* Filters and Search */}
            <div className="filters-section">
                <div className="search-box">
                    <FiSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or college..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <FiFilter className="filter-icon" />
                    <select
                        value={filterPresent}
                        onChange={(e) => setFilterPresent(e.target.value)}
                        className="filter-select"
                    >
                        <option value="all">All Participants</option>
                        <option value="present">Present Only</option>
                        <option value="absent">Absent Only</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {
                selectedParticipants.length > 0 && (
                    <div className="bulk-actions">
                        <span className="selected-count">
                            {selectedParticipants.length} participant(s) selected
                        </span>
                        <div className="bulk-buttons">
                            <button onClick={() => handleBulkMark(true)} className="btn-bulk-present">
                                <FiCheckCircle /> Mark Present
                            </button>
                            <button onClick={() => handleBulkMark(false)} className="btn-bulk-absent">
                                <FiXCircle /> Mark Absent
                            </button>
                        </div>
                    </div>
                )
            }

            {/* Quick Actions */}
            <div className="quick-actions">
                <button onClick={() => handleMarkAll(true)} className="btn-quick-action">
                    Mark All Present
                </button>
                <button onClick={() => handleMarkAll(false)} className="btn-quick-action">
                    Mark All Absent
                </button>
            </div>

            {/* Participants Table */}
            <div className="table-container">
                {loading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading attendance data...</p>
                    </div>
                ) : participants.length === 0 ? (
                    <div className="empty-state">
                        <FiUsers className="empty-icon" />
                        <p>No participants found</p>
                    </div>
                ) : (
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>College</th>
                                <th>Mobile</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {participants.map(participant => {
                                const isPresent = getAttendanceStatus(participant);
                                const isSelected = selectedParticipants.includes(participant._id);

                                return (
                                    <tr key={participant._id} className={isSelected ? 'selected' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleSelectParticipant(participant._id)}
                                            />
                                        </td>
                                        <td className="participant-name">{participant.fullName}</td>
                                        <td>{participant.email}</td>
                                        <td>{participant.college || 'N/A'}</td>
                                        <td>{participant.mobile}</td>
                                        <td>
                                            <span className={`status-badge ${isPresent ? 'present' : 'absent'}`}>
                                                {isPresent ? (
                                                    <>
                                                        <FiCheckCircle /> Present
                                                    </>
                                                ) : (
                                                    <>
                                                        <FiXCircle /> Absent
                                                    </>
                                                )}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                {!isPresent && (
                                                    <button
                                                        onClick={() => handleMarkAttendance(participant._id, true)}
                                                        className="btn-mark-present"
                                                        title="Mark Present"
                                                    >
                                                        <FiCheckCircle />
                                                    </button>
                                                )}
                                                {isPresent && (
                                                    <button
                                                        onClick={() => handleMarkAttendance(participant._id, false)}
                                                        className="btn-mark-absent"
                                                        title="Mark Absent"
                                                    >
                                                        <FiXCircle />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div >
    );
};

export default AttendancePage;
