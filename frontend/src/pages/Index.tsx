import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, MapPin, ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import CategoryList from '@/components/events/CategoryList';
import EventFilters from '@/components/events/EventFilters';
import EventCard from '@/components/events/EventCard';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

const Index = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [location, activeFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Note: Removed city filter to show all active events regardless of location
      // Users can filter by location in the dedicated find-events page
      const params = new URLSearchParams({ status: 'active', limit: '50' });
      if (location !== 'Online Events' && location !== 'Lagos, Nigeria') {
        const city = location.split(',')[0].trim();
        if (city && city.trim().length > 0) {
          params.set('city', city);
        }
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (activeFilter === 'today') {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        // Filter will be applied after fetch since we need to check event_dates
      } else if (activeFilter === 'weekend') {
        // Weekend filter logic
      }

      const data = await apiFetch<Event[]>(`/events?${params.toString()}`);

      console.log('Fetched events count:', data?.length || 0);

      let filteredEvents = data;
      
      // Client-side date filtering
      if (activeFilter === 'today') {
        const todayStr = today.toISOString().split('T')[0];
        filteredEvents = filteredEvents.filter(event => 
          event.eventDates?.some(d => d.eventDate === todayStr)
        );
      } else if (activeFilter === 'weekend') {
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + (6 - today.getDay()));
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        
        const satStr = saturday.toISOString().split('T')[0];
        const sunStr = sunday.toISOString().split('T')[0];
        
        filteredEvents = filteredEvents.filter(event => 
          event.eventDates?.some(d => d.eventDate === satStr || d.eventDate === sunStr)
        );
      }
      
      setEvents(filteredEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
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

  return (
    <Layout>
      {/* Hero Image */}
      <div className="container-main py-12">
        <div className="w-full h-[300px] md:h-[400px] rounded-2xl overflow-hidden relative">
          <img
            src="/music.webp"
            alt="Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-primary-foreground relative z-10">
              <h1 className="text-3xl md:text-5xl font-bold mb-4"></h1>
              <p className="text-lg md:text-xl opacity-90"></p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container-main">
        <CategoryList />
        <div className="border-b border-border" />
      </div>

      {/* Location Selector */}
      <div className="container-main py-4">
        <div className="flex items-center gap-2">
          <span className="text-min text-muted-foreground">Browsing events in</span>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-min font-medium text-foreground hover:text-accent transition-colors">
              {location}
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setLocation('Lagos, Nigeria')}>
                <MapPin className="w-4 h-4 mr-2" /> Lagos, Nigeria
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('Abuja, Nigeria')}>
                <MapPin className="w-4 h-4 mr-2" /> Abuja, Nigeria
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('Port Harcourt, Nigeria')}>
                <MapPin className="w-4 h-4 mr-2" /> Port Harcourt, Nigeria
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLocation('Online Events')}>
                <MapPin className="w-4 h-4 mr-2" /> Online Events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="border-b border-border mt-4" />
      </div>

      {/* Filters */}
      <div className="container-main">
        <EventFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      </div>

      {/* Events Section */}
      <div className="container-main py-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[13px] sm:text-xl font-semibold text-foreground">
            Events in {location}
          </h2>
          <button
            onClick={() => navigate('/find-events')}
            className="text-[12.5px] sm:text-min text-accent gap-1 flex items-center cursor-pointer"
          >
            Browse more events
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="event-card animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {events.map((event) => (
              <EventCard
                key={event.id}
                id={event.id}
                title={event.title}
                imageUrl={getEventImage(event)}
                date={getEventDate(event)}
                price={Number(event.price)}
                isFree={event.isFree}
                isPromoted={event.isPromoted}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-min">No events found in this location.</p>
            <Button
              onClick={() => navigate('/create-event')}
              style={{ backgroundColor: '#D9492E' }}
              className="mt-4 text-white hover:opacity-90 transition-opacity"
            >
              Create an Event
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Index;