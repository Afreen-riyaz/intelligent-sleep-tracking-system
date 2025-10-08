import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { supabase } from '@/lib/utils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts';

export default function HeartRateTrends() {
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
        .select('recorded_at, heart_rate')
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
        setError('Failed to load heart rate trends');
        setLoading(false);
        return;
      }
      setData(
        (data || []).map((d: any) => ({
          time: new Date(d.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          heartRate: d.heart_rate,
        }))
      );
      setLoading(false);
    }
    fetchData();
  }, [dateRange, customStart, customEnd]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Heart Rate Trends</CardTitle>
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
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <XAxis dataKey="time" axisLine={false} tickLine={false} className="text-xs" />
                <YAxis domain={[40, 140]} axisLine={false} tickLine={false} className="text-xs" />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 