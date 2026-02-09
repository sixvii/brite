import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const UserAvatar = ({ name, avatarUrl, size = 'md', className }: UserAvatarProps) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);
  const getInitial = (value: string) => {
    const trimmed = value?.trim();
    if (!trimmed) return 'U';

    const firstToken = trimmed.split(/\s+/)[0];
    const match = firstToken.match(/[A-Za-z0-9]/);
    return match ? match[0].toUpperCase() : 'U';
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  if (avatarUrl && !imageError) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={cn(
          'rounded-full object-cover border border-gray-300',
          sizeClasses[size],
          className
        )}
        onError={() => setImageError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold border border-gray-300',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: '#ffffff', color: '#1c1c1c' }}
    >
      {getInitial(name)}
    </div>
  );
};

export default UserAvatar;