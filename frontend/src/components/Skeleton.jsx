import React from 'react';

export default function Skeleton({ className = '', variant = 'rect', ...props }) {
  const baseClasses = 'animate-pulse bg-neutral-200 dark:bg-neutral-800';
  
  let variantClasses = '';
  if (variant === 'circle') {
    variantClasses = 'rounded-full';
  } else if (variant === 'text') {
    variantClasses = 'rounded h-4 w-full';
  } else {
    variantClasses = 'rounded-2xl'; // Apple large rounded corner
  }
  
  return (
    <div 
      className={`${baseClasses} ${variantClasses} ${className}`} 
      {...props}
    />
  );
}
