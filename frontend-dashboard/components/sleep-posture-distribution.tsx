import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { supabase } from '@/lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ["#10b981", "#3b82f6", "#f59e0b"];
const POSTURES = ["Right", "Left", "Supine Position"];

export default function SleepPostureDistribution() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('historical_data')
        .select('recorded_at, position')
        .not('position', 'is', null)
        .order('recorded_at', { ascending: true });
      if (dateRange === '7d') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('recorded_at', since);
      } else if (dateRange === '30d') {
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('recorded_at', since);
      } else if (dateRange === 'custom' && customStart && customEnd) {
        query = query.gte('recorded_at', customStart).lte('recorded_at', customEnd);
      }
      const { data, error } = await query;
      if (error) {
        setError('Failed to load sleep posture data');
        setLoading(false);
        return;
      }
      // Count occurrences
      const counts: Record<string, number> = {};
      (data || []).forEach((d: any) => {
        counts[d.position] = (counts[d.position] || 0) + 1;
      });
      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      const chartData = POSTURES.map((posture, i) => ({
        name: `${posture} (${total ? Math.round((counts[posture] || 0) / total * 100) : 0}%)`,
        value: counts[posture] || 0,
        color: COLORS[i],
      }));
      setData(chartData);
      setLoading(false);
    }
    fetchData();
  }, [dateRange, customStart, customEnd]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sleep Posture Distribution</CardTitle>
        <div className="flex gap-2 mt-2">
          <select value={dateRange} onChange={e => setDateRange(e.target.value as any)} className="border rounded p-1">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="custom">Custom</option>
          </select>
          {dateRange === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded p-1" />
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded p-1" />
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">Loading chart...</div>
        ) : error ? (
          <div className="h-64 flex items-center justify-center text-red-500">{error}</div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={data}
                    cx={100}
                    cy={100}
                    innerRadius={0}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-gray-600 dark:text-gray-400">{item.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 