
import React, { useContext } from 'react';
import { AppProvider, AppContext } from './contexts/AppContext';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import PharmacyProfilePage from './components/PharmacyProfilePage';
import DashboardPage from './components/DashboardPage';
import FavoritesPage from './components/FavoritesPage';
import ClientAppointmentsPage from './components/ClientAppointmentsPage';
import SettingsPage from './components/SettingsPage';
import ChatPage from './components/ChatPage';
import Header from './components/Header';
import Footer from './components/Footer';
import Notification from './components/common/Notification';
import ErrorBoundary from './components/common/ErrorBoundary';

const PageRenderer: React.FC = () => {
    const { currentView } = useContext(AppContext);

    const renderPage = () => {
        switch (currentView.page) {
            case 'home':
                return <HomePage />;
            case 'login':
                return <LoginPage />;
            case 'register':
                return <RegisterPage />;
            case 'businessProfile':
                return <PharmacyProfilePage businessId={currentView.props.businessId} />;
            case 'dashboard':
                return <DashboardPage />;
            case 'favorites':
                return <FavoritesPage />;
            case 'clientAppointments':
                return <ClientAppointmentsPage />;
            case 'settings':
                return <SettingsPage />;
            case 'chat':
                return <ChatPage />;
            default:
                return <HomePage />;
        }
    };

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow w-full max-w-7xl mx-auto">
                {renderPage()}
            </main>
            {/* Hide footer on chat page to maximize space */}
            {currentView.page !== 'chat' && <Footer />}
            <Notification />
        </div>
    );
};


const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppProvider>
                <PageRenderer />
            </AppProvider>
        </ErrorBoundary>
    );
};

export default App;