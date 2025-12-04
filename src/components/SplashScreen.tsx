import React from 'react';
import { APP_IMAGES } from '../config/assets';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center flex-col transition-opacity duration-500">
      <div className="animate-pulse">
        <img 
          src={APP_IMAGES.openingGif} 
          alt="Pet Anjinho - Carregando..." 
          className="w-80 h-auto object-contain"
        />
      </div>
      <p className="mt-4 text-gray-500 font-medium text-sm tracking-widest animate-bounce">CARREGANDO...</p>
    </div>
  );
};

export default SplashScreen;
