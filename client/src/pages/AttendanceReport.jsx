import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AttendanceReport = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // Search state
  const navigate = useNavigate();

  const fetchReport = async () => {
    try {
      setLoading(true);
      const profile = localStorage.getItem('profile');
      if (!profile) {
        navigate('/');
        return;
      }
      
      const token = JSON.parse(profile).token;
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attendance-report`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLogs(data);
    } catch (err) {
      console.error("Error fetching report:", err);
      setError(err.response?.data?.message || "Failed to load attendance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  // --- FILTER LOGIC ---
  const filteredLogs = logs.filter((log) => {
    const name = log.memberId?.name?.toLowerCase() || "";
    const email = log.memberId?.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-blue-500 font-black uppercase tracking-widest text-xs">Syncing Records...</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#0f172a] min-h-screen text-white font-sans">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate('/admin-dashboard')} 
            className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group shadow-lg"
          >
            <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <h2 className="text-3xl font-black uppercase italic leading-none tracking-tighter">
              Attendance <span className="text-blue-500">Analytics</span>
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-2">
              Historical Check-in Data
            </p>
          </div>
        </div>

        {/* --- SEARCH INPUT --- */}
        <div className="relative w-full lg:w-96">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 pl-11 pr-4 py-4 rounded-2xl text-sm outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 font-medium"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-white"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
        
        {error ? (
          <div className="p-20 text-center">
            <p className="text-rose-500 font-bold uppercase tracking-widest text-sm mb-4">Error: {error}</p>
            <button onClick={fetchReport} className="text-xs bg-blue-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest">Retry Fetch</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/[0.02] text-[10px] font-black uppercase tracking-[2px] text-slate-500 border-b border-white/5">
                  <th className="p-8">Member Identity</th>
                  <th className="p-8">Session Date</th>
                  <th className="p-8">Check-In Time</th>
                  <th className="p-8 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-all group">
                    <td className="p-8">
                      <div className="flex flex-col">
                        <span className="font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                          {log.memberId?.name || "Member Not Found"}
                        </span>
                        <span className="text-[11px] text-slate-500 italic lowercase">
                          {log.memberId?.email || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="p-8 text-slate-400 font-medium">
                      {new Date(log.date).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="p-8">
                      <span className="font-mono bg-blue-500/10 text-blue-400 px-4 py-2 rounded-xl border border-blue-500/20">
                        {log.checkInTime}
                      </span>
                    </td>
                    <td className="p-8 text-right">
                      <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                        Verified Present
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4 opacity-40">
                        <svg className="w-12 h-12 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 00-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="italic font-bold uppercase tracking-widest text-xs">
                          {searchTerm ? `No results for "${searchTerm}"` : "No scan records found in database."}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;