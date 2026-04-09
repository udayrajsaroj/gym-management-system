import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode'; 

const MemberDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [completedExercises, setCompletedExercises] = useState([]);
  
  const scannerRef = useRef(null); 
  const navigate = useNavigate();

  const fetchDashboard = async () => {
    try {
      const profile = localStorage.getItem('profile');
      if (!profile) { navigate('/'); return; }
      
      const token = JSON.parse(profile).token;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/member/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setData(res.data);

      const fetchedWorkout = res.data.workout;
      const todayStr = new Date().toLocaleDateString('en-CA');
      const workoutDateStr = fetchedWorkout?.createdAt ? fetchedWorkout.createdAt.split('T')[0] : null;

      if (workoutDateStr === todayStr && fetchedWorkout?.completedExercises) {
        setCompletedExercises(fetchedWorkout.completedExercises);
      } else {
        setCompletedExercises([]); 
      }

    } catch (err) { 
      console.error("Dashboard Load Error:", err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (scanning) {
      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      html5QrCode.start(
        { facingMode: "environment" }, 
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          setScanning(false);
          try { await html5QrCode.stop(); } catch (stopErr) { console.error(stopErr); }

          try {
            const token = JSON.parse(localStorage.getItem('profile')).token;
            const { data: scanRes } = await axios.post(`${import.meta.env.VITE_API_URL}/api/attendance/verify-scan`, 
              { scannedToken: decodedText },
              { headers: { Authorization: `Bearer ${token}` }}
            );
            
            alert(`✅ ${scanRes.message}`);
            fetchDashboard(); 
          } catch (err) {
            alert(`❌ ${err.response?.data?.message || "Invalid QR Code"}`);
            fetchDashboard(); 
          }
        },
        (errorMessage) => {}
      ).catch((err) => {
        alert("Camera access denied or no back camera found.");
        setScanning(false);
      });

      return () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().then(() => scannerRef.current.clear()).catch(err => console.error(err));
        }
      };
    }
  }, [scanning]);

  const handleStopScan = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => setScanning(false)).catch(() => setScanning(false));
    } else {
      setScanning(false);
    }
  };

  const toggleExercise = async (index) => {
    const newCompletedList = completedExercises.includes(index) 
      ? completedExercises.filter(i => i !== index)
      : [...completedExercises, index];
    
    setCompletedExercises(newCompletedList);

    if (data?.workout?._id) {
      try {
        const token = JSON.parse(localStorage.getItem('profile')).token;
        await axios.post(`${import.meta.env.VITE_API_URL}/api/member/update-progress`, {
          workoutId: data.workout._id,
          completedExercises: newCompletedList
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        console.error("Failed to sync progress", err);
      }
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-blue-500 font-black italic uppercase tracking-widest">Loading Your Gains...</p>
      </div>
    </div>
  );

  const { member, workout, attendanceStatus, checkInTime } = data;

  const trainerName = member.assignedTrainer?.name || "No Trainer Assigned";
  const isExpired = member.expiryDate && new Date(member.expiryDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  const displayStatus = isExpired ? 'expired' : member.membershipStatus;

  const todayStr = new Date().toLocaleDateString('en-CA'); 
  const workoutDateStr = workout?.createdAt ? workout.createdAt.split('T')[0] : null;
  const isWorkoutValidForToday = workoutDateStr === todayStr && workout?.exercises?.length > 0;

  const totalExercises = isWorkoutValidForToday ? workout.exercises.length : 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8 font-sans">
      
      {/* Header Section */}
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
            My <span className="text-blue-500">Progress</span>
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[2px] mt-2">
            Welcome back, {member.name}
          </p>
        </div>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }} 
          className="bg-white/5 px-6 py-3 rounded-xl hover:bg-red-600 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Gym Access / Scanner */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-6">Gym Access</p>
            {attendanceStatus ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] text-center">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-[#0f172a]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-black uppercase italic text-emerald-400 leading-tight">Verified Present</h3>
                <p className="text-[10px] text-emerald-500/60 font-bold uppercase mt-2">Check-in: {checkInTime}</p>
              </div>
            ) : (
              scanning ? (
                <div className="overflow-hidden rounded-3xl border-2 border-blue-500 bg-black">
                  <div id="qr-reader" className="w-full"></div>
                  <button onClick={handleStopScan} className="w-full bg-rose-500 py-4 text-[10px] font-black uppercase tracking-widest">Cancel Scan</button>
                </div>
              ) : (
                <button onClick={() => setScanning(true)} className="w-full bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all">Open Camera Scanner</button>
              )
            )}
          </div>

          {/* Subscription Status */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-6">Subscription</p>
            <div className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase border mb-3 ${displayStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
              {displayStatus}
            </div>
            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{displayStatus === 'active' ? 'Full Access' : 'Plan Expired'}</h3>
            <p className="text-slate-500 text-[10px] font-bold mt-2 uppercase italic">Valid until: {new Date(member.expiryDate).toLocaleDateString()}</p>
          </div>

          {/* ASSIGNED COACH CARD (Blue Version) */}
          <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-900/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
            </div>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[3px] mb-8">Assigned Coach</p>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{trainerName}</h3>
          </div>
        </div>

        {/* Right Column: Workout Routine */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] h-full shadow-2xl min-h-[500px]">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Today's <span className="text-blue-500">Routine</span></h2>
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-white/5 px-5 py-2.5 rounded-full">{new Date().toDateString()}</span>
            </div>

            {!attendanceStatus ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                 <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                 </div>
                 <p className="text-sm font-black uppercase tracking-[6px] mb-2">Workout Locked</p>
                 <p className="text-[10px] italic text-slate-500 font-medium">Please scan QR at station to view routine</p>
              </div>
            ) : (
              isWorkoutValidForToday ? (
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="mb-8 bg-black/20 p-5 rounded-[2rem] border border-white/5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-4">
                      <span className="text-slate-500">Completion Score</span>
                      <span className={progressPercent === 100 ? "text-emerald-400" : "text-blue-500"}>{progressPercent}% Done</span>
                    </div>
                    <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-1000 ease-out ${progressPercent === 100 ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-blue-600'}`} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>

                  {/* Exercise List */}
                  {workout.exercises.map((ex, i) => {
                    const isDone = completedExercises.includes(i); 
                    return (
                      <div key={i} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 cursor-pointer group ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-white/5 border-white/5 hover:border-blue-500/30'}`} onClick={() => toggleExercise(i)} >
                        <div className="flex items-center gap-6">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-700'}`}>
                            {isDone && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-tight text-base ${isDone ? 'text-emerald-500 line-through' : 'text-white'}`}>{ex.name}</h4>
                            <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${isDone ? 'text-emerald-500/40' : 'text-slate-500'}`}>{ex.sets} Sets × {ex.reps} Reps</p>
                          </div>
                        </div>
                        <div className={`px-5 py-2.5 rounded-2xl border ${isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <span className={`font-black text-sm ${isDone ? 'text-emerald-400' : 'text-blue-400'}`}>{ex.weight}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center opacity-20">
                  <p className="text-xs font-black uppercase tracking-[4px]">Rest & Recover</p>
                  <p className="text-[10px] mt-2 italic">No routine assigned for today.</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;