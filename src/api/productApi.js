import axios from 'axios';

// এক্সিওস ইনস্ট্যান্স তৈরি
const axiosInstance = axios.create({
  baseURL: 'https://api.titto.com.bd/api', // আপনার আসল লাইভ এপিআই ইউআরএল
  headers: { 'Content-Type': 'application/json' },
});

// এটাকে ডিফল্ট এক্সপোর্ট করে দিন যাতে স্লাইস 'products' নামে একে পায়
export default axiosInstance;