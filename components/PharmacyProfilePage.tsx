
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Business, Post, Message, CatalogItem } from '../types';
import * as api from '../services/api';
import { AppContext } from '../contexts/AppContext';
import PostCard from './PostCard';
import { PlusCircleIcon, CameraIcon, CalendarIcon, MessageSquareIcon } from './common/icons';
import PharmacyCatalogPage from './PharmacyCatalogPage';
import { fileToBase64 } from '../utils/file';
import { ImageGallery } from './common/ImageGallery';
import ConfirmModal from './common/ConfirmModal';

// --- CHAT MODAL ---

const ChatModal: React.FC<{ business: Business; onClose: () => void }> = ({ business, onClose }) => {
    const { currentUser, showNotification, refreshNotifications } = useContext(AppContext);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (currentUser) loadMessages();
        const interval = setInterval(() => {
             if (currentUser) loadMessages(false);
        }, 5000); // Polling every 5s for new messages
        return () => clearInterval(interval);
    }, [currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadMessages = async (showLoader = true) => {
        if (!currentUser) return;
        if (showLoader) setLoading(true);
        const msgs = await api.getMessages(business.id, currentUser.id);
        setMessages(msgs);
        
        // Mark as read immediately
        const readerType = currentUser.id === business.ownerId ? 'business' : 'user';
        // We only try to mark read if there are messages, or we assume the API handles empty cases gracefully
        try {
             await api.markMessagesRead(business.id, currentUser.id, readerType);
             refreshNotifications();
        } catch(e) {
            // ignore
        }

        if (showLoader) setLoading(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            const senderType = currentUser.id === business.ownerId ? 'business' : 'user';
            const msg = await api.sendMessage(business.id, currentUser.id, senderType, newMessage);
            setMessages([...messages, msg]);
            setNewMessage('');
        } catch (error) {
            showNotification('Erro ao enviar mensagem', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 h-[600px] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800 rounded-t-2xl">
                    <div className="flex items-center gap-3">
                         <img src={business.profilePicUrl} className="h-10 w-10 rounded-full object-cover"/>
                         <div>
                             <h3 className="font-bold text-slate-800 dark:text-white leading-none">{business.name}</h3>
                             <span className="text-xs text-green-500 font-medium">Chat com gerente</span>
                         </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">&times;</button>
                </div>

                <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="flex justify-center pt-10"><div className="animate-spin h-6 w-6 border-b-2 border-primary-500 rounded-full"></div></div>
                    ) : messages.length > 0 ? (
                        messages.map(msg => {
                            const isMe = (msg.senderType === 'user' && currentUser?.id !== business.ownerId) || (msg.senderType === 'business' && currentUser?.id === business.ownerId);
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${isMe ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white rounded-tl-none shadow-sm'}`}>
                                        {msg.content}
                                        <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-200' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="text-center text-slate-400 text-sm mt-10">Inicie a conversa...</div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2 bg-white dark:bg-slate-800 rounded-b-2xl">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                        placeholder="Escreva sua mensagem..."
                        className="flex-grow px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- APPOINTMENT MODAL ---

const AppointmentModal: React.FC<{ business: Business; preSelectedService?: string; onClose: () => void }> = ({ business, preSelectedService, onClose }) => {
    const { showNotification, currentUser } = useContext(AppContext);
    const [services, setServices] = useState<CatalogItem[]>([]);
    const [formData, setFormData] = useState({
        customerName: currentUser?.name || '',
        customerContact: '',
        serviceName: preSelectedService || '',
        date: '',
        time: '',
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Fetch services for the dropdown
        api.getItemsByBusinessId(business.id).then(items => {
            // Filter only items that are likely services (or just show all)
            setServices(items);
        });
    }, [business.id]);

    const validateDateTime = () => {
        if (!formData.date || !formData.time) return true;

        const date = new Date(formData.date);
        const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon...
        
        // Parse Open Days (Simple Heuristic for now)
        // 'Segunda a Sexta' -> 1-5
        // 'Segunda a Sábado' -> 1-6
        // 'Todos os dias' -> 0-6
        let allowedDays: number[] = [];
        const openDaysLower = business.openDays.toLowerCase();
        
        if (openDaysLower.includes('todos')) allowedDays = [0,1,2,3,4,5,6];
        else if (openDaysLower.includes('sexta')) allowedDays = [1,2,3,4,5];
        else if (openDaysLower.includes('sábado') || openDaysLower.includes('sabado')) allowedDays = [1,2,3,4,5,6];
        else allowedDays = [1,2,3,4,5]; // default fallback

        if (!allowedDays.includes(dayOfWeek)) {
            showNotification(`O negócio não abre neste dia da semana (${business.openDays}).`, 'error');
            return false;
        }

        // Parse Opening Hours "08:00 - 18:00"
        try {
            const [startStr, endStr] = business.openingHours.split('-').map(s => s.trim());
            const [startH, startM] = startStr.split(':').map(Number);
            const [endH, endM] = endStr.split(':').map(Number);
            const [userH, userM] = formData.time.split(':').map(Number);

            const startMinutes = startH * 60 + (startM || 0);
            const endMinutes = endH * 60 + (endM || 0);
            const userMinutes = userH * 60 + (userM || 0);

            if (userMinutes < startMinutes || userMinutes > endMinutes) {
                showNotification(`Horário fora de funcionamento (${business.openingHours}).`, 'error');
                return false;
            }
        } catch (e) {
            // If format is custom text, skip validation or warn
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (!validateDateTime()) return;

        setLoading(true);
        try {
            await api.createAppointment({
                ...formData,
                businessId: business.id,
                userId: currentUser.id
            });
            showNotification('Solicitação de agendamento enviada!', 'success');
            onClose();
        } catch (error: any) {
             const msg = api.getErrorMessage(error, 'Erro ao agendar.');
             showNotification(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 transform scale-100 transition-all" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Agendar Serviço</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Seu Nome</label>
                        <input type="text" value={formData.customerName} disabled className={`${inputClasses} opacity-60 cursor-not-allowed`}/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Seu Contato</label>
                        <input type="text" value={formData.customerContact} onChange={e => setFormData({...formData, customerContact: e.target.value})} required className={inputClasses} placeholder="Ex: 84 123 4567"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Serviço</label>
                        <select 
                            value={formData.serviceName} 
                            onChange={e => setFormData({...formData, serviceName: e.target.value})} 
                            required 
                            className={inputClasses}
                        >
                            <option value="">Selecione um serviço...</option>
                            {services.map(s => (
                                <option key={s.id} value={s.name}>{s.name} - {s.price > 0 ? `${s.price} MT` : 'Sob Consulta'}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Data</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required className={inputClasses} min={new Date().toISOString().split('T')[0]}/>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Hora</label>
                            <input type="time" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} required className={inputClasses}/>
                        </div>
                    </div>
                    
                    <p className="text-xs text-slate-500 mt-2 text-center">Horário de funcionamento: <span className="font-semibold">{business.openingHours}</span> ({business.openDays})</p>

                    <div className="flex justify-end gap-3 pt-6">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
                             {loading && <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></div>}
                             Confirmar Agendamento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- POST FORM MODAL ---

const PostFormModal: React.FC<{ post: Post | null; businessId: string; onSave: () => void; onClose: () => void }> = ({ post, businessId, onSave, onClose }) => {
    const [title, setTitle] = useState(post?.title || '');
    const [description, setDescription] = useState(post?.description || '');
    const [imageUrls, setImageUrls] = useState<string[]>(post?.imageUrls || []);
    const { showNotification } = useContext(AppContext);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const currentCount = imageUrls.length;
            const remaining = 5 - currentCount;
            
            if (remaining <= 0) {
                showNotification('Limite de 5 imagens atingido.', 'error');
                return;
            }

            const files: File[] = [];
            const count = Math.min(e.target.files.length, remaining);
            
            for (let i = 0; i < count; i++) {
                const file = e.target.files.item(i);
                if (file) files.push(file);
            }

            if (e.target.files.length > remaining) {
                showNotification(`Apenas as primeiras ${remaining} imagens foram adicionadas (limite de 5).`, 'success');
            }

            try {
                const base64Promises = files.map(file => fileToBase64(file));
                const newImageUrls = await Promise.all(base64Promises);
                setImageUrls(prev => [...prev, ...newImageUrls]);
            } catch (error) {
                showNotification('Erro ao carregar imagem.', 'error');
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const postData = {
                id: post?.id || '',
                businessId,
                title,
                description,
                imageUrls,
                createdAt: post?.createdAt || ''
            };
            if(post) {
                await api.updatePost(postData);
                showNotification('Anúncio atualizado com sucesso!');
            } else {
                await api.addPost({ businessId, title, description, imageUrls });
                showNotification('Anúncio criado com sucesso!');
            }
            onSave();
        } catch (error: any) {
            const msg = api.getErrorMessage(error, 'Erro ao salvar anúncio.');
            showNotification(msg, 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{post ? 'Editar Anúncio' : 'Novo Anúncio'}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Título</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Imagens</label>
                        <input type="file" ref={imageInputRef} onChange={handleImageFileChange} hidden multiple accept="image/*" />
                        <div className="grid grid-cols-4 gap-3">
                             {imageUrls.map((url, i) => <img key={i} src={url} className="w-full h-24 object-cover rounded-lg shadow-sm"/>)}
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:text-primary-500 hover:border-primary-500 transition-colors">
                                <PlusCircleIcon className="h-8 w-8"/>
                            </button>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancelar</button>
                        <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- MAIN PAGE ---

interface BusinessProfilePageProps {
    businessId: string;
}

const PharmacyProfilePage: React.FC<BusinessProfilePageProps> = ({ businessId }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'feed' | 'catalog'>('feed');
    
    // Modal states
    const [isAppointmentOpen, setIsAppointmentOpen] = useState(false);
    const [preSelectedService, setPreSelectedService] = useState<string>('');
    
    const [isChatOpen, setIsChatOpen] = useState(false);
    
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null);

    const { currentUser, updateCurrentUser, navigate, showNotification, currentView } = useContext(AppContext);
    
    // Refs for image uploads
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    const coverImageInputRef = useRef<HTMLInputElement>(null);

    const fetchData = async () => {
        if (!business) setLoading(true);
        const [fetchedBiz, fetchedPosts] = await Promise.all([
            api.getBusinessById(businessId),
            api.getPostsByBusinessId(businessId),
        ]);
        setBusiness(fetchedBiz || null);
        setPosts(fetchedPosts);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        // Reset tab to feed when visiting a new profile
        setActiveTab('feed');
    }, [businessId]);

    // Check for navigation flags to open modals
    useEffect(() => {
        if (currentView.props?.openSchedule) {
            openAppointmentModal(currentView.props.serviceName);
        }
    }, [currentView.props]);

    const isOwner = currentUser?.businessId === business?.id;

    const handleProfilePicFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && business) {
            try {
                const file = e.target.files[0];
                const newPic = await fileToBase64(file);
                const updatedBiz = await api.updateBusiness({ ...business, profilePicUrl: newPic });
                setBusiness(updatedBiz);
                if (currentUser?.id === updatedBiz.ownerId) {
                    updateCurrentUser({ ...currentUser, profilePicUrl: updatedBiz.profilePicUrl });
                }
                showNotification("Foto de perfil atualizada!");
            } catch (error: any) {
                showNotification("Erro ao carregar foto.", "error");
            }
        }
    };

    const handleCoverImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && business) {
            try {
                const file = e.target.files[0];
                const newCover = await fileToBase64(file);
                const updatedBiz = await api.updateBusiness({ ...business, coverImageUrl: newCover });
                setBusiness(updatedBiz);
                showNotification("Capa atualizada!");
            } catch (error: any) {
                showNotification("Erro ao carregar capa.", "error");
            }
        }
    };

    const handleDeletePost = (postId: string) => {
        setPostToDelete(postId);
        setIsConfirmModalOpen(true);
    };
    
    const handleConfirmDelete = async () => {
        if (!postToDelete) return;
        try {
            await api.deletePost(postToDelete);
            showNotification('Anúncio excluído!');
            setPosts(prev => prev.filter(p => p.id !== postToDelete));
        } catch (error: any) {
             const msg = api.getErrorMessage(error, 'Erro ao excluir anúncio.');
             showNotification(msg, 'error');
        } finally {
            setIsConfirmModalOpen(false);
        }
    };
    
    const handleImageClick = (images: string[], startIndex: number) => {
        setGalleryImages(images);
        setGalleryInitialIndex(startIndex);
        setIsGalleryOpen(true);
    }
    
    const openAppointmentModal = (serviceName: string = '') => {
        if (!currentUser) {
            showNotification('Faça login para agendar.', 'error');
            return;
        }
        setPreSelectedService(serviceName);
        setIsAppointmentOpen(true);
    };
    
    const openChatModal = () => {
        if (!currentUser) {
            showNotification('Faça login para conversar.', 'error');
            return;
        }
        setIsChatOpen(true);
    }

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (!business) return <div className="text-center py-20 text-red-500 font-bold text-xl">Negócio não encontrado.</div>;

    const defaultCoverClass = 'bg-gradient-to-r from-emerald-500 to-teal-700';

    return (
        <div className="pb-20">
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Deseja excluir este anúncio?"
            />
            {isGalleryOpen && <ImageGallery images={galleryImages} onClose={() => setIsGalleryOpen(false)} initialIndex={galleryInitialIndex} />}
            {isPostModalOpen && <PostFormModal post={editingPost} businessId={business.id} onSave={() => { setIsPostModalOpen(false); fetchData(); }} onClose={() => setIsPostModalOpen(false)} />}
            {isAppointmentOpen && <AppointmentModal business={business} preSelectedService={preSelectedService} onClose={() => setIsAppointmentOpen(false)} />}
            {isChatOpen && <ChatModal business={business} onClose={() => setIsChatOpen(false)} />}
            
            <input type="file" ref={profilePicInputRef} onChange={handleProfilePicFileChange} hidden accept="image/*" />
            <input type="file" ref={coverImageInputRef} onChange={handleCoverImageFileChange} hidden accept="image/*" />

            {/* Profile Cover */}
            <div className={`h-48 md:h-72 w-full relative group/cover`}>
                {business.coverImageUrl ? (
                    <img 
                        src={business.coverImageUrl} 
                        alt="Capa" 
                        className="w-full h-full object-cover"
                        onClick={() => handleImageClick([business.coverImageUrl!], 0)}
                    />
                ) : (
                    <div className={`w-full h-full ${defaultCoverClass}`}>
                        <div className="absolute inset-0 bg-black/10"></div>
                    </div>
                )}
                
                {isOwner && (
                    <button 
                        onClick={() => coverImageInputRef.current?.click()}
                        className="absolute top-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-md opacity-0 group-hover/cover:opacity-100 transition-opacity"
                        title="Alterar Capa"
                    >
                        <CameraIcon className="h-6 w-6" />
                    </button>
                )}
            </div>

            <div className="container mx-auto px-4 -mt-20 relative z-10">
                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 p-6 md:p-8 flex flex-col md:flex-row items-start gap-8">
                     
                     {/* Avatar */}
                     <div className="relative group shrink-0 mx-auto md:mx-0 -mt-24 md:-mt-20" onClick={() => !isOwner && handleImageClick([business.profilePicUrl], 0)}>
                        <img src={business.profilePicUrl} alt={business.name} className={`h-40 w-40 rounded-3xl object-cover border-4 border-white dark:border-slate-800 shadow-2xl ${!isOwner ? 'cursor-pointer' : ''}`}/>
                        {isOwner && (
                            <button onClick={() => profilePicInputRef.current?.click()} className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <CameraIcon className="h-10 w-10"/>
                            </button>
                        )}
                    </div>

                    <div className="flex-grow w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white mb-2">{business.name}</h1>
                                <div className="flex flex-wrap justify-center md:justify-start gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full font-semibold">{business.category}</span>
                                    <span>•</span>
                                    <span>{business.neighborhood}, {business.city}</span>
                                </div>
                            </div>
                            
                            <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
                                {isOwner ? (
                                    <button onClick={() => navigate('dashboard')} className="px-6 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-slate-500/20">
                                        Painel de Controle
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={openChatModal} className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                            <MessageSquareIcon className="h-6 w-6" />
                                        </button>
                                        <button onClick={() => openAppointmentModal()} className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all flex items-center gap-2">
                                            <CalendarIcon className="h-5 w-5" />
                                            Agendar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Contato</h4>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{business.contact}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Horário</h4>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{business.openingHours}</p>
                            </div>
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Dias</h4>
                                <p className="text-slate-800 dark:text-slate-200 font-medium">{business.openDays}</p>
                            </div>
                        </div>
                        
                         {business.description && (
                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{business.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Tabs */}
            <div className="container mx-auto px-4 mt-8 max-w-7xl">
                 <div className="flex justify-center border-b border-slate-200 dark:border-slate-700 mb-8">
                    <button
                        onClick={() => setActiveTab('feed')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'feed' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Feed
                    </button>
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`flex-1 md:flex-none px-4 md:px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'catalog' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                    >
                        Catálogo e Serviços
                    </button>
                 </div>

                 {activeTab === 'feed' ? (
                     <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Últimas Publicações</h3>
                             {isOwner && (
                                <button onClick={() => { setEditingPost(null); setIsPostModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 text-sm">
                                    <PlusCircleIcon className="h-5 w-5" />
                                    Novo Post
                                </button>
                             )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {posts.length > 0 ? (
                                posts.map(post => (
                                    <PostCard key={post.id} post={post} isOwner={isOwner} onEdit={(p) => { setEditingPost(p); setIsPostModalOpen(true); }} onDelete={handleDeletePost} onImageClick={handleImageClick} />
                                ))
                            ) : (
                                <div className="col-span-full bg-slate-50 dark:bg-slate-800/50 text-center p-12 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhuma publicação ainda.</p>
                                    {isOwner && <p className="text-sm text-primary-600 mt-2">Crie seu primeiro post para atrair clientes!</p>}
                                </div>
                            )}
                        </div>
                     </div>
                 ) : (
                     <div className="animate-fadeIn">
                        <PharmacyCatalogPage 
                            business={business} 
                            isEmbedded={true} 
                            onScheduleItem={(item) => openAppointmentModal(item.name)}
                        />
                     </div>
                 )}
            </div>
        </div>
    );
};

export default PharmacyProfilePage;