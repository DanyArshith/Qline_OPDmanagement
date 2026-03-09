'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

/**
 * /notifications page
 * 
 * Functionality:
 * - Paginated notification center
 * - Mark as read functionality
 * - Mark all as read
 * - Delete functionality
 * - Filter by type (optional)
 */
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const r = await api.get('/api/notifications', { params: { page, limit: 20, ...(filterType && { type: filterType }) } });
      const data = r.data;
      setNotifications(data.notifications ?? []);
      setTotalPages(data.pagination?.pages ?? 1);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filterType, page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      setError('Failed to update notification');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      setError('Failed to update notifications');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      setError('Failed to delete notification');
    }
  };


  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment_booked':
        return '📅';
      case 'appointment_reminder':
        return '⏰';
      case 'token_called':
        return '📢';
      case 'doctor_delayed':
        return '⏳';
      case 'system_alert':
        return 'ℹ️';
      default:
        return '🔔';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-2">
              {notifications.filter((n) => !n.read).length} unread
            </p>
          </div>
          {notifications.filter((n) => !n.read).length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Mark All as Read
            </button>
          )}
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="appointment_booked">Appointment Booked</option>
            <option value="appointment_reminder">Appointment Reminder</option>
            <option value="token_called">Token Called</option>
            <option value="doctor_delayed">Doctor Delayed</option>
            <option value="system_alert">System Alert</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Notifications List */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-600">No notifications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`rounded-lg border p-4 flex gap-4 transition ${notif.read
                    ? 'bg-white border-gray-200'
                    : 'bg-blue-50 border-blue-200'
                  }`}
              >
                <div className="text-2xl pt-1">
                  {getNotificationIcon(notif.type)}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {notif.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {notif.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  {!notif.read && (
                    <button
                      onClick={() => handleMarkAsRead(notif._id)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notif._id)}
                    className="text-red-600 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Previous
            </button>
            <span className="py-2 px-4 text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
