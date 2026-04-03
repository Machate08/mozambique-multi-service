
import React, { useContext, useState } from 'react';
import { AppContext } from '../contexts/AppContext';
import { PharmacyLogoIcon, SearchIcon, MoonIcon, SunIcon, HeartIcon, CalendarIcon, SettingsIcon, MessageSquareIcon } from './common/icons';
import { User } from '../types';

const getInitials = (name: string = ''): string => {
    return name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
};

const UserAvatar: React.FC<{ user: User }> = ({ user }) => {
    if (user.businessId && user.profilePicUrl) {
        return <img src={user.profilePicUrl} alt={user.businessName || user.name} className="h-9 w-9 rounded-full object-cover ring-2 ring-primary-500"/>
    }

    const initials = user.businessId && user.businessName 
        ? getInitials(user.businessName) 
        : getInitials(user.name);
        
    const bgGradient = user.businessId 
        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
        : 'bg-gradient-to-br from-emerald-400 to-green-600';

    return (
        <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${bgGradient} shadow-md select-none`}>
            {initials}
        </div>
    );
}

const Header: React.FC = () => {
    const { currentUser, navigate, logout, theme, toggleTheme, searchTerm, setSearchTerm, currentView, categoryFilter, setCategoryFilter, unreadCounts, locationFilter, setLocationFilter } = useContext(AppContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const categories = ['Todas', 'Saúde', 'Tecnologia', 'Técnico Profissional', 'Diversos'];

    const handleCategoryClick = (cat: string) => {
        setCategoryFilter(cat === 'Todas' ? '' : cat);
        navigate('home');
        setIsMenuOpen(false);
    }

    return (
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/70 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-800 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 py-3">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <div
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => navigate('home')}
                    >
                        <div className="bg-primary-500 text-white p-1.5 rounded-lg shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                            <PharmacyLogoIcon className="h-6 w-6" />
                        </div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight hidden sm:block">Mozambique Multi-Service</h1>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight sm:hidden">MMS</h1>
                    </div>

                    {/* Desktop Search (Center) */}
                    <div className="hidden lg:flex flex-grow max-w-2xl px-4">
                         {currentView.page === 'home' && (
                             <div className="flex gap-2 w-full">
                                {/* Main Search */}
                                <div className="relative group flex-grow">
                                    <input
                                        type="text"
                                        placeholder="Buscar serviços, produtos ou empresas..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-full bg-slate-100/50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none shadow-sm"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SearchIcon className="h-4 w-4 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                                    </div>
                                </div>
                                
                                {/* Region Filter */}
                                <div className="flex bg-slate-100/50 dark:bg-slate-800/50 rounded-full border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                                    <select 
                                        value={locationFilter.type} 
                                        onChange={(e) => setLocationFilter({...locationFilter, type: e.target.value})}
                                        className="pl-3 py-2 text-sm bg-transparent text-slate-600 dark:text-slate-300 font-medium outline-none rounded-l-full border-r border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                                    >
                                        <option value="Cidade">Cidade</option>
                                        <option value="Bairro">Bairro</option>
                                        <option value="Província">Província</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder={`Ex: Maputo`}
                                        value={locationFilter.value}
                                        onChange={(e) => setLocationFilter({...locationFilter, value: e.target.value})}
                                        className="w-32 pl-3 pr-3 py-2 text-sm bg-transparent text-slate-800 dark:text-slate-200 focus:ring-0 outline-none rounded-r-full"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop Actions (Right) */}
                    <div className="hidden lg:flex items-center gap-4 shrink-0">
                        <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {categories.slice(1).map(cat => (
                                <button key={cat} onClick={() => handleCategoryClick(cat)} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors whitespace-nowrap">
                                    {cat}
                                </button>
                            ))}
                        </nav>
                        
                        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                        
                        <div className="flex items-center gap-2">
                             <button onClick={toggleTheme} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                                {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
                            </button>
                            
                            {currentUser ? (
                                <div className="flex items-center gap-1">
                                    <button onClick={() => navigate('favorites')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-red-500 transition-colors relative" title="Favoritos">
                                        <HeartIcon className="h-5 w-5" />
                                    </button>
                                    
                                     <button onClick={() => navigate('chat')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-500 transition-colors relative" title="Mensagens">
                                        <MessageSquareIcon className="h-5 w-5" />
                                        {unreadCounts.messages > 0 && (
                                            <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse"></span>
                                        )}
                                    </button>
                                    
                                     <button onClick={() => navigate('clientAppointments')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-primary-500 transition-colors relative" title="Meus Agendamentos">
                                        <CalendarIcon className="h-5 w-5" />
                                    </button>
                                    
                                     <button onClick={() => navigate('settings')} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-white transition-colors" title="Configurações">
                                        <SettingsIcon className="h-5 w-5" />
                                    </button>

                                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                                    <a href="#" onClick={(e) => { e.preventDefault(); currentUser.businessId ? navigate('dashboard') : navigate('settings', { openNewService: true }); }} className="hidden xl:block text-sm font-bold text-primary-600 dark:text-primary-400 hover:underline relative mr-2">
                                        {currentUser.businessId ? 'Painel' : 'Cadastrar'}
                                        {currentUser.businessId && unreadCounts.appointments > 0 && (
                                            <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">{unreadCounts.appointments}</span>
                                        )}
                                    </a>

                                     <div 
                                        className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                                        onClick={() => currentUser.businessId ? navigate('businessProfile', { businessId: currentUser.businessId }) : navigate('settings')}
                                      >
                                          <UserAvatar user={currentUser} />
                                          <span className="text-sm font-bold hidden xl:inline">{currentUser.name.split(' ')[0]}</span>
                                      </div>
                                    <button
                                        onClick={logout}
                                        className="text-xs font-bold text-red-500 hover:text-red-600 px-2 ml-1"
                                    >
                                        Sair
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => navigate('login')}
                                    className="bg-primary-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-lg shadow-primary-500/20 hover:bg-primary-700 hover:shadow-primary-500/40 transition-all transform hover:-translate-y-0.5 ml-2"
                                >
                                    Entrar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-3 lg:hidden">
                        {currentUser && (
                            <button onClick={() => navigate('chat')} className="p-2 relative text-slate-600 dark:text-slate-300">
                                <MessageSquareIcon className="h-6 w-6" />
                                {unreadCounts.messages > 0 && <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>}
                            </button>
                        )}
                        <button className="text-slate-600 dark:text-slate-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>
                </div>
                
                {/* Mobile Menu Dropdown */}
                 {isMenuOpen && (
                    <div className="lg:hidden mt-4 pb-4 border-t border-slate-200 dark:border-slate-800 pt-4 space-y-4 animate-fadeIn">
                        {currentUser && (
                            <div 
                                className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                onClick={() => { 
                                    currentUser.businessId ? navigate('businessProfile', { businessId: currentUser.businessId }) : navigate('settings'); 
                                    setIsMenuOpen(false); 
                                }}
                            >
                                <UserAvatar user={currentUser} />
                                <div className="flex-grow">
                                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{currentUser.name}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                                </div>
                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </div>
                        )}

                        {currentView.page === 'home' && (
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                />
                                <div className="flex gap-2">
                                     <select 
                                        value={locationFilter.type} 
                                        onChange={(e) => setLocationFilter({...locationFilter, type: e.target.value})}
                                        className="py-2 pl-2 pr-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                                    >
                                        <option value="Cidade">Cidade</option>
                                        <option value="Bairro">Bairro</option>
                                        <option value="Província">Província</option>
                                    </select>
                                    <input
                                        type="text"
                                        placeholder={`Local`}
                                        value={locationFilter.value}
                                        onChange={(e) => setLocationFilter({...locationFilter, value: e.target.value})}
                                        className="flex-grow px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                                    />
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-2">
                             {categories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => handleCategoryClick(cat)} 
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                        (cat === 'Todas' && !categoryFilter) || cat === categoryFilter
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                         {currentUser ? (
                             <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                                 <button onClick={() => { navigate('clientAppointments'); setIsMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300">Meus Agendamentos</button>
                                 <button onClick={() => { navigate('favorites'); setIsMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300">Meus Favoritos</button>
                                 <button onClick={() => { navigate('chat'); setIsMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300">Mensagens</button>
                                 <button onClick={() => { navigate('settings'); setIsMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-slate-700 dark:text-slate-300">Configurações</button>
                                 <button onClick={() => { currentUser.businessId ? navigate('dashboard') : navigate('settings', { openNewService: true }); setIsMenuOpen(false); }} className="block w-full text-left py-2 font-semibold text-primary-600 relative">
                                     {currentUser.businessId ? 'Gerenciar Serviço' : 'Cadastrar Serviço'}
                                     {unreadCounts.appointments > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCounts.appointments}</span>}
                                 </button>
                                 <button onClick={() => { logout(); setIsMenuOpen(false); }} className="block w-full text-left py-2 text-red-500">Sair</button>
                             </div>
                         ) : (
                             <button onClick={() => { navigate('login'); setIsMenuOpen(false); }} className="w-full bg-primary-600 text-white py-2 rounded-lg font-semibold">Entrar</button>
                         )}
                    </div>
                 )}
            </div>
        </header>
    );
};

export default Header;
