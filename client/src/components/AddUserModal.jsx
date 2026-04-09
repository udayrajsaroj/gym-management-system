import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddUserModal = ({ isOpen, onClose, onUserAdded, editingUser }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'member', 
    expiryDate: '', membershipStatus: 'active', assignedTrainer: ''
  });
  const [trainers, setTrainers] = useState([]); 
  const [loading, setLoading] = useState(false);

  // 1. Fetch Trainers list
  useEffect(() => {
    const fetchTrainers = async () => {
      if (!isOpen) return;
      try {
        const profile = localStorage.getItem('profile');
        if (!profile) return;
        const token = JSON.parse(profile).token;
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTrainers(data.filter(u => u.role === 'trainer'));
      } catch (err) {
        console.error("Error fetching trainers list", err);
      }
    };
    fetchTrainers();
  }, [isOpen]);

  // 2. Sync form when editing
  useEffect(() => {
    if (editingUser && isOpen) {
      let safeExpiryDate = '';
      if (editingUser.expiryDate) {
        const dateObj = new Date(editingUser.expiryDate);
        if (!isNaN(dateObj.getTime())) {
          safeExpiryDate = dateObj.toISOString().split('T')[0];
        }
      }

      let trainerId = '';
      if (editingUser.assignedTrainer) {
        trainerId = typeof editingUser.assignedTrainer === 'object' 
          ? editingUser.assignedTrainer._id 
          : editingUser.assignedTrainer;
      }

      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '', 
        role: editingUser.role || 'member',
        membershipStatus: editingUser.membershipStatus || 'active',
        assignedTrainer: trainerId || '',
        expiryDate: safeExpiryDate
      });
    } else {
      setFormData({
        name: '', email: '', password: '', role: 'member', 
        expiryDate: '', membershipStatus: 'active', assignedTrainer: ''
      });
    }
  }, [editingUser, isOpen]);

  const handleRoleChange = (newRole) => {
    const isStaff = newRole === 'admin' || newRole === 'trainer';
    setFormData({
      ...formData,
      role: newRole,
      membershipStatus: isStaff ? 'none' : 'active',
      expiryDate: '', 
      assignedTrainer: '' 
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const profile = localStorage.getItem('profile');
      if (!profile) return;
      const token = JSON.parse(profile).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // --- CLEAN DATA OBJECT ---
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        role: formData.role
      };

      // Password sirf tab bhejo jab naya type kiya ho
      if (formData.password && formData.password.trim() !== "") {
        dataToSend.password = formData.password;
      }

      // Role specific fields validation
      if (formData.role === 'member') {
        dataToSend.membershipStatus = formData.membershipStatus;
        // Agar date empty string hai toh null bhejo ya skip karo
        dataToSend.expiryDate = formData.expiryDate || null;
        dataToSend.assignedTrainer = formData.assignedTrainer || null;
      } else {
        // Staff ke liye expiry aur trainer null bhejo taaki backend crash na ho
        dataToSend.expiryDate = null;
        dataToSend.assignedTrainer = null;
        dataToSend.membershipStatus = 'none';
      }

      if (editingUser) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/admin/update-user/${editingUser._id}`, dataToSend, config);
        alert("User Updated Successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/add-user`, dataToSend, config);
        alert("User Created Successfully!");
      }
      
      onUserAdded();
      onClose();
    } catch (err) {
      console.error("Submission Error:", err.response?.data);
      alert(err.response?.data?.message || "Action failed. Check backend logs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] w-full max-w-lg rounded-3xl border border-white/10 p-8 shadow-2xl overflow-y-auto max-h-[95vh]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            {editingUser ? 'Update' : 'Register'} <span className="text-blue-500">{formData.role}</span>
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-3xl">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <input required value={formData.name} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500" 
              onChange={(e) => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="md:col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email</label>
            <input type="email" required value={formData.email} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">
              Password {editingUser && <span className="text-slate-500 lowercase">(blank to keep current)</span>}
            </label>
            <input type="password" required={!editingUser} value={formData.password} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">System Role</label>
            <select value={formData.role} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
              onChange={(e) => handleRoleChange(e.target.value)}>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role === 'member' && (
            <>
              <div className="md:col-span-2 border-t border-white/5 pt-4 mt-2">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-4">Membership Details</p>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Expiry Date</label>
                <input type="date" required value={formData.expiryDate} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assign Trainer</label>
                <select value={formData.assignedTrainer} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl mt-1 text-white outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFormData({...formData, assignedTrainer: e.target.value})}>
                  <option value="">No Trainer</option>
                  {trainers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="md:col-span-2 flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-xl hover:bg-white/10">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-500 active:scale-95 disabled:opacity-50">
              {loading ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;