import axios from 'axios';
import { auth } from '../config/firebase'; // আপনার ফায়ারবেস কনফিগ ফাইল পাথ
import { signOut } from 'firebase/auth';

const axiosInstance = axios.create({
  baseURL: 'https://api.titto.com.bd/api',
  headers: { 
    'Content-Type': 'application/json' 
  },
});

// Request Interceptor: Firebase Token অটোমেটিক হেডার-এ যুক্ত করা
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      let user = auth.currentUser;

      if (!user) {
        await new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(), 1000);
          const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            clearTimeout(timeout);
            user = currentUser;
            unsubscribe();
            resolve();
          });
        });
      }

      if (user) {
        const idToken = await user.getIdToken(true); // Force refresh token
        
        if (config.headers.set) {
          config.headers.set('Authorization', `Bearer ${idToken}`);
        } else {
          config.headers['Authorization'] = `Bearer ${idToken}`;
        }
        console.log("🔑 Authorization Token added successfully!");
      } else {
        console.warn("⚠️ No logged-in Firebase user found!");
      }
    } catch (error) {
      console.error("Error getting Firebase ID Token:", error);
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: 401/403 এরর পেলে অটোমেটিক Logout করানো
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const status = error.response.status;
      if (status === 401 || status === 403) {
        console.warn("Access Denied: Logging out...");
        try {
          await signOut(auth);
          localStorage.clear();
          sessionStorage.clear();
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } catch (logoutError) {
          console.error("Auto logout error:", logoutError);
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;