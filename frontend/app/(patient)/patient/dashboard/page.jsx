'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import api from '@/lib/api';
import { formatDate, formatTime } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [nextAppointment, setNextAppointment] = useState(null);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const socket = useSocket();

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('queue:status', (data) => {
        // Handle queue status update
      });
      socket.on('appointment:updated', (data) => {
        // Refresh appointments on update
        if (data) {
          setNextAppointment(data);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('queue:status');
        socket.off('appointment:updated');
      }
    };
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, notificationsRes] = await Promise.all([
        api.get('/api/appointments/my-appointments', { params: { page: 1, limit: 5 } }).catch(() => ({})),
        api.get('/api/notifications', { params: { limit: 5 } }).catch(() => ({})),
      ]);

      const appointmentsData = appointmentsRes?.data?.data || appointmentsRes?.data || {};
      const notificationsData = notificationsRes?.data?.data || notificationsRes?.data || {};

      if (appointmentsData.appointments && appointmentsData.appointments.length > 0) {
        setNextAppointment(appointmentsData.appointments[0]);
        setUpcomingAppointments(appointmentsData.appointments.slice(0, 3));
      }

      if (notificationsData.notifications) {
        setRecentNotifications(notificationsData.notifications.slice(0, 5));
      }

      setError('');
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-h1 text-text-primary">
          Welcome back, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-body text-text-secondary mt-2">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Card className="bg-error-light border border-error p-4">
          <p className="text-error">{error}</p>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 space-y-2">
          <p className="text-caption text-text-secondary">Upcoming Appointments</p>
          <p className="text-h2 text-text-primary font-bold">{upcomingAppointments.length}</p>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-caption text-text-secondary">Unread Notifications</p>
          <p className="text-h2 text-text-primary font-bold">{recentNotifications.filter(n => !n.isRead).length}</p>
        </Card>
        <Card className="p-6 space-y-2">
          <p className="text-caption text-text-secondary">Your Status</p>
          <p className="text-h2 text-primary font-bold">Active</p>
        </Card>
      </div>

      {/* Next Appointment */}
      {nextAppointment ? (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h2 text-text-primary font-bold">Next Appointment</h2>
            <Badge variant="success">Scheduled</Badge>
          </div>

          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center text-body font-bold">
                {nextAppointment.doctorName?.charAt(0) || 'D'}
              </div>
              <div>
                <p className="text-body font-semibold text-text-primary">
                  Dr. {nextAppointment.doctorName || 'Doctor Name'}
                </p>
                <p className="text-caption text-text-secondary">{nextAppointment.department || 'General'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-bg rounded p-4">
              <div>
                <p className="text-caption text-text-secondary">Date</p>
                <p className="text-body font-semibold text-text-primary">
                  {formatDate(nextAppointment.date || new Date())}
                </p>
              </div>
              <div>
                <p className="text-caption text-text-secondary">Time</p>
                <p className="text-body font-semibold text-text-primary">
                  {formatTime(nextAppointment.time) || 'TBD'}
                </p>
              </div>
            </div>

            <Link href="/appointments" className="inline-block">
              <Button variant="secondary" size="sm">
                View All Appointments
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center space-y-4">
            <p className="text-text-secondary">No appointments scheduled yet</p>
            <Link href="/doctors">
              <Button>Book Your First Appointment</Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Recent Notifications */}
      {recentNotifications.length > 0 && (
        <Card className="p-6 space-y-4">
          <h2 className="text-h2 text-text-primary font-bold">Recent Notifications</h2>
          <div className="space-y-3">
            {recentNotifications.map((notif) => (
              <div key={notif._id} className="p-3 bg-bg rounded border border-border">
                <p className="text-body text-text-primary font-medium">{notif.title}</p>
                <p className="text-caption text-text-secondary mt-1">{notif.message}</p>
              </div>
            ))}
          </div>
          <Link href="/notifications">
            <Button variant="secondary" fullWidth>
              View All Notifications
            </Button>
          </Link>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/doctors">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-2">
              <p className="text-h3 font-bold text-primary">🏥</p>
              <p className="text-body font-semibold text-text-primary">Find Doctors</p>
              <p className="text-caption text-text-secondary">Browse and book with specialists</p>
            </div>
          </Card>
        </Link>
        <Link href="/medical-records">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-2">
              <p className="text-h3 font-bold text-primary">📋</p>
              <p className="text-body font-semibold text-text-primary">Medical Records</p>
              <p className="text-caption text-text-secondary">View your health history</p>
            </div>
          </Card>
        </Link>
        <Link href="/profile">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-2">
              <p className="text-h3 font-bold text-primary">👤</p>
              <p className="text-body font-semibold text-text-primary">Profile</p>
              <p className="text-caption text-text-secondary">Manage your information</p>
            </div>
          </Card>
        </Link>
        <Link href="/notifications">
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="space-y-2">
              <p className="text-h3 font-bold text-primary">🔔</p>
              <p className="text-body font-semibold text-text-primary">Notifications</p>
              <p className="text-caption text-text-secondary">Stay updated</p>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}

