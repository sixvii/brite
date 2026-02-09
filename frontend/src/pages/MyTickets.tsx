import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface Ticket {
  id: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  events: {
    id: string;
    title: string;
    venueName: string;
    city: string;
    isOnline: boolean;
    eventImages: { imageUrl: string }[];
  };
  eventDates: {
    eventDate: string;
    startTime: string;
  };
}

const MyTickets = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    if (user) {
      fetchTickets();
    }
  }, [user, authLoading]);

  const fetchTickets = async () => {
    try {
      const data = await apiFetch<Ticket[]>('/tickets/me');
      setTickets(data || []);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (ticket: Ticket) => {
    const qrValue = `brite-ticket:${ticket.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}`;
    const eventTitle = ticket.events?.title || 'Event Ticket';
    const dateText = ticket.eventDates?.eventDate && ticket.eventDates?.startTime
      ? format(new Date(`${ticket.eventDates.eventDate}T${ticket.eventDates.startTime}`), 'EEE, MMM d, yyyy • h:mm a')
      : 'Date TBA';
    const venueText = ticket.events?.isOnline
      ? 'Online Event'
      : `${ticket.events?.venueName || 'Venue TBA'}, ${ticket.events?.city || 'City TBA'}`;
    const totalText = ticket.totalAmount === 0
      ? 'Free'
      : `₦${Number(ticket.totalAmount).toLocaleString()}`;

    const win = window.open('', '_blank');
    if (!win) {
      return;
    }

    win.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${eventTitle} - Ticket</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #1c1c1c; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; max-width: 520px; }
            h1 { font-size: 20px; margin: 0 0 12px; }
            .meta { font-size: 14px; color: #555; margin-bottom: 16px; }
            .row { margin: 6px 0; font-size: 14px; }
            .label { font-weight: 600; }
            .qr { margin-top: 16px; text-align: center; }
            .qr img { width: 220px; height: 220px; }
            .footer { margin-top: 16px; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>${eventTitle}</h1>
            <div class="meta">Ticket ID: ${ticket.id}</div>
            <div class="row"><span class="label">Date:</span> ${dateText}</div>
            <div class="row"><span class="label">Location:</span> ${venueText}</div>
            <div class="row"><span class="label">Quantity:</span> ${ticket.quantity}</div>
            <div class="row"><span class="label">Total:</span> ${totalText}</div>
            <div class="row"><span class="label">Status:</span> ${ticket.status}</div>
            <div class="qr">
              <img src="${qrUrl}" alt="Ticket QR" />
            </div>
            <div class="footer">Present this QR code at entry. You can save as PDF from the print dialog.</div>
          </div>
          <script>
            window.onload = () => window.print();
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="border-gray-300 text-white">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="container-main py-8">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8">
        <h1 className="text-2xl font-bold text-foreground mb-8">My Tickets</h1>

        {tickets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-min mb-4">
              You haven't booked any tickets yet.
            </p>
            <Button
              onClick={() => navigate('/find-events')}
              style={{ backgroundColor: '#D9492E' }}
              className="text-white hover:opacity-90 transition-opacity"
            >
              Find Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col md:flex-row gap-4 p-4 bg-card border border-border rounded-xl"
              >
                {/* Event Image */}
                <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={ticket.events?.eventImages?.[0]?.imageUrl || '/placeholder.svg'}
                    alt={ticket.events?.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Event Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">
                        {ticket.events?.title}
                      </h3>
                      <p className="text-min text-muted-foreground mb-2">
                        {ticket.eventDates?.eventDate && ticket.eventDates?.startTime ? (
                          format(
                            new Date(`${ticket.eventDates.eventDate}T${ticket.eventDates.startTime}`),
                            'EEE, MMM d, yyyy • h:mm a'
                          )
                        ) : (
                          'Date TBA'
                        )}
                      </p>
                      <p className="text-min text-muted-foreground">
                        {ticket.events?.isOnline ? 'Online Event' : `${ticket.events?.venueName}, ${ticket.events?.city}`}
                      </p>
                    </div>
                    {getStatusBadge(ticket.status)}
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-min text-muted-foreground">
                      <span>{ticket.quantity} ticket(s)</span>
                      <span className="mx-2">•</span>
                      <span>
                        {ticket.totalAmount === 0 
                          ? 'Free' 
                          : `₦${Number(ticket.totalAmount).toLocaleString()}`
                        }
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`, { state: { ticket } })}
                      >
                        View Ticket
                      </Button>
                      {ticket.status === 'verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleDownload(ticket)}
                        >
                          <Download className="w-4 h-4" />
                          Download Ticket
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MyTickets;