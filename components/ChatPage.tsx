
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { ChatConversation, Message } from '../types';
import * as api from '../services/api';
import { ChatIcon, SearchIcon } from './common/icons';

const ChatPage: React.FC = () => {
    const { currentUser, navigate, showNotification, refreshNotifications } = useContext(AppContext);
    const [conversations, setConversations] = useState<ChatConversation[]>([]);
    const [activeChat, setActiveChat] = useState<ChatConversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loadingList, setLoadingList] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (!currentUser) {
            navigate('login');
            return;
        }
        loadConversations();
        const interval = setInterval(() => {
            loadConversations(false);
            if (activeChat) loadMessages(activeChat, false);
        }, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, [currentUser, activeChat]);

    const loadConversations = async (showLoader = true) => {
        if (!currentUser) return;
        if (showLoader) setLoadingList(true);
        const convs = await api.getConversations(currentUser.id);
        setConversations(convs);
        if (showLoader) setLoadingList(false);
    };

    const loadMessages = async (conv: ChatConversation, showLoader = true) => {
        if (!currentUser) return;
        
        // ID format for 'user' type convs is "bizId:userId"
        const businessId = conv.type === 'business' ? conv.id : conv.id.split(':')[0];
        const userId = conv.type === 'business' ? currentUser.id : conv.id.split(':')[1];
        
        const msgs = await api.getMessages(businessId, userId);
        setMessages(msgs);
        
        // Mark as read
        if (conv.unreadCount > 0) {
            const readerType = conv.type === 'business' ? 'user' : 'business';
            await api.markMessagesRead(businessId, userId, readerType);
            refreshNotifications(); // Update global badge
            // Update local state to clear badge
            setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
        }
    };

    const handleSelectChat = (conv: ChatConversation) => {
        setActiveChat(conv);
        loadMessages(conv);
        // On mobile, this would slide the view
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser || !activeChat) return;

        const businessId = activeChat.type === 'business' ? activeChat.id : activeChat.id.split(':')[0];
        const userId = activeChat.type === 'business' ? currentUser.id : activeChat.id.split(':')[1];
        const senderType = activeChat.type === 'business' ? 'user' : 'business';

        try {
            const msg = await api.sendMessage(businessId, userId, senderType, newMessage);
            setMessages(prev => [...prev, msg]);
            setNewMessage('');
            // Move conversation to top
            setConversations(prev => {
                const updated = prev.filter(c => c.id !== activeChat.id);
                return [{ ...activeChat, lastMessage: newMessage, lastMessageTime: new Date().toISOString() }, ...updated];
            });
        } catch (error) {
            showNotification('Erro ao enviar mensagem', 'error');
        }
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const filteredConversations = conversations.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900 flex overflow-hidden">
            {/* Sidebar / List */}
            <div className={`w-full md:w-80 lg:w-96 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Mensagens</h2>
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar conversa..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-full text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                        <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    </div>
                </div>
                
                <div className="flex-grow overflow-y-auto">
                    {loadingList ? (
                        <div className="flex justify-center p-8"><div className="animate-spin h-6 w-6 border-b-2 border-primary-600 rounded-full"></div></div>
                    ) : filteredConversations.length > 0 ? (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.id} 
                                onClick={() => handleSelectChat(conv)}
                                className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700/50 ${activeChat?.id === conv.id ? 'bg-primary-50 dark:bg-slate-700/80' : ''}`}
                            >
                                <div className="relative shrink-0">
                                    <img src={conv.avatarUrl || `https://ui-avatars.com/api/?name=${conv.name}`} className="h-12 w-12 rounded-full object-cover" />
                                    {conv.unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">{conv.unreadCount}</span>}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <h4 className={`text-sm font-semibold truncate ${conv.unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>{conv.name}</h4>
                                        <span className="text-[10px] text-slate-400 shrink-0">{new Date(conv.lastMessageTime).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</span>
                                    </div>
                                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800 dark:text-slate-100' : 'text-slate-500'}`}>{conv.lastMessage}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-slate-400 text-sm p-4">
                            Nenhuma conversa iniciada.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-grow flex flex-col bg-slate-50 dark:bg-slate-900 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                {activeChat ? (
                    <>
                        <div className="p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-sm">
                            <button className="md:hidden text-slate-500" onClick={() => setActiveChat(null)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
                            </button>
                            <img src={activeChat.avatarUrl || `https://ui-avatars.com/api/?name=${activeChat.name}`} className="h-10 w-10 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">{activeChat.name}</h3>
                                <p className="text-xs text-green-500 font-medium">Online</p>
                            </div>
                        </div>

                        <div className="flex-grow overflow-y-auto p-4 space-y-4">
                            {messages.map(msg => {
                                // Determine "me" logic:
                                // If I am user talking to business (activeChat.type='business'), then my msgs are senderType='user'
                                // If I am business talking to user (activeChat.type='user'), then my msgs are senderType='business'
                                const iAmSender = (activeChat.type === 'business' && msg.senderType === 'user') || 
                                                  (activeChat.type === 'user' && msg.senderType === 'business');

                                return (
                                    <div key={msg.id} className={`flex ${iAmSender ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm text-sm ${iAmSender ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none'}`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 text-right ${iAmSender ? 'text-primary-200' : 'text-slate-400'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input 
                                    type="text" 
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    placeholder="Digite uma mensagem..."
                                    className="flex-grow px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                                <button type="submit" disabled={!newMessage.trim()} className="bg-primary-600 hover:bg-primary-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
                        <ChatIcon className="h-20 w-20 mb-4 opacity-20" />
                        <h3 className="text-xl font-medium">Suas Mensagens</h3>
                        <p className="mt-2">Selecione uma conversa para começar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatPage;