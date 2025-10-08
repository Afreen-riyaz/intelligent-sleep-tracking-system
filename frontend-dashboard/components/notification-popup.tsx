"use client"

import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, X, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Alert {
  id: string
  title: string
  message: string
  severity: "high" | "medium" | "low"
  time: string
}

interface NotificationPopupProps {
  isOpen: boolean
  onClose: () => void
  alerts: Alert[]
}

export function NotificationPopup({ isOpen, onClose, alerts }: NotificationPopupProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-orange-600 bg-orange-50 border-orange-200"
      case "low":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute top-12 right-0 z-50 w-80"
        >
          <Card className="shadow-lg border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Active Alerts</CardTitle>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active alerts</p>
              ) : (
                alerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{alert.title}</h4>
                        <p className="text-xs opacity-90 mt-1">{alert.message}</p>
                        <div className="flex items-center gap-1 mt-2 text-xs opacity-75">
                          <Clock className="w-3 h-3" />
                          {alert.time}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
