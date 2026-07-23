'use client';

import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { ROLE_LABEL, type Role } from '@/lib/types';

// The front door. Because this is a demo with no real accounts, you "sign in"
// by picking one of the sample people. Your choice is remembered in the browser.
export default function Home() {
  const { store, signInAs, reset } = useStore();
  const router = useRouter();

  const enter = (id: string) => {
    signInAs(id);
    router.push('/dashboard');
  };

  const order: Role[] = ['coordinator', 'guide', 'member'];

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            Open Beacon<small>a role-based journey demo</small>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="hero">
          <div style={{ fontSize: 30 }} aria-hidden>
            🔆
          </div>
          <h1>Pick a role to explore</h1>
          <p>
            Everything here runs in your browser — no sign-up, no server, no
            tracking. Choose someone below to see the app from their point of
            view.
          </p>
        </div>

        {order.map((role) => {
          const people = store.people.filter((p) => p.role === role);
          return (
            <div key={role} style={{ marginBottom: 20 }}>
              <h2>{ROLE_LABEL[role]}s</h2>
              <div className="role-grid">
                {people.map((p) => (
                  <button
                    key={p.id}
                    className="role-card"
                    onClick={() => enter(p.id)}
                  >
                    <div className="role-emoji" aria-hidden>
                      {role === 'coordinator' ? '🗺️' : role === 'guide' ? '🧭' : '🌱'}
                    </div>
                    <div className="role-name">{p.name}</div>
                    <div className="muted small">{ROLE_LABEL[role]}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <p className="footer-note">
          <button className="btn ghost small" onClick={reset}>
            Reset demo data
          </button>
        </p>
      </div>
    </>
  );
}
