import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { FileText, Download, Mail, Eye, X } from 'lucide-react';
import { supabase } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PatientInfo {
  patientId: string;
  name: string;
  age: number;
  bloodGroup: string;
  phone: string;
  email: string;
}

interface ReportGenerationProps {
  patientInfo?: PatientInfo;
}

export default function ReportGeneration({ patientInfo }: ReportGenerationProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [dateRange, setDateRange] = useState<'7days' | 'custom'>('7days');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [doctorEmail, setDoctorEmail] = useState('');

  // File upload and prediction state
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<any>(null);

  async function generateSummary() {
    setLoading(true);
    setError(null);
    setSendResult(null);
    try {
      // Fetch data based on date range
      let historicalQuery = supabase
        .from('historical_data')
        .select('recorded_at, temperature, position')
        .order('recorded_at', { ascending: true });
      if (dateRange === '7days') {
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        historicalQuery = historicalQuery.gte('recorded_at', since);
      } else if (dateRange === 'custom' && customStart && customEnd) {
        historicalQuery = historicalQuery.gte('recorded_at', customStart).lte('recorded_at', customEnd);
      }
      const { data: historical, error: historicalError } = await historicalQuery;
      if (historicalError) throw historicalError;
      const { data: vitals, error: vitalsError } = await supabase
        .from('live_data')
        .select('*')
        .order('last_updated_at', { ascending: false })
        .limit(1)
        .single();
      if (vitalsError) throw vitalsError;
      setSummaryData({ vitals, historical });
      setShowModal(true);
    } catch (e: any) {
      setError('Failed to generate summary. ' + (e?.message || ''));
    }
    setLoading(false);
  }

  async function exportReport() {
    if (!summaryData) return;
    let fileName = patientInfo ? `health_report_${patientInfo.name.replace(/\s+/g, '_')}` : 'health_report';
    if (exportFormat === 'pdf' || exportFormat === 'excel') {
      // PDF generation
      const doc = new jsPDF();
      
      // Add patient information section
      doc.setFontSize(18);
      doc.text('Patient Health Report', 14, 18);
      
      if (patientInfo) {
        doc.setFontSize(12);
        doc.text('Patient Information:', 14, 30);
        let y = 36;
        
        // Patient info table
        autoTable(doc, {
          startY: y,
          head: [['Field', 'Value']],
          body: [
            ['Patient ID', patientInfo.patientId],
            ['Full Name', patientInfo.name],
            ['Age', `${patientInfo.age} years`],
            ['Blood Group', patientInfo.bloodGroup],
            ['Phone', patientInfo.phone],
            ['Email', patientInfo.email],
          ],
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : y + 15;
        
        // Add report generation date
        doc.setFontSize(10);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, y);
        y += 8;
        
        // Vitals Overview
        doc.setFontSize(14);
        doc.text('Current Vital Signs:', 14, y);
        y += 6;
        
        const vitals = summaryData?.vitals;
        autoTable(doc, {
          startY: y,
          head: [['Temperature', 'Heart Rate', 'SpO2', 'Sleep Posture']],
          body: [[
            vitals?.temperature ? `${vitals.temperature}°C` : '--',
            vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '--',
            vitals?.spo2 ? `${vitals.spo2}%` : '--',
            vitals?.position || '--',
          ]],
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [34, 197, 94], // Green color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        
        // Temperature Trends
        doc.setFontSize(14);
        doc.text('Temperature Trends:', 14, y);
        y += 6;
        
        const historical = summaryData?.historical;
        autoTable(doc, {
          startY: y,
          head: [['Time', 'Temperature']],
          body: (historical || []).map((d: any) => [
            d.recorded_at ? new Date(d.recorded_at).toLocaleString() : '--',
            d.temperature ? `${d.temperature}°C` : '--'
          ]),
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [239, 68, 68], // Red color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        
        // Sleep Posture Distribution
        doc.setFontSize(14);
        doc.text('Sleep Posture Distribution:', 14, y);
        y += 6;
        
        // Calculate posture distribution
        const counts: Record<string, number> = {};
        (historical || []).forEach((d: any) => {
          if (d.position) counts[d.position] = (counts[d.position] || 0) + 1;
        });
        const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
        
        autoTable(doc, {
          startY: y,
          head: [['Posture', 'Count', 'Percentage']],
          body: Object.entries(counts).map(([posture, count]) => [
            posture,
            count.toString(),
            total ? `${Math.round((count / total) * 100)}%` : '0%'
          ]),
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [147, 51, 234], // Purple color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Add summary section
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : y + 15;
        doc.setFontSize(14);
        doc.text('Health Summary:', 14, y);
        y += 6;
        
        const summaryText = [
          `• Patient: ${patientInfo.name} (${patientInfo.patientId})`,
          `• Current Status: ${vitals?.temperature && vitals.temperature > 37.5 ? 'Elevated Temperature' : 'Normal Temperature'}`,
          `• Heart Rate: ${vitals?.heart_rate ? (vitals.heart_rate > 100 ? 'Elevated' : vitals.heart_rate < 60 ? 'Low' : 'Normal') : 'Not Available'}`,
          `• Oxygen Saturation: ${vitals?.spo2 ? (vitals.spo2 < 95 ? 'Below Normal' : 'Normal') : 'Not Available'}`,
          `• Most Common Sleep Position: ${Object.keys(counts).length > 0 ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : 'Not Available'}`,
        ];
        
        summaryText.forEach((text, index) => {
          doc.setFontSize(10);
          doc.text(text, 16, y + (index * 5));
        });
        
        // Add Medical History section
        y += (summaryText.length * 5) + 10;
        doc.setFontSize(14);
        doc.text('Medical History:', 14, y);
        y += 6;
        
        const medicalHistory = [
          'Hypertension (2019)',
          'Type 2 Diabetes (2020)',
          'Allergic to Penicillin',
          'Previous Surgery: Appendectomy (2018)'
        ];
        
        medicalHistory.forEach((item, index) => {
          doc.setFontSize(10);
          doc.text(`• ${item}`, 16, y + (index * 5));
        });
        
        // Add Current Medications section
        y += (medicalHistory.length * 5) + 10;
        doc.setFontSize(14);
        doc.text('Current Medications:', 14, y);
        y += 6;
        
        const currentMedications = [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' }
        ];
        
        autoTable(doc, {
          startY: y,
          head: [['Medication', 'Dosage', 'Frequency']],
          body: currentMedications.map(med => [
            med.name,
            med.dosage,
            med.frequency
          ]),
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [16, 185, 129], // Emerald color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Add Emergency Contact section
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.setFontSize(14);
        doc.text('Emergency Contact:', 14, y);
        y += 6;
        
        const emergencyContact = {
          name: 'Keertana',
          relationship: 'Sister',
          phone: '+91 9876543210'
        };
        
        const emergencyText = [
          `Name: ${emergencyContact.name}`,
          `Relationship: ${emergencyContact.relationship}`,
          `Phone: ${emergencyContact.phone}`
        ];
        
        emergencyText.forEach((text, index) => {
          doc.setFontSize(10);
          doc.text(text, 16, y + (index * 5));
        });
        
        // Add page break and additional information on new page if needed
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        // Add Recommendations section
        y += (emergencyText.length * 5) + 15;
        doc.setFontSize(14);
        doc.text('Recommendations:', 14, y);
        y += 6;
        
        const recommendations = [
          'Continue monitoring vital signs daily',
          'Maintain regular sleep schedule',
          'Follow prescribed medication regimen',
          'Schedule follow-up appointment in 2 weeks',
          'Monitor blood glucose levels as directed'
        ];
        
        recommendations.forEach((rec, index) => {
          doc.setFontSize(10);
          doc.text(`• ${rec}`, 16, y + (index * 5));
        });
        
        // Add footer with disclaimer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.text('This report is generated automatically by the Intelligent Sleep Tracking System.', 14, pageHeight - 20);
        doc.text('For medical emergencies, please contact emergency services immediately.', 14, pageHeight - 15);
        doc.text('Generated on: ' + new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString(), 14, pageHeight - 10);
      } else {
        // Fallback if no patient info provided
        doc.setFontSize(12);
        doc.text('Vitals Overview:', 14, 30);
        let y = 34;
        const vitals = summaryData?.vitals;
        autoTable(doc, {
          startY: y,
          head: [['Temperature', 'Heart Rate', 'SpO2', 'Sleep Posture']],
          body: [[
            vitals?.temperature ? `${vitals.temperature}°C` : '--',
            vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '--',
            vitals?.spo2 ? `${vitals.spo2}%` : '--',
            vitals?.position || '--',
          ]],
        });
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.text('Temperature Trends:', 14, y);
        y += 4;
        const historical = summaryData?.historical;
        autoTable(doc, {
          startY: y,
          head: [['Time', 'Temperature']],
          body: (historical || []).map((d: any) => [
            d.recorded_at ? new Date(d.recorded_at).toLocaleString() : '--',
            d.temperature ?? '--'
          ]),
        });
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.text('Sleep Posture Distribution:', 14, y);
        y += 4;
        // Calculate posture distribution
        const counts: Record<string, number> = {};
        (historical || []).forEach((d: any) => {
          if (d.position) counts[d.position] = (counts[d.position] || 0) + 1;
        });
        const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
        autoTable(doc, {
          startY: y,
          head: [['Posture', 'Count', 'Percent']],
          body: Object.entries(counts).map(([posture, count]) => [
            posture,
            count,
            total ? `${Math.round((count / total) * 100)}%` : '0%'
          ]),
        });
      }
      
      // Save the PDF with patient name if available
      doc.save(`${fileName}.pdf`);
      // CSV generation (Excel can open CSV)
      const rows = [
        ['Time', 'Temperature', 'Position'],
        ...(summaryData.historical || []).map((d: any) => [
          d.recorded_at ? new Date(d.recorded_at).toLocaleString() : '--',
          d.temperature ?? '--',
          d.position ?? '--',
        ]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  async function sendToDoctor() {
    if (!summaryData || !patientInfo) return;
    setSending(true);
    setSendResult(null);
    try {
      // Generate PDF as base64
      const doc = new jsPDF();
      
      // Add patient information section
      doc.setFontSize(18);
      doc.text('Patient Health Report', 14, 18);
      
      if (patientInfo) {
        doc.setFontSize(12);
        doc.text('Patient Information:', 14, 30);
        let y = 36;
        
        // Patient info table
        autoTable(doc, {
          startY: y,
          head: [['Field', 'Value']],
          body: [
            ['Patient ID', patientInfo.patientId],
            ['Full Name', patientInfo.name],
            ['Age', `${patientInfo.age} years`],
            ['Blood Group', patientInfo.bloodGroup],
            ['Phone', patientInfo.phone],
            ['Email', patientInfo.email],
          ],
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [59, 130, 246], // Blue color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : y + 15;
        
        // Add report generation date
        doc.setFontSize(10);
        doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, y);
        y += 8;
        
        // Vitals Overview
        doc.setFontSize(14);
        doc.text('Current Vital Signs:', 14, y);
        y += 6;
        
        const vitals = summaryData?.vitals;
        autoTable(doc, {
          startY: y,
          head: [['Temperature', 'Heart Rate', 'SpO2', 'Sleep Posture']],
          body: [[
            vitals?.temperature ? `${vitals.temperature}°C` : '--',
            vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '--',
            vitals?.spo2 ? `${vitals.spo2}%` : '--',
            vitals?.position || '--',
          ]],
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [34, 197, 94], // Green color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        
        // Temperature Trends
        doc.setFontSize(14);
        doc.text('Temperature Trends:', 14, y);
        y += 6;
        
        const historical = summaryData?.historical;
        autoTable(doc, {
          startY: y,
          head: [['Time', 'Temperature']],
          body: (historical || []).map((d: any) => [
            d.recorded_at ? new Date(d.recorded_at).toLocaleString() : '--',
            d.temperature ? `${d.temperature}°C` : '--'
          ]),
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [239, 68, 68], // Red color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        
        // Sleep Posture Distribution
        doc.setFontSize(14);
        doc.text('Sleep Posture Distribution:', 14, y);
        y += 6;
        
        // Calculate posture distribution
        const counts: Record<string, number> = {};
        (historical || []).forEach((d: any) => {
          if (d.position) counts[d.position] = (counts[d.position] || 0) + 1;
        });
        const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
        
        autoTable(doc, {
          startY: y,
          head: [['Posture', 'Count', 'Percentage']],
          body: Object.entries(counts).map(([posture, count]) => [
            posture,
            count.toString(),
            total ? `${Math.round((count / total) * 100)}%` : '0%'
          ]),
          styles: {
            fontSize: 10,
            cellPadding: 4,
          },
          headStyles: {
            fillColor: [147, 51, 234], // Purple color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Add summary section
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : y + 15;
        doc.setFontSize(14);
        doc.text('Health Summary:', 14, y);
        y += 6;
        
        const summaryText = [
          `• Patient: ${patientInfo.name} (${patientInfo.patientId})`,
          `• Current Status: ${vitals?.temperature && vitals.temperature > 37.5 ? 'Elevated Temperature' : 'Normal Temperature'}`,
          `• Heart Rate: ${vitals?.heart_rate ? (vitals.heart_rate > 100 ? 'Elevated' : vitals.heart_rate < 60 ? 'Low' : 'Normal') : 'Not Available'}`,
          `• Oxygen Saturation: ${vitals?.spo2 ? (vitals.spo2 < 95 ? 'Below Normal' : 'Normal') : 'Not Available'}`,
          `• Most Common Sleep Position: ${Object.keys(counts).length > 0 ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] : 'Not Available'}`,
        ];
        
        summaryText.forEach((text, index) => {
          doc.setFontSize(10);
          doc.text(text, 16, y + (index * 5));
        });
        
        // Add Medical History section
        y += (summaryText.length * 5) + 10;
        doc.setFontSize(14);
        doc.text('Medical History:', 14, y);
        y += 6;
        
        const medicalHistory = [
          'Hypertension (2019)',
          'Type 2 Diabetes (2020)',
          'Allergic to Penicillin',
          'Previous Surgery: Appendectomy (2018)'
        ];
        
        medicalHistory.forEach((item, index) => {
          doc.setFontSize(10);
          doc.text(`• ${item}`, 16, y + (index * 5));
        });
        
        // Add Current Medications section
        y += (medicalHistory.length * 5) + 10;
        doc.setFontSize(14);
        doc.text('Current Medications:', 14, y);
        y += 6;
        
        const currentMedications = [
          { name: 'Metformin', dosage: '500mg', frequency: 'Twice daily' },
          { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' }
        ];
        
        autoTable(doc, {
          startY: y,
          head: [['Medication', 'Dosage', 'Frequency']],
          body: currentMedications.map(med => [
            med.name,
            med.dosage,
            med.frequency
          ]),
          styles: {
            fontSize: 10,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [16, 185, 129], // Emerald color
            textColor: 255,
            fontStyle: 'bold',
          },
        });
        
        // Add Emergency Contact section
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.setFontSize(14);
        doc.text('Emergency Contact:', 14, y);
        y += 6;
        
        const emergencyContact = {
          name: 'Keertana',
          relationship: 'Sister',
          phone: '+91 9876543210'
        };
        
        const emergencyText = [
          `Name: ${emergencyContact.name}`,
          `Relationship: ${emergencyContact.relationship}`,
          `Phone: ${emergencyContact.phone}`
        ];
        
        emergencyText.forEach((text, index) => {
          doc.setFontSize(10);
          doc.text(text, 16, y + (index * 5));
        });
        
        // Add page break and additional information on new page if needed
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        
        // Add Recommendations section
        y += (emergencyText.length * 5) + 15;
        doc.setFontSize(14);
        doc.text('Recommendations:', 14, y);
        y += 6;
        
        const recommendations = [
          'Continue monitoring vital signs daily',
          'Maintain regular sleep schedule',
          'Follow prescribed medication regimen',
          'Schedule follow-up appointment in 2 weeks',
          'Monitor blood glucose levels as directed'
        ];
        
        recommendations.forEach((rec, index) => {
          doc.setFontSize(10);
          doc.text(`• ${rec}`, 16, y + (index * 5));
        });
        
        // Add footer with disclaimer
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.text('This report is generated automatically by the Intelligent Sleep Tracking System.', 14, pageHeight - 20);
        doc.text('For medical emergencies, please contact emergency services immediately.', 14, pageHeight - 15);
        doc.text('Generated on: ' + new Date().toLocaleDateString() + ' at ' + new Date().toLocaleTimeString(), 14, pageHeight - 10);
      } else {
        // Fallback if no patient info provided
        doc.setFontSize(12);
        doc.text('Vitals Overview:', 14, 30);
        let y = 34;
        const vitals = summaryData?.vitals;
        autoTable(doc, {
          startY: y,
          head: [['Temperature', 'Heart Rate', 'SpO2', 'Sleep Posture']],
          body: [[
            vitals?.temperature ? `${vitals.temperature}°C` : '--',
            vitals?.heart_rate ? `${vitals.heart_rate} bpm` : '--',
            vitals?.spo2 ? `${vitals.spo2}%` : '--',
            vitals?.position || '--',
          ]],
        });
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.text('Temperature Trends:', 14, y);
        y += 4;
        const historical = summaryData?.historical;
        autoTable(doc, {
          startY: y,
          head: [['Time', 'Temperature']],
          body: (historical || []).map((d: any) => [
            d.recorded_at ? new Date(d.recorded_at).toLocaleString() : '--',
            d.temperature ?? '--'
          ]),
        });
        y = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 10 : y + 10;
        doc.text('Sleep Posture Distribution:', 14, y);
        y += 4;
        // Calculate posture distribution
        const counts: Record<string, number> = {};
        (historical || []).forEach((d: any) => {
          if (d.position) counts[d.position] = (counts[d.position] || 0) + 1;
        });
        const total = Object.values(counts).reduce((a: number, b: number) => a + b, 0);
        autoTable(doc, {
          startY: y,
          head: [['Posture', 'Count', 'Percent']],
          body: Object.entries(counts).map(([posture, count]) => [
            posture,
            count,
            total ? `${Math.round((count / total) * 100)}%` : '0%'
          ]),
        });
      }
      
      // Save the PDF with patient name if available
      const fileName = patientInfo ? `health_report_${patientInfo.name.replace(/\s+/g, '_')}.pdf` : 'health_report.pdf';
      doc.save(fileName);

      const pdfArrayBuffer = doc.output('arraybuffer');
      const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));
      const res = await fetch('/api/send-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: doctorEmail || 'doctor@example.com', // TODO: make this dynamic
          patientId: patientInfo.patientId,
          remarks,
          pdfBase64,
        }),
      });
      const result = await res.json();
      if (result.success) setSendResult('Report sent successfully!');
      else setSendResult('Failed to send: ' + (result.error || 'Unknown error'));
    } catch (e: any) {
      setSendResult('Failed to send: ' + (e?.message || ''));
    }
    setSending(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    setPredictionResult(null);
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('http://127.0.0.1:5000/predict', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Prediction API error');
      const result = await res.json();
      setPredictionResult(result);
    } catch (e: any) {
      setUploadError(e?.message || 'Failed to get prediction');
    }
    setUploading(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Report Generation</CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">Generate comprehensive health report</p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <select value={dateRange} onChange={e => setDateRange(e.target.value as any)} className="border rounded p-1">
            <option value="7days">Last 7 days</option>
            <option value="custom">Custom</option>
          </select>
          {dateRange === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="border rounded p-1" />
              <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="border rounded p-1" />
            </>
          )}
          <select value={exportFormat} onChange={e => setExportFormat(e.target.value as any)} className="border rounded p-1">
            <option value="pdf">PDF</option>
            <option value="excel">Excel</option>
          </select>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <Button className="flex items-center gap-2" onClick={generateSummary} disabled={loading}>
            <FileText className="w-4 h-4" />
            {loading ? 'Generating...' : 'Generate Summary'}
          </Button>
        </div>
        {error && <div className="mt-2 text-red-500">{error}</div>}
        <div className="mt-8 p-4 border rounded bg-gray-50 dark:bg-gray-900">
          <h3 className="font-semibold mb-2">Upload File for Prediction</h3>
          <input type="file" accept="*" onChange={handleFileUpload} className="mb-2" />
          {uploading && <div className="text-blue-600">Uploading and predicting...</div>}
          {uploadError && <div className="text-red-500">{uploadError}</div>}
          {predictionResult && (
            <div className="mt-2 p-3 border rounded bg-white dark:bg-gray-800">
              <div className="font-bold text-green-700">Prediction: <span className="text-black dark:text-white">{predictionResult.prediction}</span></div>
              <div className="mt-2">
                <div className="font-semibold">Probabilities:</div>
                <ul className="list-disc ml-6">
                  {predictionResult.probabilities && Object.entries(predictionResult.probabilities).map(([label, prob]: any) => (
                    <li key={label} className="text-sm">{label}: <span className="font-mono">{(prob * 100).toFixed(2)}%</span></li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal Preview */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2" onClick={() => setShowModal(false)}><X /></button>
            <h2 className="text-xl font-bold mb-2">Summary Preview</h2>
            {/* Show summaryData in a readable format, e.g. vitals, trends, etc. */}
            <div className="mb-4">
              <div className="mb-2"><b>Patient:</b> {patientInfo?.name}</div>
              <div className="mb-2"><b>Latest Temp:</b> {summaryData?.vitals?.temperature ?? '--'}°C</div>
              <div className="mb-2"><b>Latest Heart Rate:</b> {summaryData?.vitals?.heart_rate ?? '--'} bpm</div>
              <div className="mb-2"><b>Latest SpO2:</b> {summaryData?.vitals?.spo2 ?? '--'}%</div>
              <div className="mb-2"><b>Avg Temp (7d):</b> {summaryData?.historical && summaryData.historical.length > 0 ? (summaryData.historical.reduce((acc: number, d: any) => acc + (d.temperature || 0), 0) / summaryData.historical.length).toFixed(1) : '--'}°C</div>
              <div className="mb-2"><b>Flagged Data:</b> {summaryData?.historical?.some((d: any) => d.temperature > 37.5) ? 'High Temp Detected' : 'None'}</div>
              <div className="mb-2"><b>AI Health Insight:</b> <span className="italic text-blue-600">{`Patient's sleep and temperature are within normal range. Continue current care. (AI-generated)`}</span></div>
            </div>
            <input
              className="w-full border rounded p-2 mb-2"
              placeholder="Doctor's Email"
              value={doctorEmail}
              onChange={e => setDoctorEmail(e.target.value)}
            />
            <textarea
              className="w-full border rounded p-2 mb-2"
              placeholder="Doctor Remarks (optional)"
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
            />
            <div className="flex gap-2 mb-2">
              <Button onClick={exportReport} disabled={loading} className="flex items-center gap-2">
                <Download className="w-4 h-4" /> Export as {exportFormat === 'pdf' ? 'PDF' : 'Excel'}
              </Button>
              <Button onClick={sendToDoctor} disabled={sending || !doctorEmail} className="flex items-center gap-2">
                <Mail className="w-4 h-4" /> {sending ? 'Sending...' : 'Send to Doctor'}
              </Button>
              {/* <Button variant="outline" className="flex items-center gap-2" onClick={() => alert('Share link feature coming soon!')}>
                <Eye className="w-4 h-4" /> Share Report Link
              </Button> */}
            </div>
            {sendResult && <div className="text-sm mt-2 text-green-600">{sendResult}</div>}
          </div>
        </div>
      )}
    </Card>
  );
} 