import { Link } from 'react-router-dom';
import { Twitter, Mail, Github, Instagram, MessageCircle } from 'lucide-react';

const Footer = () => {
  const socialLinks = [
    { icon: Twitter, href: 'https://twitter.com/kingdrake0', label: 'Twitter' },
    { icon: Mail, href: 'mailto:9sixvi@gmail.com', label: 'Email' },
    { icon: Github, href: 'https://github.com', label: 'GitHub' },
    { icon: Instagram, href: 'https://instagram.com', label: 'Instagram' },
    { icon: MessageCircle, href: 'https://wa.me/2349032066315', label: 'WhatsApp' },
  ];

  return (
    <footer className="footer">
      <div className="container-main">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left">
            <Link to="/" className="inline-flex items-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto filter " />
            </Link>
            <p className="text-primary-foreground/70 text-min mt-2">
              Discover and create amazing events
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end gap-4">
            <div className="flex items-center gap-6">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                  aria-label={social.label}
                >
                  <social.icon className="w-7 h-7" />
                </a>
              ))}
            </div>

            <div className="flex items-center gap-6 text-min text-primary-foreground/70">
              <Link to="/help" className="hover:text-primary-foreground transition-colors">
                Help Center
              </Link>
              <Link to="/privacy" className="hover:text-primary-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="hover:text-primary-foreground transition-colors">
                Terms
              </Link>
            </div>

            <p className="text-min text-primary-foreground/50">
              © {new Date().getFullYear()} Show. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;