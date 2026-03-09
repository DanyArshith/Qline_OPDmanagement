'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * /appointments/[id] page
 * 
 * Functionality:
 * - Full appointment detail display
 * - Status timeline/history
 * - Doctor information and contact
 * - Cancel button with confirmation
 * - Track queue button if applicable
 * - Reschedule option
 * 
 * API:
 * - GET /api/appointments/{id}
 * - DELETE /api/appointments/{id}/cancel
 */
export default function AppointmentDetailPage() {
  const params = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canceling, setCanceling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [params.id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/api/appointments/${params.id}`);
      const raw = res.data?.data ?? res.data?.appointment ?? res.data;
      const durationMinutes = raw?.durationMinutes ?? (
        raw?.slotStart && raw?.slotEnd
          ? Math.max(0, Math.round((new Date(raw.slotEnd) - new Date(raw.slotStart)) / 60000))
          : null
      );

      setAppointment({
        ...raw,
        id: raw?._id ?? raw?.id,
        doctorName: raw?.doctorId?.name ?? raw?.doctorName,
        doctorId: raw?.doctorId?._id ?? raw?.doctorId,
        department: raw?.doctorId?.department ?? raw?.department,
        appointmentDate: raw?.appointmentDate ?? raw?.slotStart,
        durationMinutes,
      });
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to load appointment');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCanceling(true);
    try {
      await api.delete(`/api/appointments/${params.id}/cancel`);

      setAppointment((prev) => ({
        ...prev,
        status: 'cancelled',
      }));
      setShowCancelConfirm(false);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to cancel appointment');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700">{error || 'Appointment not found'}</p>
          </div>
          <Link href="/appointments" className="block mt-4 text-blue-600 hover:text-blue-700">
            ← Back to Appointments
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'booked':
      case 'waiting':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <Link href="/appointments" className="text-blue-600 hover:text-blue-700 font-medium">
          ← Back to Appointments
        </Link>

        {/* Error Alert */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
              <p className="text-gray-600 mt-1">ID: {appointment.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(appointment.status)}`}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Doctor Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Doctor</h2>
          <div className="flex gap-6">
            <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center text-2xl">
              👨‍⚕️
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Dr. {appointment.doctorName}
              </h3>
              <p className="text-gray-600">{appointment.department}</p>
              <p className="text-sm text-gray-600 mt-2">
                📍 {appointment.location || 'Virtual Consultation'}
              </p>
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Date & Time</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {formatDateTime(appointment.appointmentDate)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Consultation Type</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {appointment.consultationType === 'online' ? 'Virtual' : 'In-Person'}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Duration</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {appointment.durationMinutes} minutes
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-600">Booked On</p>
            <p className="text-lg font-semibold text-gray-900 mt-2">
              {new Date(appointment.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Status Timeline */}
        {appointment.timeline && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Status Timeline</h2>
            <div className="space-y-4">
              {appointment.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 bg-blue-600 rounded-full mt-2"></div>
                    {idx < appointment.timeline.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-200 mt-2"></div>
                    )}
                  </div>
                  <div className="pb-4">
                    <p className="font-semibold text-gray-900">
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(event.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {appointment.status !== 'cancelled' && appointment.status !== 'completed' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/doctors/${appointment.doctorId}/book?reschedule=${appointment.id}`}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
              >
                Reschedule
              </Link>

              {['booked', 'waiting', 'in_progress'].includes(appointment.status) && new Date(appointment.appointmentDate) > new Date() && (
                <Link
                  href={`/queue/${appointment.id}`}
                  className="flex-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-medium"
                >
                  View Queue
                </Link>
              )}

              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex-1 py-2 px-4 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium"
              >
                Cancel Appointment
              </button>
            </div>
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 space-y-4">
              <h2 className="text-xl font-bold text-gray-900">Cancel Appointment?</h2>
              <p className="text-gray-600">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  disabled={canceling}
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {canceling ? 'Canceling...' : 'Cancel Appointment'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
