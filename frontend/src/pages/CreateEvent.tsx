import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Trash2, Upload, X, Loader2 } from 'lucide-react';
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
import { apiForm } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface EventDate {
  date: Date;
  startTime: string;
  endTime: string;
}

interface PaymentMethod {
  bankName: string;
  accountName: string;
  accountNumber: string;
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

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string[]>([]);

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
  const [promoters, setPromoters] = useState<string[]>(['']);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { bankName: '', accountName: '', accountNumber: '' },
  ]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages([...images, ...newFiles]);

      // Create previews
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setImagePreview(imagePreview.filter((_, i) => i !== index));
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

  const addPromoter = () => {
    setPromoters([...promoters, '']);
  };

  const updatePromoter = (index: number, value: string) => {
    const updated = [...promoters];
    updated[index] = value;
    setPromoters(updated);
  };

  const removePromoter = (index: number) => {
    setPromoters(promoters.filter((_, i) => i !== index));
  };

  const addPaymentMethod = () => {
    setPaymentMethods([...paymentMethods, { bankName: '', accountName: '', accountNumber: '' }]);
  };

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: string) => {
    const updated = [...paymentMethods];
    updated[index][field] = value;
    setPaymentMethods(updated);
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title || !category || !city || eventDates.length === 0) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields: Title, Category, City, and at least one Event Date.',
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

    if (images.length === 0) {
      toast({
        title: 'Missing Image',
        description: 'Please upload at least one event image.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

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
      formData.append('status', 'active');

      const normalizedDates = eventDates.map(date => ({
        eventDate: format(date.date, 'yyyy-MM-dd'),
        startTime: date.startTime,
        endTime: date.endTime || ''
      }));
      formData.append('eventDates', JSON.stringify(normalizedDates));

      const normalizedPromoters = promoters.filter(p => p.trim()).map(p => p.trim());
      formData.append('promoters', JSON.stringify(normalizedPromoters));

      const normalizedPaymentMethods = paymentMethods
        .filter(m => m.bankName && m.accountName && m.accountNumber)
        .map(m => ({
          bankName: m.bankName,
          accountName: m.accountName,
          accountNumber: m.accountNumber
        }));
      formData.append('paymentMethods', JSON.stringify(normalizedPaymentMethods));

      images.forEach((file) => {
        formData.append('images', file);
      });

      const eventData = await apiForm<{ id: string }>(`/events`, 'POST', formData);
      console.log('Event created successfully:', {
        eventId: eventData?.id,
        title,
        city: isOnline ? 'Online' : city,
        isOnline,
        category,
        status: 'active',
        eventDates: eventDates.length,
      });

      toast({
        title: 'Event created!',
        description: 'Your event has been created successfully.',
      });

      navigate(`/event/${eventData?.id}`);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Error',
        description: 'Failed to create event. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground mb-8">Create Event</h1>

          <form onSubmit={handleSubmit} className="space-y-8 create-event-form">
            {/* Images */}
            <div className="p-6 border border-border rounded-xl bg-card">
              <Label className="text-min font-medium">Event Images</Label>
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                {imagePreview.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img src={preview} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <label className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
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
                  <SelectContent className="create-event-select">
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
                  <Switch checked={isOnline} onCheckedChange={setIsOnline} />
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

            {/* Date & Time */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <Label className="text-min font-medium">Event Dates *</Label>
              
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
                    disabled={!selectedDate || !startTime}
                    className="w-full"
                  >
                    Add Date
                  </Button>
                </div>
              </div>

              {eventDates.length > 0 && (
                <div className="space-y-2 mt-4">
                  {eventDates.map((ed, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                    >
                      <span className="text-min">
                        {format(ed.date, 'EEE, MMM d, yyyy')} at {ed.startTime}
                        {ed.endTime && ` - ${ed.endTime}`}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEventDate(index)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Label htmlFor="hours" className="text-min">Event Duration</Label>
                <Input
                  id="hours"
                  value={eventHours}
                  onChange={(e) => setEventHours(e.target.value)}
                  className="form-input mt-1"
                  placeholder="e.g., 3 hours"
                />
              </div>
            </div>

            {/* Pricing */}
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

              <div>
                <Label htmlFor="refund" className="text-min">Refund Policy</Label>
                <Textarea
                  id="refund"
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  className="form-input mt-1"
                  placeholder="Describe your refund policy..."
                />
              </div>
            </div>

            {/* Payment Methods (if not free) */}
            {!isFree && (
              <div className="p-6 border border-border rounded-xl bg-card space-y-4">
                <Label className="text-min font-medium">Payment Methods</Label>
                
                {paymentMethods.map((method, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-min font-medium">Account {index + 1}</span>
                      {paymentMethods.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePaymentMethod(index)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={method.bankName}
                      onChange={(e) => updatePaymentMethod(index, 'bankName', e.target.value)}
                      className="form-input"
                      placeholder="Bank Name"
                    />
                    <Input
                      value={method.accountName}
                      onChange={(e) => updatePaymentMethod(index, 'accountName', e.target.value)}
                      className="form-input"
                      placeholder="Account Name"
                    />
                    <Input
                      value={method.accountNumber}
                      onChange={(e) => updatePaymentMethod(index, 'accountNumber', e.target.value)}
                      className="form-input"
                      placeholder="Account Number"
                    />
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addPaymentMethod}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Payment Method
                </Button>
              </div>
            )}

            {/* Promoters */}
            <div className="p-6 border border-border rounded-xl bg-card space-y-4">
              <Label className="text-min font-medium">Promoters / Sponsors</Label>
              
              {promoters.map((promoter, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={promoter}
                    onChange={(e) => updatePromoter(index, e.target.value)}
                    className="form-input flex-1"
                    placeholder="Promoter name"
                  />
                  {promoters.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removePromoter(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addPromoter}
                className="w-full gap-2 hover:bg-[#DD5C45]"
              >
                <Plus className="w-4 h-4" />
                Add Promoter
              </Button>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: '#D9492E' }}
              className="w-full py-6 text-base text-white hover:opacity-90 transition-opacity"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Create Event'
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default CreateEvent;