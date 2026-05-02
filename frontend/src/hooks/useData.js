import { useState, useEffect } from 'react';
import api from '../utils/api';

export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then(res => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}

export function useUniversities() {
  const [universities, setUniversities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/universities')
      .then(res => setUniversities(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { universities, loading };
}

export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = () => {
    setLoading(true);
    api.get('/matches')
      .then(res => setMatches(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMatches(); }, []);

  const doAction = async (matchId, action) => {
    const res = await api.post('/matches/action', { match_id: matchId, action });
    fetchMatches();
    return res.data;
  };

  return { matches, loading, refreshMatches: fetchMatches, doAction };
}
