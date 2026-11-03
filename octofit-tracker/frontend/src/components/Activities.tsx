import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type?: string;
  minutes?: number;
  points?: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => {
        if (active) setActivities(data.activities ?? []);
      })
      .catch(() => {
        if (active) setError('Unable to load activities');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>Track student activity minutes and points.</p>
        {loading && <p role="status">Loading activities...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && activities.length === 0 && <p>No activities found.</p>}
        {!loading && !error && activities.map((activity, index) => (
          <p key={index}>
            {activity.type} - {activity.minutes ?? 0} minutes - {activity.points ?? 0} points
          </p>
        ))}
      </div>
    </section>
  );
}
