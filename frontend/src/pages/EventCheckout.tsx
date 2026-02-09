import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Upload, Plus, Minus, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { apiFetch, apiForm } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface EventDate {
  id: string;
  eventDate: string;
  startTime: string;
  isSoldOut: boolean;
}

interface PaymentMethod {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
}

interface EventData {
  id: string;
  title: string;
  price: number;
  isFree: boolean;
  isOnline: boolean;
  eventImages: { imageUrl: string }[];
  eventDates: EventDate[];
  eventPaymentMethods: PaymentMethod[];
}

const EventCheckout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedDateId, setSelectedDateId] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchEvent();
    }
  }, [id, user]);

  const fetchEvent = async () => {
    try {
      const data = await apiFetch<EventData>(`/events/${id}`);
      setEvent(data);
    } catch (error) {
      console.error('Error fetching event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load checkout details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const availableDates = event?.eventDates?.filter(d => !d.isSoldOut) || [];
  const eventDatesMap = new Map(
    availableDates.map(d => [d.eventDate, d])
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const eventDate = eventDatesMap.get(dateStr);
      if (eventDate) {
        setSelectedDateId(eventDate.id);
        setSelectedTime(eventDate.startTime);
      }
    }
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return eventDatesMap.has(dateStr);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleCheckout = async () => {
    if (!user || !event || !selectedDateId) {
      toast({
        title: 'Missing information',
        description: 'Please select a date.',
        variant: 'destructive',
      });
      return;
    }

    if (!event.isFree && !selectedPaymentMethod) {
      toast({
        title: 'Missing information',
        description: 'Please select a payment method.',
        variant: 'destructive',
      });
      return;
    }

    if (!event.isFree && !receiptFile) {
      toast({
        title: 'Receipt required',
        description: 'Please upload your payment receipt.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('eventId', id || '');
      formData.append('eventDateId', selectedDateId);
      formData.append('quantity', String(quantity));
      formData.append('totalAmount', String(event.isFree ? 0 : Number(event.price) * quantity));
      formData.append('paymentMethodId', selectedPaymentMethod);
      formData.append('promoCode', promoCode || '');
      formData.append('status', event.isFree ? 'verified' : 'pending');
      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      await apiForm('/tickets', 'POST', formData);

      toast({
        title: 'Success!',
        description: event.isFree 
          ? 'Your ticket has been confirmed!' 
          : 'Your booking is pending verification.',
      });

      navigate('/my-tickets');
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete booking. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = event?.isFree ? 0 : (Number(event?.price) || 0) * quantity;

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="max-w-4xl mx-auto animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8" />
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-[400px] bg-muted rounded-xl" />
              <div className="space-y-4">
                <div className="h-6 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
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

  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">Check Availability</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Date Selection */}
            <div className="p-6 border border-border rounded-xl bg-card">
              <h2 className="font-semibold text-foreground mb-4">Choose Date</h2>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={(date) => !isDateAvailable(date)}
                className="rounded-md border pointer-events-auto"
                modifiers={{
                  available: (date) => isDateAvailable(date),
                }}
                modifiersStyles={{
                  available: { 
                    fontWeight: 'bold',
                    backgroundColor: 'hsl(var(--accent) / 0.1)',
                  },
                }}
              />

              {selectedDate && (
                <div className="mt-4 p-3 bg-secondary rounded-lg">
                  <p className="text-min text-foreground">
                    Selected: {format(selectedDate, 'EEEE, MMMM d, yyyy')} at {selectedTime}
                  </p>
                </div>
              )}

              {/* Sold out dates notice */}
              {event.eventDates.some(d => d.isSoldOut) && (
                <p className="text-min text-muted-foreground mt-4">
                  Some dates are sold out and cannot be selected.
                </p>
              )}
            </div>

            {/* Promo Code */}
            <div className="p-6 border border-border rounded-xl bg-card">
              <h2 className="font-semibold text-foreground mb-4">Promo Code</h2>
              <div className="flex gap-3">
                <Input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter code"
                  className="flex-1"
                />
                <Button variant="outline">Apply</Button>
              </div>
            </div>

            {/* Quantity */}
            <div className="p-6 border border-border rounded-xl bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">{event.title}</h2>
                  <p className="text-min text-muted-foreground">
                    {event.isFree ? 'Free' : `₦${Number(event.price).toLocaleString()} per ticket`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    disabled={quantity >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Payment Method (if not free) */}
            {!event.isFree && event.eventPaymentMethods.length > 0 && (
              <div className="p-6 border border-border rounded-xl bg-card">
                <h2 className="font-semibold text-foreground mb-4">Payment Details</h2>
                <p className="text-min text-muted-foreground mb-4">
                  Select a payment method and transfer to the account below:
                </p>
                <div className="space-y-3">
                  {event.eventPaymentMethods.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => setSelectedPaymentMethod(method.id)}
                      className={cn(
                        'w-full p-4 border rounded-lg text-left transition-colors',
                        selectedPaymentMethod === method.id
                          ? 'border-accent bg-accent/5'
                          : 'border-border hover:border-accent/50'
                      )}
                    >
                      <p className="font-medium text-foreground">{method.bankName}</p>
                      <p className="text-min text-muted-foreground">{method.accountName}</p>
                      <p className="text-min font-mono text-foreground">{method.accountNumber}</p>
                    </button>
                  ))}
                </div>

                {/* Receipt Upload */}
                <div className="mt-6">
                  <Label className="text-min">Upload Payment Receipt</Label>
                  <div className="mt-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors">
                      <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-min text-muted-foreground">
                        {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              disabled={submitting || !selectedDateId || (!event.isFree && !selectedPaymentMethod)}
              className="w-full py-6 text-base"
            >
              {submitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Complete Booking'
              )}
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 p-6 border border-border rounded-xl bg-card">
              {event.eventImages[0] && (
                <img
                  src={event.eventImages[0].imageUrl}
                  alt={event.title}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="font-semibold text-foreground mb-4">{event.title}</h3>
              
              <div className="space-y-3 text-min">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="text-foreground">{event.isOnline ? 'Online' : 'In Person'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tickets</span>
                  <span className="text-foreground">{quantity}</span>
                </div>
                <div className="border-t border-border pt-3">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-foreground">
                      {event.isFree ? 'Free' : `₦${totalAmount.toLocaleString()}`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventCheckout;