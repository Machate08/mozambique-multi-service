
import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { CatalogItem, Business, StockMovement, Appointment, BusinessCategory } from '../types';
import * as api from '../services/api';
import { AppContext } from '../contexts/AppContext';
import { EditIcon, DeleteIcon, PlusCircleIcon, SearchIcon, PharmacyLogoIcon, MoreVerticalIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from './common/icons';
import { formatPrice, getCurrencyForCountry } from '../utils/currency';
import { fileToBase64 } from '../utils/file';
import ConfirmModal from './common/ConfirmModal';

// --- MODALS (Simplified for brevity but kept functional) ---

const ItemFormModal: React.FC<{
    item: CatalogItem | null;
    onClose: () => void;
    onSave: (item: CatalogItem) => void;
    business: Business;
}> = ({ item, onClose, onSave, business }) => {
    const { showNotification } = useContext(AppContext);
    const [formData, setFormData] = useState({
        name: item?.name || '',
        description: item?.description || '',
        tags: item?.tags.join(', ') || '',
        quantity: item?.quantity || 0,
        price: item?.price || 0,
        imageUrls: item?.imageUrls || [],
    });
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const currentCount = formData.imageUrls.length;
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
                setFormData(prev => ({...prev, imageUrls: [...prev.imageUrls, ...newImageUrls]}));
            } catch (error) {
                showNotification('Erro ao carregar imagem.', 'error');
            }
        }
    };
    
    const handleRemoveImage = (index: number) => {
        setFormData(prev => ({...prev, imageUrls: prev.imageUrls.filter((_, i) => i !== index)}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const itemData = {
            ...item,
            id: item?.id || '',
            businessId: business.id,
            name: formData.name,
            description: formData.description,
            imageUrls: formData.imageUrls,
            tags: formData.tags.split(',').map(d => d.trim()).filter(Boolean),
            quantity: Number(formData.quantity),
            price: Number(formData.price),
        };
        onSave(itemData as CatalogItem);
    };
    
    const currency = getCurrencyForCountry(business.country);
    const inputClasses = "w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none";

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-6 text-slate-800 dark:text-white border-b border-slate-100 pb-2">{item ? 'Editar Item' : 'Novo Item'}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses}/>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows={3} className={inputClasses}/>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Imagens</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {formData.imageUrls.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} className="w-full h-20 object-cover rounded-lg"/>
                                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                                </div>
                            ))}
                            <button type="button" onClick={() => imageInputRef.current?.click()} className="w-full h-20 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex items-center justify-center text-slate-400 hover:border-primary-500 hover:text-primary-500">
                                <PlusCircleIcon className="h-6 w-6"/>
                            </button>
                        </div>
                        <input type="file" ref={imageInputRef} onChange={handleImageFileChange} hidden multiple accept="image/*" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Tags (separadas por vírgula)</label>
                        <input type="text" name="tags" value={formData.tags} onChange={handleChange} required className={inputClasses} placeholder="Promoção, Serviço..."/>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Qtd / Vagas</label>
                           <input type="number" name="quantity" min="0" value={formData.quantity} onChange={handleChange} required className={inputClasses} disabled={!!item}/>
                        </div>
                        <div>
                           <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Preço ({currency.symbol})</label>
                           <input type="number" name="price" step="0.01" min="0" value={formData.price} onChange={handleChange} required className={inputClasses}/>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30">Salvar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const StockMovementModal: React.FC<{
    item: CatalogItem;
    onClose: () => void;
    onSuccess: (updatedItem: CatalogItem) => void;
}> = ({ item, onClose, onSuccess }) => {
    const [type, setType] = useState<'entrada' | 'saida'>('entrada');
    const [quantity, setQuantity] = useState(1);
    const { showNotification } = useContext(AppContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const updatedItem = await api.recordStockMovement(item.id, type, quantity);
            showNotification('Estoque atualizado com sucesso!', 'success');
            onSuccess(updatedItem);
        } catch (error: any) {
            const msg = error?.message || 'Erro ao registrar movimentação.';
            showNotification(msg, 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold mb-2 text-slate-800 dark:text-white">Ajustar Estoque</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">{item.name} <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs ml-2">Atual: {item.quantity}</span></p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Ação</label>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setType('entrada')} className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'entrada' ? 'bg-green-100 text-green-700 ring-2 ring-green-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>Adicionar</button>
                            <button type="button" onClick={() => setType('saida')} className={`flex-1 py-2 rounded-lg font-medium transition ${type === 'saida' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>Remover</button>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Quantidade</label>
                        <input type="number" min="1" value={quantity} onChange={e => setQuantity(Number(e.target.value))} required className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none text-center text-lg font-bold"/>
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-500/30">Confirmar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DashboardPage: React.FC = () => {
    const { currentUser, showNotification, navigate } = useContext(AppContext);
    const [business, setBusiness] = useState<Business | null>(null);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'inventory' | 'appointments'>('inventory');
    
    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
    const [selectedItemForStock, setSelectedItemForStock] = useState<CatalogItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        if (!currentUser?.businessId) {
            setLoading(false);
            return;
        }

        if (business === null) setLoading(true);
        try {
            const [fetchedBiz, fetchedItems, fetchedApts] = await Promise.all([
                api.getBusinessById(currentUser.businessId),
                api.getAllItemsByBusinessId(currentUser.businessId),
                api.getAppointmentsByBusinessId(currentUser.businessId),
            ]);
            setBusiness(fetchedBiz || null);
            setItems(fetchedItems);
            setAppointments(fetchedApts);
        } catch(e) {
            console.error("Error loading dashboard data", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [currentUser]);

    const handleSaveItem = async (item: CatalogItem) => {
        try {
            if (editingItem) {
                await api.updateItem(item);
                showNotification('Item atualizado!');
            } else {
                await api.addItem(item);
                showNotification('Item adicionado!');
            }
            fetchData();
            setIsFormModalOpen(false);
            setEditingItem(null);
        } catch (error: any) {
            const msg = error?.message || 'Erro ao salvar item.';
            showNotification(msg, 'error');
        }
    };
    
    const handleDeleteItem = (itemId: string) => {
        setItemToDelete(itemId);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.deleteItem(itemToDelete);
            showNotification('Item excluído!');
            setItems(prev => prev.filter(d => d.id !== itemToDelete));
        } catch (error: any) {
             const msg = error?.message || 'Erro ao excluir item.';
             showNotification(msg, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };
    
    const handleUpdateAppointmentStatus = async (id: string, status: Appointment['status']) => {
        try {
            await api.updateAppointmentStatus(id, status);
            fetchData(); // refresh list
        } catch (error: any) {
            showNotification(error.message || "Erro ao atualizar status", "error");
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchTerm) return items;
        return items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [items, searchTerm]);

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    if (!currentUser) return <div className="text-center py-20">Faça login para continuar.</div>;
    
    // If user has no business assigned in current session or load failed, redirect to Settings to create/select one
    if (!currentUser.businessId || !business) {
        return (
            <div className="text-center py-20 px-4">
                <h2 className="text-2xl font-bold mb-4">Nenhum Serviço Selecionado</h2>
                <p className="mb-6 text-slate-500">Selecione ou crie um serviço nas configurações.</p>
                <button onClick={() => navigate('settings')} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold">Ir para Configurações</button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja excluir este item?"
            />
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
                 <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-1">Painel de Controle</h2>
                    <p className="text-slate-500 font-medium">{business.name} • {business.city}</p>
                 </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 mb-8 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-full md:w-auto inline-flex">
                <button 
                    onClick={() => setActiveTab('inventory')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Catálogo
                </button>
                <button 
                    onClick={() => setActiveTab('appointments')}
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'appointments' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Agendamentos
                    {appointments.filter(a => a.status === 'pendente').length > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{appointments.filter(a => a.status === 'pendente').length}</span>
                    )}
                </button>
            </div>

            {activeTab === 'inventory' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between items-center">
                         <div className="relative w-full sm:w-80">
                            <input
                                type="text"
                                placeholder="Buscar item..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-slate-400" />
                            </div>
                        </div>
                        <button onClick={() => { setEditingItem(null); setIsFormModalOpen(true); }} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                            <PlusCircleIcon className="h-5 w-5" />
                            Novo Item
                        </button>
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-4 font-semibold">Item</th>
                                    <th className="px-6 py-4 font-semibold text-center">Estoque</th>
                                    <th className="px-6 py-4 font-semibold text-right">Preço</th>
                                    <th className="px-6 py-4 font-semibold text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {item.imageUrls.length > 0 ? (
                                                    <img src={item.imageUrls[0]} alt={item.name} className="h-12 w-12 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-600" />
                                                ) : (
                                                    <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                        <PharmacyLogoIcon className="h-6 w-6"/>
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</div>
                                                    <div className="text-xs text-slate-500">{item.tags.join(', ')}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${item.quantity > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {item.quantity} un
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-700 dark:text-slate-200">{formatPrice(item.price, business.country)}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-1">
                                                <button onClick={() => { setSelectedItemForStock(item); setIsStockModalOpen(true); }} className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-colors" title="Estoque"><MoreVerticalIcon className="h-5 w-5"/></button>
                                                <button onClick={() => { setEditingItem(item); setIsFormModalOpen(true); }} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Editar"><EditIcon className="h-5 w-5"/></button>
                                                <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Excluir"><DeleteIcon className="h-5 w-5"/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredItems.map(item => (
                            <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    {item.imageUrls.length > 0 ? (
                                        <img src={item.imageUrls[0]} alt={item.name} className="h-14 w-14 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-600" />
                                    ) : (
                                        <div className="h-14 w-14 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                            <PharmacyLogoIcon className="h-6 w-6"/>
                                        </div>
                                    )}
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white">{item.name}</div>
                                        <div className="text-xs text-slate-500 font-medium">
                                            {formatPrice(item.price, business.country)} • {item.quantity} un
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => { setSelectedItemForStock(item); setIsStockModalOpen(true); }} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><MoreVerticalIcon className="h-5 w-5"/></button>
                                    <button onClick={() => { setEditingItem(item); setIsFormModalOpen(true); }} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full"><EditIcon className="h-5 w-5"/></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"><DeleteIcon className="h-5 w-5"/></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4">
                        {filteredItems.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <p>Nenhum item encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'appointments' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {appointments.map(apt => (
                        <div key={apt.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                            <div className="mb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white">{apt.serviceName}</h4>
                                    <span className={`px-2 py-1 text-xs font-bold uppercase rounded-md ${
                                        apt.status === 'confirmado' ? 'bg-green-100 text-green-700' : 
                                        apt.status === 'pendente' ? 'bg-amber-100 text-amber-700' : 
                                        'bg-slate-100 text-slate-600'
                                    }`}>
                                        {apt.status}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                    <p className="flex items-center gap-2"><span className="text-slate-400">Cliente:</span> {apt.customerName}</p>
                                    <p className="flex items-center gap-2"><span className="text-slate-400">Contato:</span> {apt.customerContact}</p>
                                    <p className="flex items-center gap-2"><span className="text-slate-400">Quando:</span> {new Date(apt.date).toLocaleDateString()} às {apt.time}</p>
                                </div>
                            </div>
                            
                            {apt.status !== 'concluido' && (
                                <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                                    {apt.status === 'pendente' && (
                                        <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'confirmado')} className="flex-1 bg-green-50 text-green-700 hover:bg-green-100 py-2 rounded-lg text-sm font-bold transition-colors">Confirmar</button>
                                    )}
                                    {apt.status === 'confirmado' && (
                                        <button onClick={() => handleUpdateAppointmentStatus(apt.id, 'concluido')} className="flex-1 bg-primary-50 text-primary-700 hover:bg-primary-100 py-2 rounded-lg text-sm font-bold transition-colors">Concluir</button>
                                    )}
                                    {/* Can cancel anytime if needed, but keeping simple as requested */}
                                </div>
                            )}
                        </div>
                    ))}
                    {appointments.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Nenhum agendamento recebido.</p>
                        </div>
                    )}
                </div>
            )}

            {isFormModalOpen && <ItemFormModal item={editingItem} onClose={() => setIsFormModalOpen(false)} onSave={handleSaveItem} business={business} />}
            {isStockModalOpen && selectedItemForStock && <StockMovementModal item={selectedItemForStock} onClose={() => setIsStockModalOpen(false)} onSuccess={() => { setIsStockModalOpen(false); fetchData(); }} />}
        </div>
    );
};

export default DashboardPage;
