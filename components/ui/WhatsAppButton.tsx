import React from 'react';
import { MessageCircle } from 'lucide-react';

const WhatsAppButton = ({ product, darkMode }) => {
  const [currentUrl, setCurrentUrl] = React.useState('');

  React.useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  if (!product) return null;

  const message = `Hi! I'm interested in ${product.name} - ${currentUrl}`;
  const whatsappUrl = `https://wa.me/19417876746?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`w-full py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${darkMode ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'}`}>
      <MessageCircle size={20} />
      Ask on WhatsApp
    </a>
  );
};

export default WhatsAppButton;
