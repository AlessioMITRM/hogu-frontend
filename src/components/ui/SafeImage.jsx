import React from 'react';
import { IMAGE_NOT_AVAILABLE_SVG } from '../../constants/assets';

const SafeImage = ({ src, alt, className, ...props }) => {
  const handleError = (e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = IMAGE_NOT_AVAILABLE_SVG;
  };

  return (
    <img
      src={src || IMAGE_NOT_AVAILABLE_SVG}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
