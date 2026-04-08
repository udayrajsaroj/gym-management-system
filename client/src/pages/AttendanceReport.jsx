import React, { useEffect, useState } from 'react';
import axios from 'axios';

const AttendanceReport = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('profile')).token;
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

  if (loading) return <div className="p-10 text-white">Loading Logs...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#0f172a] min-h-screen text-white">
      <h2 className="text-3xl font-black uppercase italic mb-8">
        Attendance <span className="text-blue-500">Analytics</span>
      </h2>

      <div className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[2px] text-slate-500">
              <th className="p-6">Member Name</th>
              <th className="p-6">Date</th>
              <th className="p-6">Check-In Time</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {logs.map((log) => (
              <tr key={log._id} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="p-6">
                  <p className="font-bold">{log.memberId?.name || "Deleted User"}</p>
                  <p className="text-[10px] text-slate-500">{log.memberId?.email}</p>
                </td>
                <td className="p-6 text-slate-400">
                  {new Date(log.date).toLocaleDateString('en-GB')}
                </td>
                <td className="p-6 font-mono text-blue-400">
                  {log.checkInTime}
                </td>
                <td className="p-6">
                  <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    Present
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="p-10 text-center text-slate-500 italic text-sm">No attendance records found yet.</p>}
      </div>
    </div>
  );
};

export default AttendanceReport;