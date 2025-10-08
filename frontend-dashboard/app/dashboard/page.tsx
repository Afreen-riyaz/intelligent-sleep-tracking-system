"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  Settings,
  AlertTriangle,
  Activity,
  Heart,
  Thermometer,
  Zap,
  Eye,
  Download,
  FileText,
  X,
  LogOut,
  Moon,
  Sun,
  Bell,
  User,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { useAuth } from "@/components/auth-provider"
import { NotificationPopup } from "@/components/notification-popup"
import Link from "next/link"
import PatientProfile from "@/components/patient-profile"
import VitalsOverview from '@/components/vitals-overview';
import TemperatureTrends from '@/components/temperature-trends';
import SleepPostureDistribution from '@/components/sleep-posture-distribution';
import ReportGeneration from '@/components/report-generation';
import { AlertsSection, TrendsSummaryCard } from '@/components/vitals-overview';
import { supabase } from '@/lib/utils';
import HeartRateTrends from '@/components/heart-rate-trends';
import SpO2Trends from '@/components/spo2-trends';
import { Dialog } from '@/components/ui/dialog';
import AccountSettingsModal from '@/components/account-settings-modal';
import { useRef } from "react";

const temperatureData = [
  { time: "00:00", temp: 36.2 },
  { time: "06:00", temp: 36.1 },
  { time: "12:00", temp: 36.4 },
  { time: "18:00", temp: 36.6 },
  { time: "24:00", temp: 36.5 },
]

const sleepData = [
  { name: "Right (48%)", value: 48, color: "#10b981" },
  { name: "Left (30%)", value: 30, color: "#3b82f6" },
  { name: "Supine (22%)", value: 22, color: "#f59e0b" }
]

