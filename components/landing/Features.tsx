import React from 'react';
import { Truck, ShieldCheck, Headphones, CreditCard } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export const Features = () => {
    const { darkMode } = useTheme();

    const features = [
        {
            icon: <Truck className="w-8 h-8 text-blue-500" />,
            title: "Fast Delivery",
            description: "Quick and reliable shipping across Bangladesh."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-green-500" />,
            title: "Premium Quality",
            description: "100% authentic and high-quality products."
        },
        {
            icon: <Headphones className="w-8 h-8 text-purple-500" />,
            title: "24/7 Support",
            description: "Friendly customer support whenever you need help."
        },
        {
            icon: <CreditCard className="w-8 h-8 text-orange-500" />,
            title: "Secure Payment",
            description: "Using Bkash and more coming soon."
        }
    ];

    return (
        <div className={`py-16 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`tron-card p-6 flex flex-col items-center text-center`}
                        >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 bg-gray-50 dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-white/5`}>
                                {feature.icon}
                            </div>
                            <h3 className={`text-lg font-bold mb-2 text-black dark:text-white`}>
                                {feature.title}
                            </h3>
                            <p className={`text-sm text-gray-600 dark:text-gray-400`}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
