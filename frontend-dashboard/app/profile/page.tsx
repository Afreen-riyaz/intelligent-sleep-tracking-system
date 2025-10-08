"use client"

import { motion } from "framer-motion"
import { ArrowLeft, User, Calendar, Phone, Mail, MapPin, Heart, Activity, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

const patientData = {
  id: "#36790",
  name: "Afreen Taj",
  age: 22,
  gender: "Female",
  bloodType: "A+",
  email: "afreen.riyaz789@gmail.com",
  phone: "+91 7795923422",
  address: "123 Main St, Anytown, Bangalore",
  emergencyContact: {
    name: "Keertana",
    relationship: "Sister",
    phone: "+91 9876543210",
  },
  medicalHistory: [
    "Hypertension (2019)",
    "Type 2 Diabetes (2020)",
    "Allergic to Penicillin",
    "Previous Surgery: Appendectomy (2018)",
  ],
  currentMedications: ["Metformin 500mg - Twice daily", "Lisinopril 10mg - Once daily", "Aspirin 81mg - Once daily"],
  vitalSigns: {
    lastUpdated: "2024-01-15 14:30",
    temperature: "36.5°C",
    heartRate: "72 bpm",
    bloodPressure: "120/80 mmHg",
    oxygenSaturation: "98%",
    weight: "68 kg",
    height: "165 cm",
  },
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header />

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            </Link>
          </motion.div>

          {/* Patient Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src="/placeholder-user.jpg" />
                    <AvatarFallback className="text-2xl">SJ</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patientData.name}</h1>
                        <p className="text-gray-600 dark:text-gray-300">Patient ID: {patientData.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{patientData.gender}</Badge>
                        <Badge variant="secondary">Age {patientData.age}</Badge>
                        <Badge variant="secondary">Blood Type {patientData.bloodType}</Badge>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail className="w-4 h-4" />
                        {patientData.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Phone className="w-4 h-4" />
                        {patientData.phone}
                      </div>
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <MapPin className="w-4 h-4" />
                        {patientData.address}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Vital Signs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="w-5 h-5" />
                      Current Vital Signs
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Last updated: {patientData.vitalSigns.lastUpdated}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Temperature</span>
                          <span className="font-semibold">{patientData.vitalSigns.temperature}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Heart Rate</span>
                          <span className="font-semibold">{patientData.vitalSigns.heartRate}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Blood Pressure</span>
                          <span className="font-semibold">{patientData.vitalSigns.bloodPressure}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Oxygen Saturation</span>
                          <span className="font-semibold">{patientData.vitalSigns.oxygenSaturation}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Weight</span>
                          <span className="font-semibold">{patientData.vitalSigns.weight}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <span className="text-sm font-medium">Height</span>
                          <span className="font-semibold">{patientData.vitalSigns.height}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Medical History */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Medical History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patientData.medicalHistory.map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Current Medications */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Current Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {patientData.currentMedications.map((medication, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                          <span className="text-sm">{medication}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Emergency Contact */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Emergency Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{patientData.emergencyContact.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {patientData.emergencyContact.relationship}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Phone className="w-4 h-4" />
                      {patientData.emergencyContact.phone}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Quick Actions */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* <Button className="w-full justify-start bg-transparent" variant="outline">
                      <User className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button> */}
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Button>
                    <Button className="w-full justify-start bg-transparent" variant="outline">
                      <Clock className="w-4 h-4 mr-2" />
                      View History
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Status */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>Patient Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Overall Health</span>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                          Stable
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Risk Level</span>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          Moderate
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Monitoring</span>
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Active</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
