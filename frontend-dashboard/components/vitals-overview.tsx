import { useEffect, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Thermometer, Heart, Activity, Eye } from 'lucide-react';
import { supabase } from '@/lib/utils';

const VITALS = [
  { key: 'temperature', label: 'Temperature', icon: Thermometer, color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'heart_rate', label: 'Heart Rate', icon: Heart, color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20' },
  { key: 'spo2', label: 'SpO2', icon: Activity, color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  { key: 'position', label: 'Sleep Posture', icon: Eye, color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
];

export function AlertsSection({ vitals }: { vitals: any }) {
  const alerts = [];
  if (!vitals) {
    alerts.push('No vitals data available.');
  } else {
    if (vitals.temperature == null) alerts.push('Temperature data missing.');
    if (vitals.heart_rate == null) alerts.push('Heart rate data missing.');
    if (vitals.spo2 == null) alerts.push('SpO2 data missing.');
    if (vitals.position == null) alerts.push('Sleep posture data missing.');
    if (vitals.temperature > 37.5) alerts.push('High temperature detected!');
    if (vitals.temperature < 35) alerts.push('Low temperature detected!');
    if (vitals.spo2 != null && vitals.spo2 < 95) alerts.push('Low SpO2 detected!');
    if (vitals.position && !['Supine', 'Left', 'Right'].includes(vitals.position)) alerts.push('Abnormal sleep posture detected!');
  }
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">Alerts</h3>
      {alerts.length === 0 ? (
        <div className="text-green-700 dark:text-green-300">No alerts. All vitals normal.</div>
      ) : (
        <ul className="list-disc pl-5 space-y-1">
          {alerts.map((alert, i) => (
            <li key={i} className="text-red-700 dark:text-red-300">{alert}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TrendsSummaryCard({ historical }: { historical: any[] }) {
  if (!historical || historical.length === 0) return null;
  const avgTemp = (historical.reduce((acc, d) => acc + (d.temperature || 0), 0) / historical.length).toFixed(1);
  const postureCounts: Record<string, number> = {};
  historical.forEach((d) => {
    if (d.position) postureCounts[d.position] = (postureCounts[d.position] || 0) + 1;
  });
  const mostCommonPosture = Object.entries(postureCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '--';
  const flagged = historical.some((d) => d.temperature > 37.5 || d.spo2 < 95);
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">Trends Summary</h3>
      <div className="mb-1"><b>Avg Temp:</b> {avgTemp}°C</div>
      <div className="mb-1"><b>Most Common Sleep Posture:</b> {mostCommonPosture}</div>
      <div className="mb-1"><b>Flagged Data:</b> {flagged ? 'Yes (see alerts)' : 'No'}</div>
    </div>
  );
}

export default function VitalsOverview() {
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;
    async function fetchData() {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('live_data')
        .select('*')
        .order('last_updated_at', { ascending: false })
        .limit(1)
        .single();
      if (error) {
        setError('Failed to load vitals');
        setLoading(false);
        return;
      }
      setVitals(data);
      setLoading(false);
    }
    fetchData();
    subscription = supabase
      .channel('live_data_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_data' }, (payload) => {
        setVitals(payload.new);
      })
      .subscribe();
    return () => {
      if (subscription) supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return <div className="h-24 flex items-center justify-center">Loading vitals...</div>;
  if (error) return <div className="h-24 flex items-center justify-center text-red-500">{error}</div>;
  if (!vitals) return null;

  const vitalsData = [
    {
      ...VITALS[0],
      value: vitals.temperature ? `${vitals.temperature}°C` : '--',
      status: 'Normal',
    },
    {
      ...VITALS[1],
      value: vitals.heart_rate ? `${vitals.heart_rate} bpm` : '--',
      status: 'Normal',
    },
    {
      ...VITALS[2],
      value: vitals.spo2 ? `${vitals.spo2}%` : '--',
      status: 'Normal',
    },
    {
      ...VITALS[3],
      value: vitals.position || '--',
      status: 'Good',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {vitalsData.map((vital, index) => (
        <Card className="hover:shadow-md transition-shadow" key={vital.label}>
          <CardContent className="p-4">
            <div className={`w-10 h-10 rounded-full ${vital.bgColor} flex items-center justify-center mb-3`}>
              <vital.icon className={`w-5 h-5 ${vital.color}`} />
            </div>
            <div className="space-y-1">
              <p className="text-xs text-gray-600 dark:text-gray-400">{vital.label}</p>
              <p className="text-lg font-semibold dark:text-white">{vital.value}</p>
              <p className={`text-xs ${vital.status === 'Normal' || vital.status === 'Good' ? 'text-green-600' : vital.status === 'Low' ? 'text-red-600' : 'text-yellow-600'}`}>{vital.status}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 