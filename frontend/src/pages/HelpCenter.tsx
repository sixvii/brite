import { useState } from 'react';
import { Twitter, Mail, Github, Instagram, MessageCircle, Send, Loader2 } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiJson } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { z } from 'zod';

const helpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  category: z.string().min(1, 'Please select a category'),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
});

const HelpCenter = () => {
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    category: '',
    subject: '',
    message: '',
  });

  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/kingdrake0', label: 'Twitter', color: 'hover:text-blue-400' },
    { icon: Mail, href: 'mailto:9sixvi@gmail.com', label: 'Email', color: 'hover:text-red-500' },
    { icon: Github, href: 'https://github.com', label: 'GitHub', color: 'hover:text-gray-800' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram', color: 'hover:text-pink-500' },
    { icon: MessageCircle, href: 'https://wa.me/2349032066315', label: 'WhatsApp', color: 'hover:text-green-500' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const data = helpSchema.parse(formData);
      setLoading(true);

      await apiJson('/help', 'POST', {
        name: data.name,
        email: data.email,
        category: data.category,
        subject: data.subject,
        message: data.message,
      });

      setFormData({
        name: profile?.name || '',
        email: profile?.email || '',
        category: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-main py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Help Center
          </h1>
          <p className="text-min text-muted-foreground text-center mb-8">
            Have a question or need to report an issue? We're here to help.
          </p>

          {/* Social Links */}
          <div className="flex justify-center gap-6 mb-12">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted-foreground ${social.color} transition-colors`}
                aria-label={social.label}
              >
                <social.icon className="w-10 h-10" />
              </a>
            ))}
          </div>

          {/* Help Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-min">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input mt-1"
                  placeholder="Your name"
                />
                {errors.name && (
                  <p className="text-destructive text-min mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email" className="text-min">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input mt-1"
                  placeholder="Your email"
                />
                {errors.email && (
                  <p className="text-destructive text-min mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="category" className="text-min">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payment">Payment Issue</SelectItem>
                  <SelectItem value="event">Event Issue</SelectItem>
                  <SelectItem value="report">Report Event</SelectItem>
                  <SelectItem value="account">Account Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-destructive text-min mt-1">{errors.category}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject" className="text-min">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="form-input mt-1"
                placeholder="Brief description of your issue"
              />
              {errors.subject && (
                <p className="text-destructive text-min mt-1">{errors.subject}</p>
              )}
            </div>

            <div>
              <Label htmlFor="message" className="text-min">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="form-input mt-1 min-h-[150px]"
                placeholder="Please describe your issue in detail..."
              />
              {errors.message && (
                <p className="text-destructive text-min mt-1">{errors.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full py-6 text-base gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Request
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenter;