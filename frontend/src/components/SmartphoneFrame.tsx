import React from 'react';

interface SmartphoneFrameProps {
    children: React.ReactNode;
}

const SmartphoneFrame: React.FC<SmartphoneFrameProps> = ({ children }) => {
    return (
        <div className="fixed bottom-8 right-8 z-50">
            <div className="relative">
                {/* Smartphone frame */}
                <div className="bg-gray-900 rounded-[3rem] p-3 shadow-2xl" style={{ width: '380px', height: '760px' }}>
                    {/* Screen */}
                    <div className="bg-white rounded-[2.5rem] w-full h-full overflow-hidden relative">
                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 bg-gray-900 rounded-b-3xl" style={{ width: '120px', height: '24px', zIndex: 100 }}>
                            <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gray-800 rounded-full"></div>
                        </div>

                        {/* Content */}
                        <div className="w-full h-full pt-8 overflow-y-auto bg-gradient-to-br from-blue-50 to-purple-50">
                            {children}
                        </div>
                    </div>
                </div>

                {/* Power button */}
                <div className="absolute -right-1 top-32 w-1 h-16 bg-gray-800 rounded-l-lg"></div>
                {/* Volume buttons */}
                <div className="absolute -left-1 top-24 w-1 h-12 bg-gray-800 rounded-r-lg"></div>
                <div className="absolute -left-1 top-40 w-1 h-12 bg-gray-800 rounded-r-lg"></div>
            </div>
        </div>
    );
};

export default SmartphoneFrame;
