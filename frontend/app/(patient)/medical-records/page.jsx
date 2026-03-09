'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * /medical-records page
 * 
 * Functionality:
 * - List of past consultation records
 * - Filter by doctor or date range
 * - Pagination
 * - Search by keywords
 */
export default function MedicalRecordsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchRecords();
    fetchDoctors();
  }, [filterDoctor, filterMonth]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDoctor) params.append('doctorId', filterDoctor);
      if (filterMonth) params.append('month', filterMonth);

      const res = await api.get('/api/patient/medical-records', {
        params: Object.fromEntries(params.entries()),
      });
      setRecords(res.data?.records || []);
    } catch (err) {
      setError(err?.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/api/patient/doctors');
      setDoctors(res.data?.doctors || []);
    } catch (err) {
      console.error('Failed to load doctors');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medical Records</h1>
          <p className="text-gray-600 mt-2">
            View your past consultation records and medical history
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doctor" className="block text-sm font-medium text-gray-700">
                Doctor
              </label>
              <select
                id="doctor"
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Doctors</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                Month
              </label>
              <input
                id="month"
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Records List */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No medical records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <Link
                key={record.id}
                href={`/medical-records/${record.id}`}
                className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dr. {record.doctorName}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {record.department}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Complaint: {record.complaint?.substring(0, 100)}...
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatDate(record.consultationDate)}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                      {record.medications?.length || 0} medications
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
