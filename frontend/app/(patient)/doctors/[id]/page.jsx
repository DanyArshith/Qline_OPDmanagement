'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * /doctors/[id] page
 * 
 * Functionality:
 * - Full doctor profile display
 * - Department and specialization
 * - Working hours and consultation duration
 * - Next available dates
 * - Book appointment CTA
 * - Patient reviews/ratings (optional)
 * 
 * API: GET /api/doctors/{id}
 */
export default function DoctorDetailPage() {
  const params = useParams();
  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDoctorDetail = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/doctors/${params.id}`);
      const payload = res.data?.data ?? res.data?.doctor ?? res.data;
      const doctorData = payload?.data ?? payload;
      const normalized = {
        ...doctorData,
        name: doctorData?.user?.name ?? doctorData?.userId?.name ?? doctorData?.name,
        specialization: doctorData?.specialization ?? doctorData?.department ?? '',
        consultationDurationMinutes: doctorData?.consultationDurationMinutes ?? doctorData?.defaultConsultTime ?? null,
        yearsOfExperience: doctorData?.yearsOfExperience ?? doctorData?.experience ?? null,
      };
      setDoctor(normalized);
      setAvailability(res.data?.nextAvailableDates || []);
      setError('');
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load doctor details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDoctorDetail();
  }, [fetchDoctorDetail]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700">{error || 'Doctor not found'}</p>
          </div>
          <Link href="/doctors" className="block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Doctors
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link href="/doctors" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Doctors
        </Link>

        {/* Doctor Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row gap-8">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <div className="h-32 w-32 bg-gray-200 rounded-lg flex items-center justify-center text-4xl">
                👨‍⚕️
              </div>
            </div>

            {/* Doctor Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Dr. {doctor.name}
                </h1>
                <p className="text-lg text-gray-600 mt-1">
                  {doctor.specialization}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Department</p>
                  <p className="font-semibold text-gray-900">{doctor.department}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-900">
                    {doctor.yearsOfExperience} years
                  </p>
                </div>
              </div>

              {doctor.rating && (
                <div className="flex items-center space-x-2">
                  <span className="text-yellow-500">★★★★★</span>
                  <span className="text-gray-600">
                    {doctor.rating.toFixed(1)} ({doctor.reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Consultation Duration</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {doctor.consultationDurationMinutes} min
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Availability</p>
            <p className="text-2xl font-bold text-gray-900 mt-2">
              {doctor.availableToday ? 'Today' : 'Upcoming'}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Booking Status</p>
            <p className="text-2xl font-bold text-green-600 mt-2">
              Open
            </p>
          </div>
        </div>

        {/* Bio */}
        {doctor.bio && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            <p className="text-gray-600 leading-relaxed">{doctor.bio}</p>
          </div>
        )}

        {/* Working Hours */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Working Hours</h2>
          <div className="space-y-2">
            {doctor.workingHours && Object.entries(doctor.workingHours).map(([day, hours]) => (
              <div key={day} className="flex justify-between">
                <span className="text-gray-600 capitalize">{day}</span>
                <span className="font-medium text-gray-900">
                  {hours.start} - {hours.end}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Available Dates */}
        {availability.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Next Available Slots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {availability.slice(0, 4).map((slot) => (
                <Link
                  key={slot.id}
                  href={`/doctors/${params.id}/book?date=${slot.date}&time=${slot.time}`}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition text-center"
                >
                  <p className="font-medium text-gray-900">
                    {new Date(slot.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">{slot.time}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA Button */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Ready to Book?</h2>
          <Link
            href={`/doctors/${params.id}/book`}
            className="inline-block py-3 px-8 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            Book Appointment
          </Link>
        </div>
      </div>
    </div>
  );
}
