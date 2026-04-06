import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WorkoutModal = ({ isOpen, onClose, member }) => {
  const [exercises, setExercises] = useState([{ name: '', sets: '', reps: '', weight: '' }]);
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false); // For "Pushing" workout
  const [fetching, setFetching] = useState(false); // For "Loading" existing workout

  // --- PRE-DEFINED EXERCISE LIST ---
  const commonExercises = [
    "Bench Press (Barbell)", "Incline Bench Press (Barbell)", "Dumbbell Press", "Chest Flys", "Pushups",
    "Lat Pulldowns", "Seated Cable Rows", "Bent Over Rows", "Pull Ups", "Deadlifts",
    "Overhead Press (Barbell)", "Dumbbell Shoulder Press", "Lateral Raises", "Front Raises",
    "Squats (Barbell)", "Leg Press", "Leg Extensions", "Leg Curls", "Lunges", "Calf Raises",
    "Bicep Curls (Dumbbell)", "Hammer Curls", "Preacher Curls",
    "Tricep Pushdowns", "Skull Crushers", "Dips",
    "Plank", "Crunches", "Leg Raises", "Russian Twists"
  ];

  // --- FETCH EXISTING WORKOUT LOGIC ---
  useEffect(() => {
    const fetchExistingWorkout = async () => {
      if (isOpen && member?._id) {
        setFetching(true);
        try {
          const profile = localStorage.getItem('profile');
          if (!profile) return;
          
          const token = JSON.parse(profile).token;
          const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/trainer/member-workout/${member._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (data.exercises && data.exercises.length > 0) {
            setExercises(data.exercises);
            setInstructions(data.instructions || "");
          } else {
            setExercises([{ name: '', sets: '', reps: '', weight: '' }]);
            setInstructions("");
          }
        } catch (err) {
          console.error("Error retrieving member workout history", err);
        } finally {
          setFetching(false);
        }
      }
    };

    fetchExistingWorkout();
  }, [isOpen, member]);

  if (!isOpen) return null;

  const addExerciseRow = () => {
    setExercises([...exercises, { name: '', sets: '', reps: '', weight: '' }]);
  };

  const removeRow = (index) => {
    const newRows = exercises.filter((_, i) => i !== index);
    setExercises(newRows);
  };

  const handleInputChange = (index, field, value) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('profile')).token;
      await axios.post('http://localhost:5000/api/trainer/assign-workout', {
        memberId: member._id,
        exercises,
        instructions
      }, { headers: { Authorization: `Bearer ${token}` } });

      alert(`Workout updated and pushed to ${member.name}`);
      onClose();
    } catch (err) {
      alert("Error saving workout");
    } finally {
      setLoading(false);
    }
  };

  // master grid logic
  const gridLayout = "grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_75px_75px_85px_35px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-white">
      <div className="bg-[#1e293b] w-full max-w-3xl rounded-[2.5rem] border border-white/10 p-6 md:p-10 shadow-2xl max-h-[95vh] overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-black mb-1 uppercase italic tracking-tighter text-white">
              {fetching ? "Retrieving" : "Current"} <span className="text-blue-500">Workout</span>
            </h2>
            <p className="text-slate-500 text-[10px] uppercase tracking-[3px] font-bold italic leading-none">
              Athlete: {member?.name}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors text-2xl">&times;</button>
        </div>

        {fetching ? (
          <div className="py-20 flex flex-col items-center justify-center opacity-50">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500 mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accessing Athlete Database...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            {/* Table Labels */}
            <div className={`hidden md:grid ${gridLayout} gap-4 px-4 mb-3 text-[10px] font-black text-slate-500 uppercase tracking-widest`}>
              <span>Exercise</span>
              <span className="text-center">Sets</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Weight</span>
              <span></span>
            </div>

            {/* Exercise Rows */}
            <div className="space-y-3 mb-6">
              {exercises.map((ex, index) => (
                <div 
                  key={index} 
                  className={`grid ${gridLayout} gap-3 md:gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 items-center hover:border-blue-500/20 transition-all`}
                >
                  {/* SEARCHABLE DROPDOWN INPUT */}
                  <input 
                    required 
                    list="exercise-list"
                    placeholder="Search or type exercise..." 
                    className="bg-slate-800 p-3 rounded-xl text-xs outline-none border border-slate-700 text-white focus:border-blue-500 transition-all min-w-0" 
                    value={ex.name} 
                    onChange={(e) => handleInputChange(index, 'name', e.target.value)} 
                  />
                  
                  <input 
                    placeholder="0" 
                    className="bg-slate-800 p-3 rounded-xl text-xs outline-none border border-slate-700 text-white text-center focus:border-blue-500 transition-all min-w-0" 
                    value={ex.sets} 
                    onChange={(e) => handleInputChange(index, 'sets', e.target.value)} 
                  />
                  
                  <input 
                    placeholder="0" 
                    className="bg-slate-800 p-3 rounded-xl text-xs outline-none border border-slate-700 text-white text-center focus:border-blue-500 transition-all min-w-0" 
                    value={ex.reps} 
                    onChange={(e) => handleInputChange(index, 'reps', e.target.value)} 
                  />

                  <input 
                    placeholder="Kg" 
                    className="bg-slate-800 p-3 rounded-xl text-xs outline-none border border-slate-700 text-white text-center focus:border-blue-500 transition-all min-w-0" 
                    value={ex.weight} 
                    onChange={(e) => handleInputChange(index, 'weight', e.target.value)} 
                  />
                  
                  <div className="flex justify-center">
                    {exercises.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeRow(index)} 
                        className="text-rose-500 hover:text-rose-400 transition-colors font-bold text-2xl"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* SHARED DATALIST DROPDOWN OPTIONS */}
            <datalist id="exercise-list">
              {commonExercises.map((option, idx) => (
                <option key={idx} value={option} />
              ))}
            </datalist>

            <button 
              type="button" 
              onClick={addExerciseRow} 
              className="w-full border-2 border-dashed border-white/5 text-slate-500 py-4 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-[2px] hover:bg-white/5 hover:text-white hover:border-blue-500/50 transition-all"
            >
              + Add Exercise Row
            </button>

            <div className="mb-8">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">Instructions / Coaching Notes</label>
              <textarea 
                placeholder="Focus on slow eccentric movements..." 
                className="w-full bg-slate-800 p-5 rounded-2xl text-xs outline-none border border-slate-700 text-white h-28 focus:border-blue-500 transition-all resize-none placeholder:text-slate-600"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)} 
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="button" 
                onClick={onClose} 
                className="flex-1 bg-white/5 text-slate-400 py-4 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition-all border border-white/5"
              >
                Discard Changes
              </button>
              <button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-blue-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-900/40 hover:bg-blue-500 active:scale-95 transition-all disabled:opacity-50"
              >
                {loading ? "Syncing..." : "Push Workout"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default WorkoutModal;