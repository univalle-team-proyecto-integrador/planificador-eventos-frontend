import React from 'react';

export const Button = ({ 
  variant = 'neutral', 
  children, 
  onClick, 
  type = 'button', 
  disabled = false,
  className = '' 
}) => {
  // Estilos base: padding, bordes, tipografía y foco accesible
  const baseStyle = "px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Design tokens de color y variantes visuales
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 border border-transparent",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 border border-transparent",
    neutral: "bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-400 border border-gray-300 shadow-sm"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};