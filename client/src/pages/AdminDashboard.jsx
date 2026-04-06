import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react'; // npm install qrcode.react
import AddUserModal from '../components/AddUserModal';

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, staff: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false); // QR Station State
  const [qrToken, setQrToken] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const storedProfile = localStorage.getItem('profile');
      if (!storedProfile) { navigate('/'); return; }
      const token = JSON.parse(storedProfile).token;
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(data);
      const active = data.filter(u => u.membershipStatus === 'active' && u.role === 'member').length;
      const expired = data.filter(u => u.membershipStatus === 'expired' && u.role === 'member').length;
      const staff = data.filter(u => u.role === 'admin' || u.role === 'trainer').length;
      setStats({ total: data.length, active, expired, staff });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Logic for Refreshing QR Token
  const refreshQR = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/gym-token`);
      setQrToken(data.qrValue);
    } catch (err) { console.error("QR Sync Error"); }
  };

  useEffect(() => {
    fetchData();
  }, [navigate]);

  // Set up the 30-second rotation for the QR Station
  useEffect(() => {
    let interval;
    if (isQRModalOpen) {
      refreshQR();
      interval = setInterval(refreshQR, 30000); // Syncs with backend window
    }
    return () => clearInterval(interval);
  }, [isQRModalOpen]);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddNew = () => { setEditingUser(null); setIsModalOpen(true); };
  const handleEdit = (user) => { setEditingUser(user); setIsModalOpen(true); };

  const handleDelete = async (id) => {
    if (window.confirm("Permanent Action: Remove this user from the IronPulse database?")) {
      try {
        const token = JSON.parse(localStorage.getItem('profile')).token;
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/admin/delete-user/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
      } catch (error) { alert("Delete failed"); }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      
      {/* Top Navigation / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
            Iron<span className="text-blue-500">Pulse</span> Admin
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-3">
            Central Management System
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* SEARCH BAR */}
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Search records..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-64 bg-white/5 border border-white/10 px-5 py-4 rounded-2xl text-xs outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 font-medium"
            />
          </div>

          <button 
            onClick={() => setIsQRModalOpen(true)}
            className="bg-emerald-600 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
          >
            QR Station
          </button>

          <button 
            onClick={handleAddNew}
            className="bg-blue-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-900/40 transition-all active:scale-95"
          >
            + New User
          </button>
          
          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }}
            className="bg-slate-800 text-slate-400 border border-white/5 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Accounts" value={stats.total} color="bg-blue-500" />
        <StatCard title="Active Members" value={stats.active} color="bg-emerald-500" />
        <StatCard title="Expired Plans" value={stats.expired} color="bg-rose-500" />
        <StatCard title="Gym Staff" value={stats.staff} color="bg-amber-500" />
      </div>

      {/* Directory Table */}
      <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/[0.01]">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight italic">System Directory</h2>
            <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase">Displaying {filteredUsers.length} matched profiles</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[2px]">
              <tr>
                <th className="p-6">Identity</th>
                <th className="p-6">Role</th>
                <th className="p-6">Access Status</th>
                <th className="p-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="p-6">
                    <div className="font-black text-sm group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                      {user.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium lowercase italic">{user.email}</div>
                  </td>
                  <td className="p-6">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border ${
                      user.role === 'admin' ? 'text-amber-500 border-amber-500/20 bg-amber-500/5' :
                      user.role === 'trainer' ? 'text-purple-500 border-purple-500/20 bg-purple-500/5' :
                      'text-blue-400 border-blue-500/10 bg-blue-500/5'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-6">
                    {user.role === 'member' ? (
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        user.membershipStatus === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                      }`}>
                        {user.membershipStatus}
                      </span>
                    ) : (
                      <span className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Staff Account</span>
                    )}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-3 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(user)} className="p-3 bg-white/5 hover:bg-blue-600 rounded-xl transition-all">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="p-3 bg-white/5 hover:bg-rose-600 rounded-xl transition-all">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" className="p-20 text-center text-slate-500 italic uppercase font-bold text-xs tracking-widest">No matching records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- LIVE QR STATION MODAL --- */}
      {isQRModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 flex flex-col items-center shadow-[0_0_100px_rgba(59,130,246,0.3)]">
             <h2 className="text-slate-900 text-2xl font-black uppercase italic mb-2 tracking-tighter">Check-In <span className="text-blue-600">Station</span></h2>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[4px] mb-10">Scan to log attendance</p>
             
             <div className="bg-slate-50 p-6 rounded-[2rem] border-4 border-slate-100 mb-10">
               {qrToken ? (
                 <QRCodeSVG value={qrToken} size={240} level="H" />
               ) : (
                 <div className="w-[240px] h-[240px] flex items-center justify-center text-slate-300 font-bold uppercase text-[10px] italic animate-pulse">Initializing...</div>
               )}
             </div>

             <div className="flex items-center gap-2 mb-10">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
               <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Rotating Secure Token (30s)</span>
             </div>

             <button 
              onClick={() => setIsQRModalOpen(false)}
              className="bg-slate-900 text-white w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
             >
               Close Station
             </button>
          </div>
        </div>
      )}

      <AddUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUserAdded={fetchData} 
        editingUser={editingUser}
      />
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group">
    <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 blur-3xl group-hover:opacity-20 transition-all`}></div>
    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-4">{title}</p>
    <div className="flex items-end gap-3">
      <h3 className="text-5xl font-black tracking-tighter leading-none">{value}</h3>
      <div className={`w-2 h-2 rounded-full mb-2 animate-pulse ${color}`}></div>
    </div>
  </div>
);

export default AdminDashboard;