const vitalsData = [
  {
    icon: Thermometer,
    label: "Temperature",
    value: "36.5°C",
    status: "Normal",
    color: "text-blue-500",
    bgColor: "bg-blue-50 dark:bg-blue-900/20",
  },
  {
    icon: Heart,
    label: "Heart Rate",
    value: "72 bpm",
    status: "Normal",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    icon: Activity,
    label: "SpO2",
    value: "98%",
    status: "Low",
    color: "text-red-500",
    bgColor: "bg-red-50 dark:bg-red-900/20",
  },
  {
    icon: Zap,
    label: "Activity",
    value: "Active",
    status: "Normal",
    color: "text-green-500",
    bgColor: "bg-green-50 dark:bg-green-900/20",
  },
  {
    icon: Eye,
    label: "Sleep Posture",
    value: "Supine",
    status: "Good",
    color: "text-purple-500",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
]

const mockAlerts = [
  {
    id: "1",
    title: "Low SpO2 Level",
    message: "Oxygen level below 95% - requires attention",
    severity: "high" as const,
    time: "2 minutes ago",
  },
  {
    id: "2",
    title: "Heart Rate Spike",
    message: "Heart rate exceeded normal range",
    severity: "medium" as const,
    time: "15 minutes ago",
  },
  {
    id: "3",
    title: "Temperature Alert",
    message: "Slight temperature increase detected",
    severity: "low" as const,
    time: "1 hour ago",
  },
]

export default function Dashboard() {
  const [showAlert, setShowAlert] = useState(true)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const { logout } = useAuth()
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [vitals, setVitals] = useState<any>(null);
  const [historical, setHistorical] = useState<any[]>([]);
  const [dailyNote, setDailyNote] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [profilePic, setProfilePic] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    // Fetch latest vitals
    supabase
      .from('live_data')
      .select('*')
      .order('last_updated_at', { ascending: false })
      .limit(1)
      .single()
      .then((res) => setVitals(res.data));
    // Fetch historical data (last 7 days)
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    supabase
      .from('historical_data')
      .select('recorded_at, temperature, position, spo2')
      .order('recorded_at', { ascending: true })
      .gte('recorded_at', since)
      .then((res) => setHistorical(res.data || []));
    // Load notes from localStorage
    const saved = localStorage.getItem('caregiverNotes');
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowAlert(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  function saveNote() {
    if (dailyNote.trim()) {
      const updated = [dailyNote.trim(), ...notes];
      setNotes(updated);
      localStorage.setItem('caregiverNotes', JSON.stringify(updated));
      setDailyNote('');
    }
  }

  // Mock user data for the profile modal
  const currentUser = {
    patientId: "#36790",
    name: "Afreen Taj",
    age: 22,
    bloodGroup: "A+",
    phone: "07795923422",
    email: "afreen.riyaz789@gmail.com",
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Intelligent Sleep Tracking System</h1>
          </div>

          <div className="flex items-center gap-4">
            

           
            <div className="text-right hidden sm:block">
              <p className="text-sm text-gray-600 dark:text-gray-400">Patient ID: #36790</p>
              <p className="text-sm font-medium dark:text-white">Afreen Taj</p>
            </div>
            {/* <Avatar className="w-8 h-8">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar> */}
             {/* Profile Button - open modal */}
             <Button variant="ghost" size="icon" onClick={() => setShowProfile(true)}>
              {profilePic ? (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={profilePic} />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback>SJ</AvatarFallback>
                </Avatar>
              )}
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative"
              >
                <Bell className="w-4 h-4" />
                {mockAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {mockAlerts.length}
                  </span>
                )}
              </Button>
              <NotificationPopup
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
                alerts={mockAlerts}
              />
            </div>

            <Button variant="ghost" size="icon" onClick={() => setShowAccountSettings(true)}>
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Alert Notification */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed top-4 right-4 z-50 w-80"
            >
              <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-orange-800 dark:text-orange-400">Active Alerts</h4>
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                      Low SpO2 Level - Oxygen level below 95%
                    </AlertDescription>
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">2 minutes ago</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-orange-600"
                    onClick={() => setShowAlert(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-2">
                  <Button variant="outline" size="sm" className="text-xs bg-transparent">
                    View All Alerts
                  </Button>
                </div>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alerts and Trends Summary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AlertsSection vitals={vitals} />
          <TrendsSummaryCard historical={historical} />
        </div>

        {/* Vitals Overview */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vitals Overview</h2>
          <VitalsOverview />
        </motion.div>

        {/* Visual Analytics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visual Analytics</h2>
          <div className="grid lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-2 gap-6">
            <TemperatureTrends />
            <SleepPostureDistribution />
            <HeartRateTrends />
            <SpO2Trends />
          </div>
        </motion.div>

        {/* Report Generation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <ReportGeneration patientInfo={currentUser} />
        </motion.div>

        {/* Caregiver Daily Notes Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">Caregiver Daily Notes</h3>
          <textarea
            className="w-full border rounded p-2 mb-2"
            placeholder="Enter today's note..."
            value={dailyNote}
            onChange={e => setDailyNote(e.target.value)}
            rows={3}
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition mb-4"
            onClick={saveNote}
            disabled={!dailyNote.trim()}
          >
            Save Note
          </button>
          <div>
            <h4 className="font-semibold mb-1">Previous Notes:</h4>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              {notes.length === 0 && <li className="text-gray-400">No notes yet.</li>}
              {notes.map((note, idx) => (
                <li key={idx}>{note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      {/* Patient Profile Modal */}
      {showProfile && (
        <PatientProfile user={{ ...currentUser, profilePic }} onClose={() => setShowProfile(false)} />
      )}
      <Dialog open={showAccountSettings} onOpenChange={setShowAccountSettings}>
        <AccountSettingsModal
          onClose={() => setShowAccountSettings(false)}
          profilePic={profilePic}
          setProfilePic={setProfilePic}
          showAlert={showAlert}
          setShowAlert={setShowAlert}
          theme={theme}
          setTheme={setTheme}
          handleLogout={handleLogout}
        />
      </Dialog>
    </div>
  )
}
