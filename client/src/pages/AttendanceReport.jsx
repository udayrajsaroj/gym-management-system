import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // 1. Navigate import kiya

const AttendanceReport = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // 2. Hook initialize kiya

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const profile = localStorage.getItem('profile');
        if (!profile) return;
        
        const token = JSON.parse(profile).token;
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/attendance-report`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLogs(data);
      } catch (err) {
        console.error("Error fetching report", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 bg-[#0f172a] min-h-screen text-white font-sans">
      
      {/* --- HEADER WITH BACK BUTTON --- */}
      <div className="flex items-center gap-6 mb-10">
        <button 
          onClick={() => navigate('/admin-dashboard')} // 3. Back to Dashboard
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group shadow-lg"
          title="Back to Dashboard"
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

      {/* --- DATA TABLE --- */}
      <div className="bg-white/5 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl backdrop-blur-md">
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
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-all group">
                  <td className="p-8">
                    <p className="font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                      {log.memberId?.name || "Member Not Found"}
                    </p>
                    <p className="text-[11px] text-slate-500 italic lowercase">{log.memberId?.email || "N/A"}</p>
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
                  <td colSpan="4" className="p-20 text-center text-slate-600 italic font-bold uppercase tracking-widest text-xs">
                    No scan records found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceReport;