import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = {
  title?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const userEmail = encodeURIComponent('mona@example.com');
    getJson<{ suggestions: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${userEmail}`)
      .then((data) => {
        if (active) setSuggestions(data.suggestions ?? []);
      })
      .catch(() => {
        if (active) setError('Unable to load workout suggestions');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Workout suggestions</h2>
        <p>Recommend workouts from activity patterns.</p>
        {loading && <p role="status">Loading workout suggestions...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && suggestions.length === 0 && <p>No workout suggestions found.</p>}
        {!loading && !error && suggestions.map((suggestion, index) => (
          <p key={suggestion.title ?? index}>
            {suggestion.title}{suggestion.reason ? ` - ${suggestion.reason}` : ''}
          </p>
        ))}
      </div>
    </section>
  );
}
