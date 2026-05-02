import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

let token = localStorage.getItem('topdate_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export const setToken = (t) => {
  token = t;
  if (t) {
    localStorage.setItem('topdate_token', t);
    api.defaults.headers.common['Authorization'] = `Bearer ${t}`;
  } else {
    localStorage.removeItem('topdate_token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export const getToken = () => token;

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      setToken(null);
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
