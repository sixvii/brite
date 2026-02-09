import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Trash2, Upload, X, Loader2, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { apiFetch, apiForm } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventDate {
  id?: string;
  date: Date;
  startTime: string;
  endTime: string;
}

interface PaymentMethod {
  id?: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface EventData {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  category: string;
  country: string;
  city: string;
  venueName: string;
  venueAddress: string;
  price: number;
  isFree: boolean;
  isOnline: boolean;
  eventHours: string | null;
  refundPolicy: string | null;
  status: string;
  eventImages: { id: string; imageUrl: string; displayOrder: number }[];
  eventDates: { id: string; eventDate: string; startTime: string; endTime: string | null }[];
}

const categories = [
  'Music',
  'Nightlife',
  'Performing & Visual Arts',
  'Holidays',
  'Dating',
  'Hobbies',
  'Business',
  'Food & Drinks',
];

const EditEvent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [country, setCountry] = useState('Nigeria');
  const [city, setCity] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [isFree, setIsFree] = useState(false);
  const [price, setPrice] = useState('');
  const [eventHours, setEventHours] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [eventDates, setEventDates] = useState<EventDate[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    } else if (id) {
      fetchEvent();
    }
  }, [id, user, authLoading]);

  const fetchEvent = async () => {
    try {
      const data = await apiFetch<EventData>(`/events/${id}`);

      // Check if user is the organizer
      if (data.organizerId !== user?.id) {
        toast({
          title: 'Access Denied',
          description: 'You can only edit your own events.',
          variant: 'destructive',
        });
        navigate('/dashboard');
        return;
      }

      setEvent(data);
      setTitle(data.title);
      setDescription(data.description || '');
      setCategory(data.category);
      setCountry(data.country);
      setCity(data.city === 'Online' ? '' : data.city);
      setVenueName(data.venueName === 'Online Event' ? '' : data.venueName);
      setVenueAddress(data.venueAddress === 'N/A' ? '' : data.venueAddress);
      setIsOnline(data.isOnline);
      setIsFree(data.isFree);
      setPrice(data.price?.toString() || '');
      setEventHours(data.eventHours || '');
      setRefundPolicy(data.refundPolicy || '');
      setExistingImages(data.eventImages || []);

      // Parse existing dates
      const parsedDates = (data.eventDates || []).map((d: any) => ({
        id: d.id,
        date: new Date(`${d.eventDate}T00:00:00`),
        startTime: d.startTime,
        endTime: d.endTime || '',
      }));
      setEventDates(parsedDates);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event details.',
        variant: 'destructive',
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewImages([...newImages, ...files]);

      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewImagePreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeNewImage = (index: number) => {
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewImagePreviews(newImagePreviews.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: string) => {
    setExistingImages(existingImages.filter(img => img.id !== imageId));
    setRemovedImageIds(prev => [...prev, imageId]);
  };

  const addEventDate = () => {
    if (selectedDate && startTime) {
      setEventDates([...eventDates, { date: selectedDate, startTime, endTime }]);
      setSelectedDate(undefined);
      setStartTime('');
      setEndTime('');
    }
  };

  const removeEventDate = (index: number) => {
    setEventDates(eventDates.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !category || !city || eventDates.length === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    if (!isOnline && !venueName) {
      toast({
        title: 'Missing Venue',
        description: 'For in-person events, please enter a venue name.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('country', country);
      formData.append('city', isOnline ? 'Online' : city);
      formData.append('venueName', isOnline ? 'Online Event' : venueName);
      formData.append('venueAddress', isOnline ? 'N/A' : venueAddress);
      formData.append('isOnline', String(isOnline));
      formData.append('isFree', String(isFree));
      formData.append('price', String(isFree ? 0 : parseFloat(price) || 0));
      formData.append('eventHours', eventHours);
      formData.append('refundPolicy', refundPolicy);

      const normalizedDates = eventDates.map(date => ({
        id: date.id,
        eventDate: format(date.date, 'yyyy-MM-dd'),
        startTime: date.startTime,
        endTime: date.endTime || ''
      }));
      formData.append('eventDates', JSON.stringify(normalizedDates));

      if (removedImageIds.length > 0) {
        formData.append('removeImageIds', JSON.stringify(removedImageIds));
      }

      newImages.forEach((file) => {
        formData.append('images', file);
      });

      await apiForm(`/events/${id}`, 'PUT', formData);

      toast({
        title: 'Event updated!',
        description: 'Your event has been updated successfully.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to update event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEvent = async () => {
    try {
      const formData = new FormData();
      formData.append('status', 'cancelled');
      await apiForm(`/events/${id}`, 'PUT', formData);

      toast({
        title: 'Event cancelled',
        description: 'Your event has been cancelled successfully.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error cancelling event:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel event. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Event not found</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-foreground">Edit Event</h1>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <X className="w-4 h-4" />
              Cancel Event
            </Button>
          </div>

          <form onSubmit={handleUpdate} className="space-y-8">
            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="p-6 border border-border rounded-xl bg-card">
                <Label className="text-min font-medium">Event Images</Label>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {newImagePreviews.length > 0 && (
              <div className="p-6 border border-border rounded-xl bg-card">
                <Label className="text-min font-medium">New Images</Label>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {newImagePreviews.map((preview, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Images */}
            <div className="p-6 border border-border rounded-xl bg-card">
              <Label className="text-min font-medium">Add More Images</Label>
              <label className="mt-4 aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                <span className="text-min text-muted-foreground">Add Image</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Basic Info */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <div>
                <Label htmlFor="title" className="text-min">Event Name *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="form-input mt-1"
                  placeholder="Enter event name"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-min">Category *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description" className="text-min">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="form-input mt-1 min-h-[150px]"
                  placeholder="Describe your event..."
                />
              </div>
            </div>

            {/* Location */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-min font-semibold">Event Type *</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isOnline ? '🌐 This is an Online Event' : '📍 This is an In-Person Event'}
                    </p>
                  </div>
                  <Switch checked={isOnline} onCheckedChange={setIsOnline} disabled />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="country" className="text-min">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="form-input mt-1"
                    disabled={isOnline}
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-min">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="form-input mt-1"
                    placeholder="Enter city"
                    disabled={isOnline}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="venue" className="text-min">Venue Name *</Label>
                <Input
                  id="venue"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  className="form-input mt-1"
                  placeholder="Enter venue name"
                  disabled={isOnline}
                />
              </div>

              <div>
                <Label htmlFor="address" className="text-min">Full Address</Label>
                <Input
                  id="address"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  className="form-input mt-1"
                  placeholder="Enter full address"
                  disabled={isOnline}
                />
              </div>
            </div>

            {/* Price */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-min">Free Event</Label>
                <Switch checked={isFree} onCheckedChange={setIsFree} />
              </div>

              {!isFree && (
                <div>
                  <Label htmlFor="price" className="text-min">Ticket Price (₦)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="form-input mt-1"
                    placeholder="Enter price"
                  />
                </div>
              )}
            </div>

            {/* Event Dates */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <Label className="text-min font-medium">Event Dates *</Label>
              
              {eventDates.length > 0 && (
                <div className="space-y-2">
                  {eventDates.map((eventDate, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="text-min font-medium">
                          {format(eventDate.date, 'MMM d, yyyy')} • {eventDate.startTime}
                          {eventDate.endTime && ` - ${eventDate.endTime}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEventDate(index)}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    className="rounded-md border pointer-events-auto"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-min">Start Time</Label>
                    <Input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="form-input mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-min">End Time (Optional)</Label>
                    <Input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="form-input mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={addEventDate}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Date
                  </Button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <div>
                <Label htmlFor="hours" className="text-min">Event Duration (hours)</Label>
                <Input
                  id="hours"
                  value={eventHours}
                  onChange={(e) => setEventHours(e.target.value)}
                  className="form-input mt-1"
                  placeholder="e.g., 2"
                />
              </div>

              <div>
                <Label htmlFor="refund" className="text-min">Refund Policy</Label>
                <Textarea
                  id="refund"
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  className="form-input mt-1 min-h-[100px]"
                  placeholder="Enter refund policy..."
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={saving}
                style={{ backgroundColor: '#D9492E' }}
                className="flex-1 text-white hover:opacity-90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Event'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Cancel Event Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Cancel Event?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this event? This action cannot be undone. All attendees will be notified.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
            <p className="text-min text-destructive">
              Cancelling will mark this event as cancelled and notify all ticket holders.
            </p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel>Keep Event</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelEvent}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, Cancel Event
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
};

export default EditEvent;
