import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, Calendar, Ticket, Plus, Edit2, LogOut, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch, apiForm } from '@/lib/api';
import EventCard from '@/components/events/EventCard';
import UserAvatar from '@/components/ui/UserAvatar';

interface Event {
  id: string;
  title: string;
  city: string;
  price: number;
  isFree: boolean;
  isPromoted: boolean;
  eventImages: { imageUrl: string }[];
  eventDates: { eventDate: string; startTime: string }[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, loading: authLoading, refreshProfile } = useAuth();
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({ created: 0, attending: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchDashboardData();
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const dashboard = await apiFetch<{ createdEvents: Event[]; attendingEvents: Event[]; stats: { created: number; attending: number; revenue: number } }>(
        '/dashboard'
      );

      setCreatedEvents(dashboard.createdEvents || []);
      setAttendingEvents(dashboard.attendingEvents || []);
      setStats(dashboard.stats || { created: 0, attending: 0, revenue: 0 });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarClick = () => {
    if (avatarUploading) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    try {
      await apiForm('/users/me/avatar', 'POST', formData);
      await refreshProfile();
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getEventDate = (event: Event) => {
    if (event.eventDates && event.eventDates.length > 0) {
      const dateStr = event.eventDates[0].eventDate;
      const timeStr = event.eventDates[0].startTime;
      return new Date(`${dateStr}T${timeStr}`);
    }
    return new Date();
  };

  const getEventImage = (event: Event) => {
    if (event.eventImages && event.eventImages.length > 0) {
      return event.eventImages[0].imageUrl;
    }
    return '/placeholder.svg';
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Profile Header */}
        <div className="mb-8 p-8 bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl border border-border">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24">
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label="Upload profile picture"
                >
                  <UserAvatar
                    name={profile?.name || profile?.email || ''}
                    avatarUrl={profile?.avatarUrl}
                    size="lg"
                  />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{profile?.name}</h1>
                <p className="text-muted-foreground">{profile?.email}</p>
                <p className="text-min text-muted-foreground mt-1">
                  {profile?.accountType === 'personal' ? 'Personal Account' : 'Business Account'}
                </p>
              </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <Button
                onClick={() => navigate('/create-event')}
                style={{ backgroundColor: '#DA5A43' }}
                className="flex-1 md:flex-initial gap-2 text-white hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Button>
              <Button
                onClick={handleSignOut}
                style={{ backgroundColor: '#DA5A43' }}
                className="flex-1 md:flex-initial gap-2 text-white hover:opacity-90 transition-opacity"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Created Events</p>
                <p className="text-3xl font-bold text-foreground">{stats.created}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8E8E8' }}>
                <Calendar className="w-6 h-6" style={{ color: '#000000' }} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Events Attending</p>
                <p className="text-3xl font-bold text-foreground">{stats.attending}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Ticket className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-foreground">₦{stats.revenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#E8E8E8' }}>
                <BarChart3 className="w-6 h-6" style={{ color: '#000000' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Created Events */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Created Events</h2>
              <p className="text-muted-foreground">Events you've organized</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : createdEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {createdEvents.map((event) => (
                  <div key={event.id} className="relative group">
                    <EventCard
                      id={event.id}
                      title={event.title}
                      imageUrl={getEventImage(event)}
                      date={getEventDate(event)}
                      price={event.price}
                      isFree={event.isFree}
                      isPromoted={event.isPromoted}
                    />
                    <button
                      onClick={() => navigate(`/edit-event/${event.id}`)}
                      className="absolute top-4 right-4 p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity text-white"
                      style={{ backgroundColor: '#DA5A43' }}
                    >
                      <Edit2 className="w-4 h-4 text-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-xl border border-border">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-4">No events created yet</p>
                <Button
                  onClick={() => navigate('/create-event')}
                  style={{ backgroundColor: '#DA5A43' }}
                  className="gap-2 text-white hover:opacity-90 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Event
                </Button>
              </div>
            )}
          </div>

          {/* Attending Events Sidebar */}
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Attending</h2>
              <p className="text-muted-foreground">Events you have tickets for</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : attendingEvents.length > 0 ? (
              <div className="space-y-4">
                {attendingEvents.slice(0, 5).map((event) => (
                  <button
                    key={event.id}
                    onClick={() => navigate(`/event/${event.id}`)}
                    className="w-full text-left p-4 border border-border rounded-lg hover:opacity-90 transition-opacity group text-white"
                    style={{ backgroundColor: '#DA5A43' }}
                  >
                    <h3 className="font-semibold text-white/95 transition-colors line-clamp-2 text-sm">
                      {event.title}
                    </h3>
                    <p className="text-min text-white/80 mt-1">{event.city}</p>
                    <p className="text-min font-medium text-white/95 mt-2">
                      {event.isFree ? 'Free' : `₦${event.price.toLocaleString()}`}
                    </p>
                  </button>
                ))}
                {attendingEvents.length > 5 && (
                  <Button
                    onClick={() => navigate('/my-tickets')}
                    style={{ backgroundColor: '#DA5A43' }}
                    className="w-full text-white hover:opacity-90 transition-opacity"
                  >
                    View All Tickets
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-lg border border-border">
                <Ticket className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm mb-3">No events yet</p>
                <Button
                  onClick={() => navigate('/find-events')}
                  size="sm"
                  style={{ backgroundColor: '#DA5A43' }}
                  className="w-full text-white hover:opacity-90 transition-opacity"
                >
                  Find Events
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
