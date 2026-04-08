import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode'; 

const MemberDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  
  // --- NEW: STATE FOR CHECKBOXES ---
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
    } catch (err) { 
      console.error("Dashboard Load Error:", err);
      navigate('/'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [navigate]);

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
        alert("Camera access denied or no back camera found. Please check browser permissions.");
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

  // --- NEW: TOGGLE CHECKBOX LOGIC ---
  const toggleExercise = (index) => {
    setCompletedExercises(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) // Agar pehle se tick hai, toh hatao
        : [...prev, index]              // Agar tick nahi hai, toh add karo
    );
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

  const isExpired = member.expiryDate && new Date(member.expiryDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0);
  const displayStatus = isExpired ? 'expired' : member.membershipStatus;

  const today = new Date().toLocaleDateString('en-CA'); 
  const workoutDate = workout?.createdAt ? workout.createdAt.split('T')[0] : null;
  const isWorkoutValidForToday = workoutDate === today && workout?.exercises?.length > 0;

  // --- NEW: CALCULATE PROGRESS ---
  const totalExercises = isWorkoutValidForToday ? workout.exercises.length : 0;
  const progressPercent = totalExercises > 0 ? Math.round((completedExercises.length / totalExercises) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-4 md:p-8">
      
      {/* Header Section */}
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
          className="bg-white/5 px-5 py-3 rounded-xl hover:bg-red-500/20 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest border border-white/5"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Attendance */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/20 relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-[3px] mb-4">Gym Access</p>
              
              {attendanceStatus ? (
                <div className="py-2">
                  <div className="flex items-center gap-3 bg-emerald-400/20 border border-emerald-400/30 p-4 rounded-2xl mb-4">
                    <div className="bg-emerald-400 rounded-full p-1">
                      <svg className="w-3 h-3 text-emerald-900" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-emerald-300 font-black text-[10px] uppercase tracking-widest">Attendance Complete</span>
                  </div>
                  <h3 className="text-xl font-black text-white uppercase italic leading-tight">Great to see you!<br/>Routine Unlocked.</h3>
                  <p className="text-white/60 text-[9px] font-bold mt-4 uppercase italic">Verified at {checkInTime}</p>
                </div>
              ) : (
                <>
                  {scanning ? (
                    <div className="overflow-hidden rounded-2xl border-4 border-white/20 bg-black">
                      <div id="qr-reader" className="w-full"></div>
                      <button onClick={handleStopScan} className="w-full bg-rose-500 text-white py-4 text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-colors">
                        Cancel Scan
                      </button>
                    </div>
                  ) : (
                    <>
                      {displayStatus === 'expired' ? (
                        <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl text-center backdrop-blur-sm">
                          <svg className="w-8 h-8 text-rose-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <h3 className="text-sm font-black text-rose-400 uppercase tracking-widest mb-2">Access Denied</h3>
                          <p className="text-[10px] text-rose-200/70 leading-relaxed italic">
                            Your subscription has expired. Please renew your plan at the reception to unlock the scanner.
                          </p>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-xl font-black text-white uppercase mb-6 leading-tight italic">Scan Station QR<br/>To Unlock Routine</h3>
                          <button onClick={() => setScanning(true)} className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                            Open Camera Scanner
                          </button>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-6">Subscription Status</p>
            <div className={`inline-block px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border ${
              displayStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            }`}>
              {displayStatus}
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight">
              {displayStatus === 'active' ? 'Full Access' : 'Plan Expired'}
            </h3>
            <p className="text-slate-400 text-xs mt-2 italic font-medium">
              Valid until: {member.expiryDate ? new Date(member.expiryDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-xl group">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[3px] mb-4">Assigned Coach</p>
            <h3 className="text-2xl font-black text-blue-500 italic uppercase tracking-tighter">
              {member.assignedTrainer?.name || "Assigning Soon..."}
            </h3>
          </div>
        </div>

        {/* Right Column: Workout Routine */}
        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] h-full shadow-2xl">
            
            {/* Header + Date */}
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black uppercase italic tracking-tight">
                Today's <span className="text-blue-500">Routine</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">
                {new Date().toDateString()}
              </span>
            </div>

            {!attendanceStatus ? (
              <div className="h-80 flex flex-col items-center justify-center text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border ${
                  displayStatus === 'expired' ? 'bg-rose-500/5 border-rose-500/10 text-rose-500/50' : 'bg-white/5 border-white/10 text-slate-600'
                }`}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-xs font-black uppercase tracking-[4px] text-slate-500">
                  {displayStatus === 'expired' ? 'Account Locked' : 'Workout Locked'}
                </p>
                <p className="text-[10px] mt-2 italic text-slate-600 max-w-[200px]">
                  {displayStatus === 'expired' 
                    ? 'Please renew your subscription to access your daily workout routine.' 
                    : 'Please check-in at the gym entrance to view your routine for today.'}
                </p>
              </div>
            ) : (
              isWorkoutValidForToday ? (
                <div className="space-y-4">
                  
                  {/* --- NEW: PROGRESS BAR UI --- */}
                  <div className="mb-6 bg-[#0f172a] p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                      <span className="text-slate-500">Workout Progress</span>
                      <span className={progressPercent === 100 ? "text-emerald-400" : "text-blue-500"}>
                        {progressPercent}% Complete
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* EXERCISE LIST */}
                  {workout.exercises.map((ex, i) => {
                    const isDone = completedExercises.includes(i); // Check if this exercise is ticked

                    return (
                      <div 
                        key={i} 
                        className={`flex items-center justify-between p-5 md:p-6 rounded-3xl border transition-all duration-300 cursor-pointer group ${
                          isDone 
                            ? 'bg-emerald-500/5 border-emerald-500/20 opacity-70' 
                            : 'bg-white/[0.03] border-white/5 hover:border-blue-500/30'
                        }`}
                        onClick={() => toggleExercise(i)} // Pura card click karne pe bhi tick hoga
                      >
                        <div className="flex items-center gap-4 md:gap-6">
                          
                          {/* --- CHECKBOX --- */}
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                            isDone 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                              : 'border-slate-600 text-transparent group-hover:border-blue-500/50'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                          </div>

                          {/* Exercise Details */}
                          <div>
                            <h4 className={`font-black uppercase tracking-tight transition-all duration-300 ${
                              isDone ? 'text-emerald-400 line-through decoration-emerald-500/50' : 'text-white group-hover:text-blue-400'
                            }`}>
                              {ex.name}
                            </h4>
                            <p className={`text-[10px] font-black uppercase mt-1 tracking-widest ${isDone ? 'text-emerald-500/50' : 'text-slate-500'}`}>
                              {ex.sets} Sets <span className="text-slate-700 mx-1">×</span> {ex.reps} Reps
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                          <span className={`text-[8px] font-black uppercase tracking-widest mb-1 ${isDone ? 'text-emerald-500/50' : 'text-slate-600'}`}>
                            Weight
                          </span>
                          <div className={`px-4 py-2 rounded-xl border transition-all ${
                            isDone ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-blue-500/10 border-blue-500/20'
                          }`}>
                            <span className={`font-black text-xs md:text-sm ${isDone ? 'text-emerald-400' : 'text-blue-400'}`}>
                              {ex.weight.toLowerCase().includes('kg') || ex.weight.toLowerCase().includes('lb') 
                                ? ex.weight 
                                : `${ex.weight} kg`}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {workout.instructions && (
                    <div className="mt-10 p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] relative">
                      <div className="absolute -top-3 left-6 bg-[#0f172a] px-3">
                         <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Coach's Note</p>
                      </div>
                      <p className="text-slate-400 text-sm italic leading-relaxed">
                        "{workout.instructions}"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-80 flex flex-col items-center justify-center text-center opacity-20">
                  <div className="p-6 border-2 border-dashed border-slate-500 rounded-full mb-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-xs font-black uppercase tracking-[4px]">Rest & Recover</p>
                  <p className="text-[10px] mt-2 italic font-medium">No routine assigned for today.</p>
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