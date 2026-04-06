import axios from 'axios';

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` });

API.interceptors.request.use((req) => {
  const profile = localStorage.getItem('profile');
  if (profile) {
    req.headers.Authorization = `Bearer ${JSON.parse(profile).token}`;
  }
  return req;
});

// AUTH
export const signIn = (formData) => API.post('/auth/login', formData);
export const signUp = (formData) => API.post('/auth/register', formData);

// ADMIN
export const fetchAllUsers = () => API.get('/admin/users');
export const adminAddUser = (userData) => API.post('/admin/add-user', userData);

// TRAINER (Ensure these are here!)
export const getMyClients = () => API.get('/trainer/my-clients');
export const assignWorkout = (workoutData) => API.post('/trainer/assign-workout', workoutData);

// MEMBER
export const getMyWorkout = () => API.get('/member/workout');