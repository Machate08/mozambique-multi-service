
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AppContext } from '../contexts/AppContext';
import { Business, BusinessCategory } from '../types';
import * as api from '../services/api';
import { CameraIcon, EditIcon, DeleteIcon, PlusCircleIcon, SettingsIcon } from './common/icons';
import { fileToBase64 } from '../utils/file';
import ConfirmModal from './common/ConfirmModal';

const SettingsPage: React.FC = () => {
    const { currentUser, updateCurrentUser, showNotification, navigate, logout, currentView } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState<'account' | 'services'>('account');
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Account Form State
    const [accountForm, setAccountForm] = useState({ name: '', email: '' });
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    
    // Service Form State (Modal)
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Business | null>(null);
    const [serviceForm, setServiceForm] = useState<any>({});
    
    // Delete States
    const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'user' | 'service'; id?: string }>({ open: false, type: 'user' });
    
    const PROVINCES = ['Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala', 'Manica', 'Tete', 'Zambézia', 'Nampula', 'Niassa', 'Cabo Delgado'];

    useEffect(() => {
        if (!currentUser) {
            navigate('login');
            return;
        }
        setAccountForm({ name: currentUser.name, email: currentUser.email });
        loadBusinesses();
    }, [currentUser]);

    useEffect(() => {
        // Auto open modal if requested via props
        if (currentView.props?.openNewService) {
            setActiveTab('services');
            openServiceModal();
        }
    }, [currentView.props]);

    const loadBusinesses = async () => {
        if (!currentUser) return;
        setLoading(true);
        const data = await api.getUserBusinesses(currentUser.id);
        setBusinesses(data);
        setLoading(false);
    };

    // --- ACCOUNT ACTIONS ---

    const handleUpdateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
            await api.updateUserProfile(currentUser.id, accountForm);
            updateCurrentUser({ ...currentUser, ...accountForm });
            showNotification('Perfil atualizado!', 'success');
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), 'error');
        }
    };

    const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0] && currentUser) {
            try {
                const base64 = await fileToBase64(e.target.files[0]);
                await api.updateUserProfile(currentUser.id, { ...accountForm, profilePicUrl: base64 });
                updateCurrentUser({ ...currentUser, profilePicUrl: base64 });
                showNotification('Foto de perfil atualizada!');
            } catch (error) {
                showNotification('Erro ao carregar imagem', 'error');
            }
        }
    };
    
    const handleDeleteUser = async () => {
        if (!currentUser) return;
        try {
            await api.deleteUser(currentUser.id);
            logout();
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), 'error');
        }
    };

    // --- SERVICE ACTIONS ---

    const openServiceModal = (service?: Business) => {
        if (service) {
            setEditingService(service);
            setServiceForm({
                name: service.name,
                category: service.category,
                country: service.country,
                province: service.province || 'Maputo Cidade',
                city: service.city,
                neighborhood: service.neighborhood,
                contact: service.contact,
                description: service.description,
                openingTime: service.openingHours.split('-')[0].trim(),
                closingTime: service.openingHours.split('-')[1]?.trim() || '18:00',
                openDays: service.openDays
            });
        } else {
            setEditingService(null);
            setServiceForm({
                name: '', category: 'Saúde', country: 'Moçambique', province: 'Maputo Cidade', city: '', neighborhood: '',
                contact: '', description: '', openingTime: '08:00', closingTime: '18:00', openDays: 'Segunda a Sexta'
            });
        }
        setIsServiceModalOpen(true);
    };

    const handleServiceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        
        try {
            const fullHours = `${serviceForm.openingTime} - ${serviceForm.closingTime}`;
            const payload = { ...serviceForm, openingHours: fullHours };
            delete payload.openingTime;
            delete payload.closingTime;

            if (editingService) {
                const updated = await api.updateBusiness({ ...editingService, ...payload });
                setBusinesses(prev => prev.map(b => b.id === updated.id ? updated : b));
                showNotification('Serviço atualizado!');
            } else {
                const { business } = await api.createBusiness(payload, currentUser.id);
                setBusinesses(prev => [...prev, business]);
                // Update current user if this is the first business to set dashboard link correctly
                if (!currentUser.businessId) {
                    updateCurrentUser({ ...currentUser, businessId: business.id, businessName: business.name });
                }
                showNotification('Serviço criado!');
            }
            setIsServiceModalOpen(false);
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), 'error');
        }
    };

    const handleDeleteService = async () => {
        if (!confirmModal.id) return;
        try {
            await api.deleteBusiness(confirmModal.id);
            setBusinesses(prev => prev.filter(b => b.id !== confirmModal.id));
            showNotification('Serviço excluído.');
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), 'error');
        } finally {
            setConfirmModal({ ...confirmModal, open: false });
        }
    };
    
    // --- RENDER HELPERS ---
    
    const inputClasses = "w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none transition-all";

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
             <ConfirmModal 
                isOpen={confirmModal.open} 
                onClose={() => setConfirmModal({ ...confirmModal, open: false })} 
                onConfirm={confirmModal.type === 'user' ? handleDeleteUser : handleDeleteService} 
                title={confirmModal.type === 'user' ? 'Excluir Conta' : 'Excluir Serviço'}
                message={confirmModal.type === 'user' 
                    ? 'Tem certeza que deseja excluir sua conta? Todos os seus dados serão perdidos permanentemente.' 
                    : 'Tem certeza que deseja excluir este serviço? Todos os agendamentos e itens serão perdidos.'} 
            />

            {isServiceModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto py-10" onClick={() => setIsServiceModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white">{editingService ? 'Editar Serviço' : 'Novo Serviço'}</h3>
                        <form onSubmit={handleServiceSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Nome do Serviço</label>
                                    <input required name="name" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Categoria</label>
                                    <select name="category" value={serviceForm.category} onChange={e => setServiceForm({...serviceForm, category: e.target.value})} className={inputClasses}>
                                        {['Saúde', 'Tecnologia', 'Técnico Profissional', 'Diversos'].map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Província</label>
                                    <select name="province" value={serviceForm.province} onChange={e => setServiceForm({...serviceForm, province: e.target.value})} className={inputClasses}>
                                        {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Cidade</label>
                                    <input required name="city" value={serviceForm.city} onChange={e => setServiceForm({...serviceForm, city: e.target.value})} className={inputClasses} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Bairro</label>
                                <input required name="neighborhood" value={serviceForm.neighborhood} onChange={e => setServiceForm({...serviceForm, neighborhood: e.target.value})} className={inputClasses} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Contato</label>
                                <input required name="contact" value={serviceForm.contact} onChange={e => setServiceForm({...serviceForm, contact: e.target.value})} className={inputClasses} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Abertura</label>
                                    <input type="time" required name="openingTime" value={serviceForm.openingTime} onChange={e => setServiceForm({...serviceForm, openingTime: e.target.value})} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Fechamento</label>
                                    <input type="time" required name="closingTime" value={serviceForm.closingTime} onChange={e => setServiceForm({...serviceForm, closingTime: e.target.value})} className={inputClasses} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1">Dias</label>
                                    <select name="openDays" value={serviceForm.openDays} onChange={e => setServiceForm({...serviceForm, openDays: e.target.value})} className={inputClasses}>
                                        {['Segunda a Sexta', 'Segunda a Sábado', 'Todos os dias'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Descrição</label>
                                <textarea required name="description" rows={3} value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className={inputClasses} />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700">Cancelar</button>
                                <button type="submit" className="px-5 py-2 bg-primary-600 text-white rounded-xl shadow-lg">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="text-center mb-10">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-full inline-block mb-4">
                    <SettingsIcon className="h-8 w-8 text-slate-500" />
                </div>
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Configurações</h2>
                <p className="text-slate-500 dark:text-slate-400">Gerencie sua conta e seus serviços.</p>
            </div>

            <div className="flex justify-center border-b border-slate-200 dark:border-slate-700 mb-8">
                <button
                    onClick={() => setActiveTab('account')}
                    className={`px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'account' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Minha Conta
                </button>
                <button
                    onClick={() => setActiveTab('services')}
                    className={`px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'services' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Meus Serviços
                </button>
            </div>

            {activeTab === 'account' && (
                <div className="max-w-xl mx-auto animate-fadeIn bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative group cursor-pointer" onClick={() => profilePicInputRef.current?.click()}>
                            <div className="h-24 w-24 rounded-full overflow-hidden ring-4 ring-white dark:ring-slate-700 shadow-lg">
                                {currentUser?.profilePicUrl ? (
                                    <img src={currentUser.profilePicUrl} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {currentUser?.name[0]}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                <CameraIcon className="h-8 w-8" />
                            </div>
                        </div>
                        <input type="file" ref={profilePicInputRef} onChange={handleProfilePicChange} hidden accept="image/*" />
                        <p className="text-xs text-slate-400 mt-2">Clique para alterar a foto</p>
                    </div>

                    <form onSubmit={handleUpdateAccount} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Nome</label>
                            <input value={accountForm.name} onChange={e => setAccountForm({ ...accountForm, name: e.target.value })} className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Email</label>
                            <input value={accountForm.email} onChange={e => setAccountForm({ ...accountForm, email: e.target.value })} className={inputClasses} />
                        </div>
                        <button type="submit" className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg mt-4 hover:bg-primary-700 transition-colors">
                            Atualizar Perfil
                        </button>
                    </form>

                    <div className="border-t border-slate-100 dark:border-slate-700 mt-8 pt-6">
                        <h4 className="font-bold text-red-500 mb-2">Zona de Perigo</h4>
                        <button onClick={() => setConfirmModal({ open: true, type: 'user' })} className="text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg transition-colors border border-red-200 dark:border-red-900/30">
                            Excluir minha conta
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'services' && (
                <div className="animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gerenciar Serviços ({businesses.length})</h3>
                        <button onClick={() => openServiceModal()} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/20">
                            <PlusCircleIcon className="h-5 w-5" />
                            Novo Serviço
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {businesses.map(biz => (
                            <div key={biz.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={biz.profilePicUrl} className="h-14 w-14 rounded-xl object-cover" />
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{biz.name}</h4>
                                        <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300">{biz.category}</span>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1 mb-4">
                                    <p>{biz.province}, {biz.city}</p>
                                    <p>{biz.neighborhood}</p>
                                    <p>Tel: {biz.contact}</p>
                                </div>
                                <div className="mt-auto flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                     <button onClick={() => { updateCurrentUser({...currentUser!, businessId: biz.id, businessName: biz.name}); navigate('dashboard'); }} className="flex-1 py-2 rounded-lg bg-slate-50 dark:bg-slate-700 text-primary-600 font-bold hover:bg-primary-50 dark:hover:bg-slate-600 transition-colors text-sm">
                                        Gerenciar
                                    </button>
                                    <button onClick={() => openServiceModal(biz)} className="p-2 text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                        <EditIcon className="h-5 w-5" />
                                    </button>
                                    <button onClick={() => setConfirmModal({ open: true, type: 'service', id: biz.id })} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-600 rounded-lg transition-colors">
                                        <DeleteIcon className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {businesses.length === 0 && (
                        <div className="text-center py-20 text-slate-400">
                            <p>Você ainda não cadastrou nenhum serviço.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
