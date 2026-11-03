import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = {
  name?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => {
        if (active) setTeams(data.teams ?? []);
      })
      .catch(() => {
        if (active) setError('Unable to load teams');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Teams</h2>
        <p>Manage teams and members.</p>
        {loading && <p role="status">Loading teams...</p>}
        {!loading && error && <p role="alert">{error}</p>}
        {!loading && !error && teams.length === 0 && <p>No teams found.</p>}
        {!loading && !error && teams.map((team, index) => (
          <p key={team.name ?? index}>{team.name}{team.members?.length ? ` (${team.members.join(', ')})` : ''}</p>
        ))}
      </div>
    </section>
  );
}
