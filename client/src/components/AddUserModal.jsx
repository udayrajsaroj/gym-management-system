import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AddUserModal = ({ isOpen, onClose, onUserAdded, editingUser }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'member', 
    expiryDate: '', membershipStatus: 'active', assignedTrainer: ''
  });
  const [trainers, setTrainers] = useState([]); // To store list of trainers
  const [loading, setLoading] = useState(false);

  // 1. Fetch Trainers list so Admin can assign them to Members
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('profile')).token;
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Filter to only get users with the 'trainer' role
        setTrainers(data.filter(u => u.role === 'trainer'));
      } catch (err) {
        console.error("Error fetching trainers list");
      }
    };
    if (isOpen) fetchTrainers();
  }, [isOpen]);

  // 2. Sync form when editing
  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '',
        role: editingUser.role || 'member',
        membershipStatus: editingUser.membershipStatus || 'active',
        assignedTrainer: editingUser.assignedTrainer || '',
        expiryDate: editingUser.expiryDate ? new Date(editingUser.expiryDate).toISOString().split('T')[0] : ''
      });
    } else {
      setFormData({
        name: '', email: '', password: '', role: 'member', 
        expiryDate: '', membershipStatus: 'active', assignedTrainer: ''
      });
    }
  }, [editingUser, isOpen]);

  // 3. Handle Role Change (Hide/Show membership logic)
  const handleRoleChange = (newRole) => {
    const isStaff = newRole === 'admin' || newRole === 'trainer';
    setFormData({
      ...formData,
      role: newRole,
      // If Admin or Trainer, status is always 'none' and no expiry/trainer assignment
      membershipStatus: isStaff ? 'none' : 'active',
      expiryDate: isStaff ? '' : formData.expiryDate,
      assignedTrainer: isStaff ? '' : formData.assignedTrainer
    });
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('profile')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      if (editingUser) {
        await axios.put(`http://localhost:5000/api/admin/update-user/${editingUser._id}`, formData, config);
        alert("Profile Updated!");
      } else {
        await axios.post('http://localhost:5000/api/admin/add-user', formData, config);
        alert("User Created!");
      }
      
      onUserAdded();
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
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
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
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

          {/* --- MEMBER ONLY FIELDS --- */}
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
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 text-white font-bold py-4 rounded-xl">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 disabled:opacity-50">
              {loading ? "Saving..." : editingUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;