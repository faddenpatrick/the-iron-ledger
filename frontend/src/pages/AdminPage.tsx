import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import {
  getAdminOverview,
  getUserGrowth,
  getUserList,
  getFeatureAdoption,
} from '../services/admin.service';
import type { AdminOverview, UserGrowthPoint, UserDetailRow, FeatureAdoption } from '../types/admin';

const StatCard: React.FC<{ label: string; value: string | number; sublabel?: string }> = ({
  label,
  value,
  sublabel,
}) => (
  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
    <p className="text-xs text-gray-400 uppercase tracking-wider font-display">{label}</p>
    <p className="text-2xl font-bold text-white mt-1 font-display">{value}</p>
    {sublabel && <p className="text-xs text-gray-500 mt-0.5">{sublabel}</p>}
  </div>
);

const AdoptionCard: React.FC<{ label: string; count: number; total: number }> = ({
  label,
  count,
  total,
}) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/30">
      <p className="text-xs text-gray-400 uppercase tracking-wider font-display">{label}</p>
      <div className="flex items-end gap-2 mt-1">
        <p className="text-2xl font-bold text-white font-display">{count}</p>
        <p className="text-sm text-gray-500 pb-0.5">/ {total} ({pct}%)</p>
      </div>
      <div className="mt-2 bg-gray-700/50 rounded-full h-1.5">
        <div
          className="bg-brand-gold/70 h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [growth, setGrowth] = useState<UserGrowthPoint[]>([]);
  const [users, setUsers] = useState<UserDetailRow[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [adoption, setAdoption] = useState<FeatureAdoption | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [overviewData, growthData, userData, adoptionData] = await Promise.all([
        getAdminOverview(),
        getUserGrowth(30),
        getUserList(),
        getFeatureAdoption(),
      ]);
      setOverview(overviewData);
      setGrowth(growthData.data_points);
      setUsers(userData.users);
      setTotalUsers(userData.total);
      setAdoption(adoptionData);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen pb-20">
        <Header title="Admin Dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="card text-center py-8">
            <div className="text-gray-400">Loading admin data...</div>
          </div>
        </div>
      </div>
    );
  }

  const recentGrowth = growth.slice(-7);
  const maxUsers = recentGrowth.length > 0 ? Math.max(...recentGrowth.map((p) => p.total_users)) : 1;

  return (
    <div className="min-h-screen pb-20">
      <Header title="Admin Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Back to Settings */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Settings
        </button>

        {/* Overview Stats */}
        {overview && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 font-display text-gradient-gold">Platform Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="Total Users" value={overview.total_users} />
              <StatCard label="Active (7d)" value={overview.users_active_last_7_days} />
              <StatCard label="Active (30d)" value={overview.users_active_last_30_days} />
              <StatCard
                label="Workouts"
                value={overview.total_workouts_completed}
                sublabel={
                  overview.avg_workouts_per_active_user
                    ? `${overview.avg_workouts_per_active_user} avg/user`
                    : undefined
                }
              />
              <StatCard label="Meals Logged" value={overview.total_meals_logged} />
              <StatCard label="Sets Logged" value={overview.total_sets_logged} />
            </div>
          </div>
        )}

        {/* User Growth */}
        {recentGrowth.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 font-display text-gradient-gold">User Growth (Last 7 Days)</h3>
            <div className="space-y-2">
              {recentGrowth.map((point) => (
                <div key={point.date} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-14 font-mono shrink-0">
                    {formatDate(point.date)}
                  </span>
                  <div className="flex-1 bg-gray-700/50 rounded-full h-3">
                    <div
                      className="bg-brand-gold/70 h-3 rounded-full transition-all"
                      style={{ width: `${(point.total_users / maxUsers) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-300 w-6 text-right font-mono shrink-0">
                    {point.total_users}
                  </span>
                  {point.new_users > 0 && (
                    <span className="text-xs text-green-400 w-8 shrink-0">+{point.new_users}</span>
                  )}
                  {point.new_users === 0 && <span className="w-8 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Feature Adoption */}
        {adoption && overview && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 font-display text-gradient-gold">Feature Adoption</h3>
            <div className="grid grid-cols-2 gap-3">
              <AdoptionCard label="Workout Templates" count={adoption.users_with_templates} total={overview.total_users} />
              <AdoptionCard label="Custom Exercises" count={adoption.users_with_custom_exercises} total={overview.total_users} />
              <AdoptionCard label="Nutrition Tracking" count={adoption.users_with_meals} total={overview.total_users} />
              <AdoptionCard label="Macro Targets" count={adoption.users_with_macro_targets} total={overview.total_users} />
              <AdoptionCard label="Supplements" count={adoption.users_with_supplements} total={overview.total_users} />
              <AdoptionCard label="Body Measurements" count={adoption.users_with_measurements} total={overview.total_users} />
            </div>
            {Object.keys(adoption.coach_type_breakdown).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-400 uppercase tracking-wider font-display mb-2">Coach Preferences</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(adoption.coach_type_breakdown).map(([type, count]) => (
                    <span
                      key={type}
                      className="text-xs bg-gray-700/60 text-gray-300 px-2.5 py-1 rounded-full capitalize"
                    >
                      {type.replace(/_/g, ' ')}: {count}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* User List */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 font-display text-gradient-gold">
            Users ({totalUsers})
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left py-2 pr-4">Email</th>
                  <th className="text-left py-2 pr-4">Joined</th>
                  <th className="text-left py-2 pr-4">Last Active</th>
                  <th className="text-right py-2 pr-4">Workouts</th>
                  <th className="text-right py-2 pr-4">Meals</th>
                  <th className="text-left py-2 pr-4">Coach</th>
                  <th className="text-center py-2">Macros</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email} className="border-b border-gray-700/30 text-gray-300">
                    <td className="py-2.5 pr-4 font-mono text-xs">{u.email}</td>
                    <td className="py-2.5 pr-4 text-xs">{formatDate(u.created_at)}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {u.last_active ? formatDate(u.last_active) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 pr-4 text-right">{u.total_workouts}</td>
                    <td className="py-2.5 pr-4 text-right">{u.total_meals}</td>
                    <td className="py-2.5 pr-4 text-xs capitalize">
                      {u.coach_type ? u.coach_type.replace(/_/g, ' ') : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-center">
                      {u.has_macro_targets ? (
                        <span className="text-green-400 text-xs">✓</span>
                      ) : (
                        <span className="text-gray-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
