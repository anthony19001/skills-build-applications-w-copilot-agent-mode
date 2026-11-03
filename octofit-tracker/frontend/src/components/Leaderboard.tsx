import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = {
  teamName?: string;
  totalPoints?: number;
  rank?: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((data) => {
        if (active) setEntries(data.leaderboard ?? []);
      })
      .catch(() => {
        if (active) setError('Unable to load leaderboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Leaderboard</h2>
        <p>Compare team point totals.</p>
        {loading && <p role="status">Loading leaderboard...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && entries.length === 0 && <p>No leaderboard rankings found.</p>}
        {!loading && !error && entries.map((entry, index) => (
          <p key={entry.teamName ?? index}>
            {entry.rank ?? index + 1}. {entry.teamName} - {entry.totalPoints ?? 0} points
          </p>
        ))}
      </div>
    </section>
  );
}
