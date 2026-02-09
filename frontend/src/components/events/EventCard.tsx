import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface EventCardProps {
  id: string;
  title: string;
  imageUrl: string;
  date: Date;
  price: number;
  isFree: boolean;
  isPromoted?: boolean;
}

const EventCard = ({ id, title, imageUrl, date, price, isFree, isPromoted }: EventCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/event/${id}`} className="block">
        <div className="event-card border border-border/30">
          <div className="aspect-[4/3] overflow-hidden">
            <img
              src={imageUrl || '/placeholder.svg'}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          </div>
          <div className="p-4 bg-[#F7F7F8]">
            <h3 className="font-semibold text-foreground line-clamp-2 mb-2">
              {title}
            </h3>
            <p className="text-min text-muted-foreground mb-1">
              {format(date, 'EEE, MMM d • h:mm a')}
            </p>
            <p className="text-min font-medium text-foreground">
              {isFree ? 'Free' : `₦${price.toLocaleString()}`}
            </p>
            {isPromoted && (
              <span className="inline-block mt-2 text-min text-accent font-medium">
                Promoted
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default EventCard;