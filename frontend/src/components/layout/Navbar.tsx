import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Menu, X, ChevronDown, Navigation, Globe, Locate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import UserAvatar from '@/components/ui/UserAvatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/find-events?search=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate(`/find-events?location=${encodeURIComponent(location)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation('Current Location');
          setShowLocationDropdown(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          setShowLocationDropdown(false);
        }
      );
    }
  };

  const navLinks = [
    { to: '/find-events', label: 'Find Events' },
    { to: '/create-event', label: 'Create Events' },
    { to: '/my-tickets', label: 'Find My Tickets' },
    { to: '/help', label: 'Help Center' },
  ];

  return (
    <nav className="bg-[#F7F7F8] border-b border-border sticky top-0 z-50">
      <div className="container-main">
        {/* Desktop Navbar */}
        <div className="hidden lg:flex items-center justify-between h-16 gap-8">
          {/* Logo and Search */}
          <div className="flex items-center gap-6 flex-1">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-10 w-auto filter invert" />
            </Link>

            {/* Search Input */}
            <div className="flex-1 max-w-2xl">
              <div className="search-input-container shadow-input">
                <div className="flex items-center flex-1 px-4">
                  <Input
                    type="text"
                    placeholder="Search events by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-min"
                  />
                </div>

                <div className="search-divider" />

                <DropdownMenu open={showLocationDropdown} onOpenChange={setShowLocationDropdown}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 hover:bg-secondary transition-colors min-w-[180px]">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-min text-foreground truncate">{location}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[240px]">
                    <DropdownMenuItem onClick={handleUseCurrentLocation} className="gap-2">
                      <Navigation className="w-4 h-4" />
                      Use my current location
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setLocation('Online Events'); setShowLocationDropdown(false); }} className="gap-2">
                      <Globe className="w-4 h-4" />
                      Browse online events
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setLocation('Lagos, Nigeria'); setShowLocationDropdown(false); }} className="gap-2">
                      <Locate className="w-4 h-4" />
                      Lagos, Nigeria
                    </DropdownMenuItem>
                    <div className="px-2 py-1.5">
                      <Input
                        placeholder="Type a location..."
                        className="text-min"
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            setShowLocationDropdown(false);
                          }
                        }}
                      />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button
                  onClick={handleSearch}
                  size="icon"
                  className="rounded-full bg-primary text-primary-foreground m-1 h-9 w-9 lg:bg-[#F15537] lg:text-white lg:hover:bg-[#d94a2f]"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-min text-foreground hover:text-[#D9492E] transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            ))}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full border border-border cursor-pointer transition-opacity hover:opacity-90">
                    <UserAvatar
                      name={profile?.name || profile?.email || ''}
                      avatarUrl={profile?.avatarUrl}
                      size="sm"
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/dashboard')} className="cursor-pointer hover:bg-[#D9492E] hover:text-white">
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer hover:bg-[#D9492E] hover:text-white">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                className="text-[14.5px] border-border bg-[#F15537] text-white hover:bg-[#d94a2f]"
              >
                Get Started
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navbar */}
        <div className="lg:hidden flex items-center justify-between h-14">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto filter invert" />
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="rounded-full border border-border hover:opacity-90">
                <UserAvatar
                  name={profile?.name || profile?.email || ''}
                  avatarUrl={profile?.avatarUrl}
                  size="sm"
                />
              </Link>
            ) : (
              <Button
                onClick={() => navigate('/auth')}
                variant="outline"
                size="sm"
                className="text-min border-border bg-[#F15537] text-white hover:bg-[#d94a2f]"
              >
                Get Started
              </Button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="lg:hidden pb-3">
          <div className="flex items-center bg-card border border-border rounded-lg overflow-hidden">
            <Input
              type="text"
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="border-0 bg-transparent focus-visible:ring-0 text-min"
            />
            <Button
              onClick={handleSearch}
              size="icon"
              className="rounded-full bg-[#F15537] text-primary-foreground m-1 h-8 w-8"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-t border-border"
          >
            <div className="container-main py-4 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-min text-foreground hover:text-[#D9492E] py-3 px-4 rounded-lg hover:bg-secondary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="text-min text-destructive py-3 px-4 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  Sign Out
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;