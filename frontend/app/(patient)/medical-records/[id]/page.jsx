'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * /medical-records/[id] page
 * 
 * Functionality:
 * - Display full record detail (complaint, diagnosis, meds, labs, follow-up)
 * - Download option
 * - Share with another doctor option
 */
export default function MedicalRecordDetailPage() {
  const params = useParams();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecord();
  }, [params.id]);

  const fetchRecord = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/patient/medical-records/${params.id}`);
      setRecord(res.data?.record || null);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
          <Link href="/medical-records" className="block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Records
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link href="/medical-records" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Records
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dr. {record.doctorName}
              </h1>
              <p className="text-gray-600 mt-1">{record.department}</p>
              <p className="text-sm text-gray-600 mt-2">
                {new Date(record.consultationDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Download PDF
            </button>
          </div>
        </div>

        {/* Complaint */}
        {record.complaint && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Chief Complaint</h2>
            <p className="text-gray-700 leading-relaxed">{record.complaint}</p>
          </div>
        )}

        {/* Diagnosis */}
        {record.diagnosis && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Diagnosis</h2>
            <p className="text-gray-700 leading-relaxed">{record.diagnosis}</p>
          </div>
        )}

        {/* Vitals */}
        {record.vitals && Object.keys(record.vitals).length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Vitals</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(record.vitals).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 capitalize">{key}</p>
                  <p className="text-lg font-semibold text-gray-900 mt-1">{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Medications */}
        {record.medications && record.medications.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Medications</h2>
            <div className="space-y-3">
              {record.medications.map((med, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-semibold text-gray-900">{med.name}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {med.dosage} - {med.frequency}
                  </p>
                  {med.duration && (
                    <p className="text-sm text-gray-600">
                      Duration: {med.duration}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lab Tests */}
        {record.labTests && record.labTests.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Lab Tests</h2>
            <div className="space-y-3">
              {record.labTests.map((test, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <p className="font-semibold text-gray-900">{test.name}</p>
                  <p className="text-sm text-gray-600">Result: {test.result}</p>
                  {test.notes && (
                    <p className="text-sm text-gray-600">Notes: {test.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Follow-up */}
        {record.followUp && (
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Follow-up Instructions</h2>
            <p className="text-gray-700 leading-relaxed">{record.followUp}</p>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex gap-3">
          <button className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            Share with Doctor
          </button>
          <button className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
