import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Calendar, Droplets, Phone, Mail, Heart, Activity, Clock } from 'lucide-react';
import { supabase } from '@/lib/utils';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';

interface PatientProfileProps {
  user: any;
  onClose: () => void;
}

const PatientProfile: React.FC<PatientProfileProps> = ({ user, onClose }) => {
  const [vitals, setVitals] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentReason, setAppointmentReason] = useState('');
  const [history] = useState([
    { date: '2024-05-01', time: '10:00', reason: 'Routine Checkup' },
    { date: '2024-04-15', time: '14:30', reason: 'Follow-up' },
    { date: '2024-03-20', time: '09:00', reason: 'Consultation' },
  ]);

  useEffect(() => {
    async function fetchVitals() {
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
    fetchVitals();
  }, []);

  const medicalHistory = [
    'Hypertension (2019)',
    'Type 2 Diabetes (2020)',
    'Allergic to Penicillin',
    'Previous Surgery: Appendectomy (2018)'
  ];

  const currentMedications = [
    { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
    { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
    { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' }
  ];

  const emergencyContact = {
    name: 'Keertana',
    relationship: 'Sister',
    phone: '+91 9876543210'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center overflow-hidden">
                {user.profilePic ? (
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={user.profilePic} />
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Patient Profile
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {user.patientId} • {user.name}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </motion.button>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Basic Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Full Name:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Age:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Blood Group:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.bloodGroup}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Email:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
                  </div>
                </div>
              </div>

              {/* Current Vital Signs */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Current Vital Signs
                </h3>
                {loading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading vitals...</p>
                ) : error ? (
                  <p className="text-sm text-red-500">{error}</p>
                ) : vitals ? (
                  <>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {vitals.last_updated_at ? new Date(vitals.last_updated_at).toLocaleString() : '--'}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-sm text-blue-600 dark:text-blue-400">Temperature</p>
                        <p className="font-bold text-blue-900 dark:text-blue-300">{vitals.temperature ? `${vitals.temperature}°C` : '--'}</p>
                      </div>
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">Heart Rate</p>
                        <p className="font-bold text-green-900 dark:text-green-300">{vitals.heart_rate ? `${vitals.heart_rate} bpm` : '--'}</p>
                      </div>
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">Oxygen Saturation</p>
                        <p className="font-bold text-red-900 dark:text-red-300">{vitals.spo2 ? `${vitals.spo2}%` : '--'}</p>
                      </div>
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <p className="text-sm text-purple-600 dark:text-purple-400">Sleep Posture</p>
                        <p className="font-bold text-purple-900 dark:text-purple-300">{vitals.position || '--'}</p>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            {/* Medical History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Medical History
              </h3>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <ul className="space-y-2">
                  {medicalHistory.map((item, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Current Medications */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Current Medications
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {currentMedications.map((med, index) => (
                  <div key={index} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{med.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{med.dosage} - {med.frequency}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                <Phone className="w-5 h-5 mr-2" />
                Emergency Contact
              </h3>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-300">{emergencyContact.name}</h4>
                    <p className="text-sm text-red-600 dark:text-red-400">{emergencyContact.relationship}</p>
                    <p className="text-sm font-medium text-red-800 dark:text-red-300">{emergencyContact.phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                {/* <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Edit Profile
                </motion.button> */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                  onClick={() => setShowSchedule(true)}
                >
                  Schedule Appointment
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  onClick={() => setShowHistory(true)}
                >
                  View History
                </motion.button>
              </div>
            </div>

            {/* Patient Status */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Health</p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">Stable</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Risk Level</p>
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">Moderate</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Monitoring</p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">Active</p>
                </div>
              </div>
            </div>
          </div>
          {/* Schedule Appointment Modal */}
          <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Schedule Appointment</DialogTitle>
              </DialogHeader>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input type="date" className="w-full border rounded p-2" value={appointmentDate} onChange={e => setAppointmentDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time</label>
                  <input type="time" className="w-full border rounded p-2" value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason</label>
                  <input className="w-full border rounded p-2" value={appointmentReason} onChange={e => setAppointmentReason(e.target.value)} placeholder="Reason for appointment" />
                </div>
                <DialogFooter>
                  <button
                    type="button"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => {
                      alert('Appointment scheduled (placeholder)');
                      setShowSchedule(false);
                      setAppointmentDate('');
                      setAppointmentTime('');
                      setAppointmentReason('');
                    }}
                  >
                    Schedule
                  </button>
                  <DialogClose asChild>
                    <button type="button" className="px-4 py-2 border rounded">Cancel</button>
                  </DialogClose>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          {/* View History Modal */}
          <Dialog open={showHistory} onOpenChange={setShowHistory}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Appointment History</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {history.length === 0 ? (
                  <div className="text-gray-500">No past appointments.</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.map((item, idx) => (
                      <li key={idx} className="py-2 flex flex-col">
                        <span className="font-medium">{item.date} at {item.time}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <button type="button" className="px-4 py-2 border rounded">Close</button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PatientProfile; 