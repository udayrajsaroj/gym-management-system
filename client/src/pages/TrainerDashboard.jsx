import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import WorkoutModal from '../components/WorkoutModal';

const TrainerDashboard = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      const storedProfile = localStorage.getItem('profile');
      if (!storedProfile) { navigate('/'); return; }
      
      const token = JSON.parse(storedProfile).token;
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/trainer/my-clients`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(data);
    } catch (err) {
      console.error("Connection failed. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [navigate]);

  // Filter clients based on search input
  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openWorkoutForm = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            Trainer <span className="text-blue-500">Hub</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[3px] mt-2">
            Managing {clients.length} Elite Athletes
          </p>
        </div>
        
        <div className="flex gap-4 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64">
            <input 
              type="text"
              placeholder="Search Athletes..."
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs outline-none focus:border-blue-500 transition-all"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => { localStorage.clear(); navigate('/'); }} 
            className="bg-white/5 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 hover:text-red-500 transition-all border border-white/5"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {clients.length === 0 ? (
        <div className="bg-white/5 p-20 rounded-[3rem] border border-dashed border-white/10 text-center">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          </div>
          <p className="text-slate-400 font-black uppercase tracking-[2px] text-sm">Roster is Currently Empty</p>
          <p className="text-slate-600 text-xs mt-2 italic">Connect with an Admin to have members assigned to your profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClients.length > 0 ? filteredClients.map(client => (
            <div 
              key={client._id} 
              className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group hover:bg-white/[0.07] hover:border-blue-500/30 transition-all shadow-2xl"
            >
              {/* Subtle accent blur */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-all"></div>
              
              <div className="mb-8">
                <h3 className="text-2xl font-black uppercase tracking-tight group-hover:text-blue-400 transition-colors leading-none mb-2">
                  {client.name}
                </h3>
                <p className="text-slate-500 text-[11px] font-medium lowercase italic opacity-60">
                  {client.email}
                </p>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/5 pt-8">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Status</span>
                  <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border ${
                    client.membershipStatus === 'active' 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {client.membershipStatus}
                  </span>
                </div>

                <button 
                  onClick={() => openWorkoutForm(client)}
                  className="bg-blue-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-lg shadow-blue-900/40 active:scale-95 transition-all"
                >
                  Manage Workout
                </button>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-10 text-center text-slate-600 font-bold uppercase text-xs tracking-widest">
              No athletes match your search term.
            </div>
          )}
        </div>
      )}

      {/* The Modal now has Memory and loads existing workouts */}
      <WorkoutModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        member={selectedClient} 
      />
    </div>
  );
};

export default TrainerDashboard;