import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../contexts/AppContext';
import { CheckCircleIcon, XCircleIcon } from './icons';

const Notification: React.FC = () => {
    const { notification } = useContext(AppContext);
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (notification) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
            }, 3000); // Hide after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [notification]);

    if (!notification) {
        return null;
    }

    const isSuccess = notification.type === 'success';
    const baseClasses = "fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-lg shadow-lg text-white transition-all duration-300";
    const themeClasses = isSuccess ? 'bg-green-500' : 'bg-red-500';
    const visibilityClasses = show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';

    return (
        <div
            className={`${baseClasses} ${themeClasses} ${visibilityClasses}`}
            role="alert"
            aria-live="assertive"
        >
            {isSuccess ? <CheckCircleIcon className="w-6 h-6 mr-3" /> : <XCircleIcon className="w-6 h-6 mr-3" />}
            <span className="font-medium">{notification.message}</span>
        </div>
    );
};

export default Notification;
