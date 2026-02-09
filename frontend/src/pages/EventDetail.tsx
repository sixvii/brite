import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Share2,
  Heart,
  MapPin,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Flag,
  ExternalLink,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import UserAvatar from '@/components/ui/UserAvatar';
import { Button } from '@/components/ui/button';
import { apiFetch, apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface EventData {
  id: string;
  title: string;
  description: string;
  country: string;
  city: string;
  venueName: string;
  venueAddress: string;
  price: number;
  isFree: boolean;
  isOnline: boolean;
  refundPolicy: string | null;
  eventHours: string | null;
  organizerId: string;
  organizer: {
    id: string;
    name: string;
    email?: string;
    avatarUrl: string | null;
  };
  eventImages: { id: string; imageUrl: string; displayOrder: number }[];
  eventDates: { id: string; eventDate: string; startTime: string; endTime: string | null; isSoldOut: boolean }[];
  eventPromoters: { id: string; name: string }[];
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);

  useEffect(() => {
    if (id) {
      fetchEvent();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const data = await apiFetch<EventData>(`/events/${id}`);
      setEvent(data);

      const engagement = await apiFetch<{ liked: boolean; following: boolean; followerCount: number; organizerEventCount: number }>(
        `/events/${id}/engagement`
      );
      setIsLiked(engagement.liked);
      setIsFollowing(engagement.following);
      setFollowerCount(engagement.followerCount);
      setEventCount(engagement.organizerEventCount);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    try {
      const result = await apiJson<{ liked: boolean }>(`/events/${id}/like`, 'POST');
      setIsLiked(result.liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleFollow = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!event) return;

    try {
      const result = await apiJson<{ following: boolean }>(`/users/${event.organizerId}/follow`, 'POST');
      setIsFollowing(result.following);
      setFollowerCount(prev => prev + (result.following ? 1 : -1));
    } catch (error) {
      console.error('Error toggling follow:', error);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event?.title,
        url: window.location.href,
      });
    } catch (error) {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied!',
        description: 'Event link copied to clipboard.',
      });
    }
  };

  const nextImage = () => {
    if (event?.eventImages) {
      setCurrentImageIndex((prev) => 
        prev === event.eventImages.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (event?.eventImages) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? event.eventImages.length - 1 : prev - 1
      );
    }
  };

  const getDateDisplay = () => {
    if (!event?.eventDates || event.eventDates.length === 0) return 'TBA';
    if (event.eventDates.length === 1) {
      const date = event.eventDates[0];
      return format(new Date(date.eventDate), 'EEEE, MMMM d, yyyy');
    }
    return 'Multiple dates';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-8 animate-pulse">
          <div className="h-[400px] bg-muted rounded-2xl mb-8" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Event not found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </Layout>
    );
  }

  const organizerId =
    typeof event.organizerId === 'string'
      ? event.organizerId
      : event.organizerId && typeof event.organizerId === 'object'
        ? (event.organizerId as { id?: string; _id?: string }).id || (event.organizerId as { id?: string; _id?: string })._id
        : undefined;
  const isOwnEvent = !!user?.id && !!organizerId && user.id === organizerId;
  const organizerName = (event.organizer?.name || (isOwnEvent ? user?.name : '') || '').trim() || 'Unknown';
  const organizerAvatarUrl = event.organizer?.avatarUrl || (isOwnEvent ? user?.avatarUrl : null);

  const images = event.eventImages?.sort((a, b) => a.displayOrder - b.displayOrder) || [];
  const currentImage = images[currentImageIndex]?.imageUrl || '/placeholder.svg';

  return (
    <Layout>
      <div className="container-main py-8">
        {/* Event Image */}
        <div className="relative w-full h-[220px] md:h-[370px] rounded-2xl overflow-hidden mb-6">
          <AnimatePresence mode="wait">
            <motion.img
              key={currentImageIndex}
              src={currentImage}
              alt={event.title}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full h-full object-cover"
            />
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center hover:bg-card transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Share and Like buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={handleShare}
            className="rounded-full border-border"
          >
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleLike}
            className={`rounded-full border-border ${isLiked ? 'text-destructive' : ''}`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title */}
            <h1 className="text-[25px] font-bold text-foreground">
              {event.title}
            </h1>

            {/* Organizer */}
            <div className="flex items-center gap-3">
              <UserAvatar
                name={organizerName}
                avatarUrl={organizerAvatarUrl}
              />
              <div className="flex-1">
                <p className="text-min text-muted-foreground">
                  By <span className="text-foreground font-medium">
                    {organizerName}
                  </span>
                </p>
              </div>
              <Button
                variant="outline"
                onClick={handleFollow}
                className="border-border text-foreground hover:bg-[#D9492E] hover:text-white"
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </div>

            {/* Location */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-foreground mt-0.5" />
              <span className="text-min text-foreground">
                {event.venueName} • {event.city}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-foreground" />
              <span className="text-min text-foreground">
                {getDateDisplay()}
              </span>
            </div>

            {/* Price and Check Availability */}
            <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
              <div>
                <p className="text-xl font-bold text-foreground">
                  {event.isFree ? 'Free' : `₦${Number(event.price).toLocaleString()}`}
                </p>
              </div>
              {user?.id === event.organizerId ? (
                <div className="flex gap-3">
                  <Button
                    onClick={() => navigate(`/edit-event/${id}`)}
                    variant="outline"
                    className="text-foreground"
                  >
                    Edit Event
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => navigate(`/event/${id}/checkout`)}
                  style={{ backgroundColor: '#D9492E' }}
                  className="text-white hover:opacity-90 transition-opacity"
                >
                  Check Availability
                </Button>
              )}
            </div>

            {/* Overview */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Overview</h2>
              <div className={`text-min text-muted-foreground whitespace-pre-wrap ${!showFullDescription && 'line-clamp-8'}`}>
                {event.description}
              </div>
              {event.description && event.description.split('\n').length > 8 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-accent text-min font-medium mt-2 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Good to Know */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Good to Know</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="text-min font-medium text-foreground mb-2">Highlights</h3>
                  <div className="space-y-2 text-min text-muted-foreground">
                    {event.eventHours && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {event.eventHours}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      {event.isOnline ? 'Online' : 'In Person'}
                    </div>
                  </div>
                </div>
                <div className="p-4 border border-border rounded-xl">
                  <h3 className="text-min font-medium text-foreground mb-2">Refund Policy</h3>
                  <p className="text-min text-muted-foreground">
                    {event.refundPolicy || 'Contact organizer for refund policy.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Location</h2>
              <p className="font-medium text-foreground">{event.venueName}</p>
              <p className="text-min text-muted-foreground mb-4">{event.venueAddress}</p>
              
              <div className={`relative h-[200px] rounded-xl overflow-hidden ${!showMap ? 'map-blur' : ''}`}>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(event.venueAddress)}&output=embed`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                />
                {!showMap && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Button
                      variant="outline"
                      onClick={() => setShowMap(true)}
                      className="border-border bg-card hover:bg-[#D9492E] hover:text-white"
                    >
                      Show Map
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Organized By */}
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Organized by</h2>
              <div className="p-4 border border-border rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      name={event.organizer?.name || 'Organizer'}
                      avatarUrl={event.organizer?.avatarUrl}
                      size="lg"
                    />
                    <div>
                      <p className="font-medium text-foreground">{event.organizer?.name}</p>
                      <div className="flex items-center gap-4 text-min text-muted-foreground mt-1">
                        <span>{followerCount} Followers</span>
                        <span className="w-px h-4 bg-border" />
                        <span>{eventCount} Events</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleFollow}
                    className="border-border text-foreground hover:bg-[#D9492E] hover:text-white"
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Promoters */}
            {event.eventPromoters && event.eventPromoters.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Event Sponsors & Promoters</h2>
                <div className="flex flex-wrap gap-3">
                  {event.eventPromoters.map((promoter) => (
                    <span
                      key={promoter.id}
                      className="px-4 py-2 bg-secondary rounded-full text-min text-foreground"
                    >
                      {promoter.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            <button className="flex items-center gap-2 text-accent text-min hover:underline">
              <Flag className="w-4 h-4" />
              Report this event
            </button>
          </div>

          {/* Sidebar - Sticky Ticket Card (Desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 p-6 bg-card border border-border rounded-xl">
              <p className="text-2xl font-bold text-foreground mb-4">
                {event.isFree ? 'Free' : `₦${Number(event.price).toLocaleString()}`}
              </p>
              <Button
                onClick={() => navigate(`/event/${id}/checkout`)}
                style={{ backgroundColor: '#D9492E' }}
                className="w-full text-white hover:opacity-90 transition-opacity"
              >
                Check Availability
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventDetail;