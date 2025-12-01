import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';

export default function Custom404() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found | Star Accessories</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="min-h-screen flex items-center justify-center overflow-hidden relative bg-gradient-to-br from-[#667eea] to-[#764ba2] font-sans">
        
        {/* Floating Shapes */}
        <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>

        <div className="container mx-auto px-4 z-10 text-center text-white relative">
          
          {/* Error Code */}
          <div className="error-code select-none">404</div>

          {/* Logo (Replacing Emoji) */}
          <div className="logo-container">
             <div className="relative w-32 h-32 md:w-40 md:h-40 mx-auto animate-bounce-slow">
                <Image 
                   src="/logo.svg" 
                   alt="Star Accessories Logo" 
                   fill
                   className="object-contain drop-shadow-2xl"
                   priority
                />
             </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold mb-4 mt-4">Oops! Page Not Found</h1>
          <p className="text-lg md:text-xl mb-10 opacity-90 max-w-lg mx-auto">
            Looks like this page decided to play hide and seek.<br className="hidden md:block" />
            And it's winning!
          </p>

          <div className="flex flex-wrap gap-5 justify-center">
            <Link 
              href="/" 
              className="btn btn-primary px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:transform hover:-translate-y-1 transition-all duration-300"
            >
              Take Me Home
            </Link>
            <button 
              onClick={() => window.history.back()} 
              className="btn btn-secondary px-8 py-4 rounded-full font-bold text-lg border-2 border-white bg-transparent hover:bg-white hover:text-[#667eea] hover:transform hover:-translate-y-1 transition-all duration-300"
            >
              Go Back
            </button>
          </div>
        </div>

        <style jsx>{`
          .shape {
            position: absolute;
            background: white;
            opacity: 0.1;
            animation: float 20s infinite ease-in-out;
          }

          .shape-1 {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            top: 10%;
            left: 10%;
            animation-delay: 0s;
          }

          .shape-2 {
            width: 60px;
            height: 60px;
            border-radius: 30%;
            top: 70%;
            left: 80%;
            animation-delay: 3s;
          }

          .shape-3 {
            width: 100px;
            height: 100px;
            border-radius: 20%;
            top: 50%;
            left: 5%;
            animation-delay: 6s;
          }

          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-30px) rotate(180deg); }
          }

          .error-code {
            font-size: 120px;
            font-weight: 900;
            line-height: 1;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: glitch 3s infinite;
            text-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          }

          @media (min-width: 768px) {
            .error-code {
              font-size: 180px;
            }
          }

          @keyframes glitch {
            0%, 90%, 100% { transform: translate(0); }
            92% { transform: translate(-2px, 2px); }
            94% { transform: translate(2px, -2px); }
            96% { transform: translate(-2px, -2px); }
            98% { transform: translate(2px, 2px); }
          }

          .animate-bounce-slow {
             animation: bounce 2s infinite;
          }

          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }

          .btn-primary {
            background: white;
            color: #667eea;
          }
        `}</style>
      </div>
    </>
  );
}
