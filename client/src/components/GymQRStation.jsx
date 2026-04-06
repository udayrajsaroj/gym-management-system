import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const GymQRStation = () => {
  const [token, setToken] = useState('');

  useEffect(() => {
    const fetchToken = async () => {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/gym-token`);
      setToken(data.qrValue);
    };
    fetchToken();
    // Refresh the token every hour just in case
    const interval = setInterval(fetchToken, 3600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8">
      <div className="bg-white p-12 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center">
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase italic">Iron<span className="text-blue-600">Pulse</span></h2>
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px] mb-8">Scan to check-in</p>
        
        {token ? (
          <QRCodeSVG value={token} size={256} level="H" includeMargin={true} />
        ) : (
          <div className="w-64 h-64 bg-slate-100 animate-pulse rounded-2xl" />
        )}
        
        <p className="mt-8 text-slate-500 font-bold text-xs uppercase italic">Station #1 - Main Entrance</p>
      </div>
    </div>
  );
};

export default GymQRStation;