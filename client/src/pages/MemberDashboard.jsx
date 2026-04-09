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
      if (!profile) {
        navigate('/');
        return;
      }
      
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

  // TRAINER NAME EXTRACTION
  const trainerName = member.assignedTrainer?.name || "No Trainer Assigned";

  const isExpired = member.expiryDate && new Date(member.expiryDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  const displayStatus = isExpired ? 'expired' : member.membershipStatus;

  const today = new Date().toLocaleDateString('en-CA'); 
  const workoutDate = workout?.createdAt ? workout.createdAt.split('T')[0] : null;
  const isWorkoutValidForToday = workoutDate === today && workout?.exercises?.length > 0;

  const totalExercises = isWorkoutValidForToday ? workout.exercises.length : 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      
      <div className="flex justify-between items-start mb-10">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            My <span className="text-blue-500">Progress</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
            Welcome back, {member.name}
          </p>
        </div>
        <button 
          onClick={() => { localStorage.clear(); navigate('/'); }} 
          className="bg-white/5 px-5 py-3 rounded-xl hover:bg-red-500 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[3px] mb-4">Gym Access</p>
              {attendanceStatus ? (
                <div className="py-2">
                  <div className="flex items-center gap-3 bg-emerald-400/20 border border-emerald-400/30 p-4 rounded-2xl mb-4 text-emerald-300 font-black text-[10px] uppercase tracking-widest">✅ Attendance Complete</div>
                  <h3 className="text-xl font-black text-white uppercase italic leading-tight">Great to see you!<br/>Routine Unlocked.</h3>
                  <p className="text-white/60 text-[9px] font-bold mt-4 uppercase italic">Verified at {checkInTime}</p>
                </div>
              ) : (
                <>
                  {scanning ? (
                    <div className="overflow-hidden rounded-2xl border-4 border-white/20 bg-black">
                      <div id="qr-reader" className="w-full"></div>
                      <button onClick={handleStopScan} className="w-full bg-rose-500 text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600">Cancel Scan</button>
                    </div>
                  ) : (
                    <>
                      {displayStatus === 'expired' ? (
                        <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl text-center">
                          <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-2">Access Denied</h3>
                          <p className="text-[10px] text-rose-200/70 italic">Subscription expired.</p>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-black text-white uppercase mb-6 leading-tight italic">Scan Station QR<br/>To Unlock Routine</h3>
                          <button onClick={() => setScanning(true)} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Open Camera Scanner</button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-6">Status & Trainer</p>
            <div className="space-y-6">
              <div>
                <div className={`inline-block px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${displayStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                  {displayStatus}
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tight mt-1">{displayStatus === 'active' ? 'Full Access' : 'Plan Expired'}</h3>
              </div>
              
              {/* FIXED: TRAINER NAME SECTION ADDED HERE */}
              <div className="pt-6 border-t border-white/5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
                <div>
                  <h4 className="font-black text-sm uppercase tracking-tight text-white">{trainerName}</h4>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Assigned Trainer</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] h-full shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tight">Today's <span className="text-blue-500">Routine</span></h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">{new Date().toDateString()}</span>
            </div>

            {!attendanceStatus ? (
              <div className="h-80 flex flex-col items-center justify-center text-center opacity-40">
                 <p className="text-xs font-black uppercase tracking-[4px]">Workout Locked</p>
                 <p className="text-[10px] mt-2 italic text-slate-500">Please scan QR to view routine</p>
              </div>
            ) : (
              isWorkoutValidForToday ? (
                <div className="space-y-4">
                  <div className="mb-6 bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                      <span className="text-slate-500">Workout Progress</span>
                      <span className={progressPercent === 100 ? "text-emerald-400" : "text-blue-500"}>{progressPercent}% Complete</span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${progressPercent}%` }}></div>
                    </div>
                  </div>

                  {workout.exercises.map((ex, i) => {
                    const isDone = completedExercises.includes(i); 
                    return (
                      <div key={i} className={`flex items-center justify-between p-5 md:p-6 rounded-3xl border transition-all cursor-pointer group ${isDone ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' : 'bg-white/[0.03] border-white/5 hover:border-blue-500/30'}`} onClick={() => toggleExercise(i)} >
                        <div className="flex items-center gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>
                            {isDone && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>}
                          </div>
                          <div>
                            <h4 className={`font-black uppercase tracking-tight ${isDone ? 'text-emerald-400 line-through' : 'text-white'}`}>{ex.name}</h4>
                            <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${isDone ? 'text-emerald-500/50' : 'text-slate-500'}`}>{ex.sets} Sets × {ex.reps} Reps</p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-xl border ${isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <span className={`font-black text-xs ${isDone ? 'text-emerald-400' : 'text-blue-400'}`}>{ex.weight}</span>
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