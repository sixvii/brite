import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/events/EventCard';
import CategoryList from '@/components/events/CategoryList';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface Event {
  id: string;
  title: string;
  city: string;
  price: number;
  isFree: boolean;
  isOnline: boolean;
  isPromoted: boolean;
  eventImages: { imageUrl: string }[];
  eventDates: { eventDate: string; startTime: string }[];
}

const FindEvents = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [onlineEvents, setOnlineEvents] = useState<Event[]>([]);
  const [inPersonEvents, setInPersonEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const location = searchParams.get('location') || 'Lagos, Nigeria';
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  useEffect(() => {
    fetchEvents();
  }, [location, category, search]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      console.log('Fetching events with filters:', { location, category, search });

      const city = location.split(',')[0].trim();
      const params = new URLSearchParams({ status: 'active', limit: '50' });
      if (category) params.set('category', category);
      if (search) params.set('search', search);

      const onlineParams = new URLSearchParams(params);
      onlineParams.set('isOnline', 'true');

      const inPersonParams = new URLSearchParams(params);
      inPersonParams.set('isOnline', 'false');
      if (location !== 'Online Events' && location !== 'Lagos, Nigeria' && city) {
        inPersonParams.set('city', city);
      }

      const [onlineData, inPersonData] = await Promise.all([
        apiFetch<Event[]>(`/events?${onlineParams.toString()}`),
        apiFetch<Event[]>(`/events?${inPersonParams.toString()}`)
      ]);

      console.log('Setting online events:', onlineData.length);
      console.log('Setting in-person events:', inPersonData.length);

      setOnlineEvents(onlineData);
      setInPersonEvents(inPersonData);
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
      {/* Breadcrumb */}
      <div className="bg-[#F7F7F8] ">
        <div className="container-main py-5">
          <p className="text-min text-muted-foreground">
            <span className="text-[#3D64FF] underline underline-offset-2 decoration-[#3D64FF]">Home</span>
            {' / '}
            <span className="text-[#3D64FF] underline underline-offset-2 decoration-[#3D64FF]">Nigeria</span>
            {' / Events in '}{location}
          </p>
        </div>
      </div>

      {/* Hero */}
      <div className="container-main py-6">
        <div className="w-full h-[260px] md:h-[420px] rounded-2xl overflow-hidden relative flex items-stretch">
          <img
            src="/find.webp"
            alt="Find Events Hero"
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Overlay: dark on left, fade to transparent right */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          <div className="relative z-10 flex flex-col justify-center h-full pl-8 md:pl-16 max-w-[600px]">
            <h1 className="text-[16px] md:text-2xl font-bold text-white mb-4 leading-tight">
              Best events in <br />
              <span className="text-xl md:text-3xl font-extrabold">{location.split(',')[0]}</span>
            </h1>
            <p className="text-[12.5px] md:text-[14.5px] text-white/90 mb-8 max-w-xl">
              Looking for something to do in {location.split(',')[0]}? Whether you're a local, new in town or just cruising through we've got loads of great tips and events. You can explore by location, what's popular, our top picks, free stuff... you got this. Ready?
            </p>
            <div>
              <Button className="bg-[#3659E3] text-white text-[14.5px] px-5 py-3 rounded-full flex items-center gap-2 shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 17.207A9.043 9.043 0 0021 12.75c0-5.022-4.478-9-10-9S1 7.728 1 12.75c0 5.022 4.478 9 10 9 2.042 0 3.94-.613 5.362-1.707M12 15.75v-3.75m0 0V9.75m0 2.25h2.25m-2.25 0H9.75" />
                </svg>
                {location.split(',')[0]}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 ml-2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="container-main">
        <CategoryList />
      </div>

      {/* Online Events */}
      <section className="container-main py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">Online Events</h2>
          <button
            onClick={() => navigate('/find-events?location=Online Events')}
            className="text-[12.5px] sm:text-min text-accent gap-1 flex items-center cursor-pointer"
          >
            Browse more events
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="event-card animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : onlineEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {onlineEvents.map((event) => (
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
          <p className="text-center py-8 text-muted-foreground text-min">
            No online events found.
          </p>
        )}
      </section>

      {/* In Person Events */}
      <section className="container-main py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">In Person Events</h2>
          <button
            onClick={() => navigate(`/find-events?location=${encodeURIComponent(location)}`)}
            className="text-[12.5px] sm:text-min text-accent gap-1 flex items-center cursor-pointer"
          >
            Browse more events
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="event-card animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : inPersonEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {inPersonEvents.map((event) => (
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
          <p className="text-center py-8 text-muted-foreground text-min">
            No in-person events found in this location.
          </p>
        )}
      </section>
    </Layout>
  );
};

export default FindEvents;
