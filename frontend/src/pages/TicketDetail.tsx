import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Download, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  } | null;
  eventDates: {
    eventDate: string;
    startTime: string;
  } | null;
}

const TicketDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const stateTicket = (location.state as { ticket?: Ticket } | null)?.ticket || null;
  const [ticket, setTicket] = useState<Ticket | null>(stateTicket);
  const [loading, setLoading] = useState(!stateTicket);

  useEffect(() => {
    if (!id) {
      navigate('/my-tickets');
      return;
    }
    if (stateTicket && stateTicket.id === id) {
      setTicket(stateTicket);
      setLoading(false);
      fetchTicket(id, true);
      return;
    }
    fetchTicket(id);
  }, [id, stateTicket, navigate]);

  const fetchTicket = async (ticketId: string, silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }
      const data = await apiFetch<Ticket>(`/tickets/${ticketId}`);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast({
        title: 'Error',
        description: 'Failed to load ticket details.',
        variant: 'destructive',
      });
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-accent text-accent-foreground">Verified</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleDownload = (value: Ticket) => {
    const qrValue = `brite-ticket:${value.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(qrValue)}`;
    const eventTitle = value.events?.title || 'Event Ticket';
    const dateText = value.eventDates?.eventDate && value.eventDates?.startTime
      ? format(new Date(`${value.eventDates.eventDate}T${value.eventDates.startTime}`), 'EEE, MMM d, yyyy • h:mm a')
      : 'Date TBA';
    const venueText = value.events?.isOnline
      ? 'Online Event'
      : `${value.events?.venueName || 'Venue TBA'}, ${value.events?.city || 'City TBA'}`;
    const totalText = value.totalAmount === 0
      ? 'Free'
      : `₦${Number(value.totalAmount).toLocaleString()}`;

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
            <div class="meta">Ticket ID: ${value.id}</div>
            <div class="row"><span class="label">Date:</span> ${dateText}</div>
            <div class="row"><span class="label">Location:</span> ${venueText}</div>
            <div class="row"><span class="label">Quantity:</span> ${value.quantity}</div>
            <div class="row"><span class="label">Total:</span> ${totalText}</div>
            <div class="row"><span class="label">Status:</span> ${value.status}</div>
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

  if (loading) {
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

  if (!ticket) {
    return (
      <Layout>
        <div className="container-main py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Ticket not found</h1>
          <Button onClick={() => navigate('/my-tickets')}>Back to My Tickets</Button>
        </div>
      </Layout>
    );
  }

  const qrValue = `brite-ticket:${ticket.id}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(qrValue)}`;
  const dateText = ticket.eventDates?.eventDate && ticket.eventDates?.startTime
    ? format(new Date(`${ticket.eventDates.eventDate}T${ticket.eventDates.startTime}`), 'EEEE, MMMM d, yyyy • h:mm a')
    : 'Date TBA';
  const venueText = ticket.events?.isOnline
    ? 'Online Event'
    : `${ticket.events?.venueName || 'Venue TBA'}, ${ticket.events?.city || 'City TBA'}`;

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Ticket</h1>
          <Button variant="outline" onClick={() => handleDownload(ticket)} className="gap-2">
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 p-6 border border-border rounded-xl bg-card space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {ticket.events?.title || 'Event Ticket'}
                </h2>
                <p className="text-min text-muted-foreground">Ticket ID: {ticket.id}</p>
              </div>
              {getStatusBadge(ticket.status)}
            </div>

            <div className="space-y-2">
              <div className="text-min"><span className="font-medium text-foreground">Date:</span> {dateText}</div>
              <div className="text-min"><span className="font-medium text-foreground">Location:</span> {venueText}</div>
              <div className="text-min"><span className="font-medium text-foreground">Quantity:</span> {ticket.quantity}</div>
              <div className="text-min">
                <span className="font-medium text-foreground">Total:</span>{' '}
                {ticket.totalAmount === 0 ? 'Free' : `₦${Number(ticket.totalAmount).toLocaleString()}`}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="p-6 border border-border rounded-xl bg-card text-center">
              <img src={qrUrl} alt="Ticket QR" className="mx-auto w-64 h-64" />
              <p className="text-min text-muted-foreground mt-4">
                Present this QR code at entry.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TicketDetail;
