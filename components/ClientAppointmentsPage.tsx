
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import * as api from '../services/api';
import { Appointment } from '../types';
import { EditIcon, DeleteIcon, CalendarIcon } from './common/icons';
import ConfirmModal from './common/ConfirmModal';

const ClientAppointmentsPage: React.FC = () => {
    const { currentUser, navigate, showNotification } = useContext(AppContext);
    const [appointments, setAppointments] = useState<(Appointment & { businessName?: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'todos' | 'confirmado' | 'concluido' | 'pendente'>('todos');
    
    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingApt, setEditingApt] = useState<Appointment | null>(null);
    const [editForm, setEditForm] = useState({ date: '', time: '', contact: '' });
    
    // Delete Modal State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [aptToDelete, setAptToDelete] = useState<string | null>(null);

    useEffect(() => {
        if (!currentUser) {
            navigate('login');
            return;
        }
        loadAppointments();
    }, [currentUser]);

    const loadAppointments = async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const data = await api.getUserAppointments(currentUser.id);
            setAppointments(data);
        } catch (error: any) {
            showNotification(api.getErrorMessage(error, "Erro ao carregar agendamentos"), "error");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (apt: Appointment) => {
        setEditingApt(apt);
        setEditForm({ date: apt.date, time: apt.time, contact: apt.customerContact });
        setIsEditModalOpen(true);
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingApt) return;
        try {
            await api.updateAppointment(editingApt.id, {
                date: editForm.date,
                time: editForm.time,
                customerContact: editForm.contact
            });
            showNotification("Agendamento atualizado!", "success");
            setIsEditModalOpen(false);
            loadAppointments();
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), "error");
        }
    };

    const handleDeleteClick = (id: string) => {
        setAptToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!aptToDelete) return;
        try {
            await api.deleteAppointment(aptToDelete);
            showNotification("Agendamento cancelado.", "success");
            loadAppointments();
        } catch (error: any) {
            showNotification(api.getErrorMessage(error), "error");
        } finally {
            setIsConfirmOpen(false);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        if (filterStatus === 'todos') return true;
        return a.status === filterStatus;
    });

    if (loading) return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <ConfirmModal 
                isOpen={isConfirmOpen} 
                onClose={() => setIsConfirmOpen(false)} 
                onConfirm={handleConfirmDelete} 
                title="Cancelar Agendamento" 
                message="Tem certeza que deseja cancelar este serviço?" 
            />

            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setIsEditModalOpen(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 text-slate-800 dark:text-white">Editar Agendamento</h3>
                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold mb-1">Data</label>
                                <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Hora</label>
                                <input type="time" value={editForm.time} onChange={e => setEditForm({...editForm, time: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-1">Contato</label>
                                <input type="text" value={editForm.contact} onChange={e => setEditForm({...editForm, contact: e.target.value})} required className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-600 dark:bg-slate-700"/>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700">Cancelar</button>
                                <button type="submit" className="px-4 py-2 rounded-xl bg-primary-600 text-white">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Meus Agendamentos</h2>
                <p className="text-slate-500 dark:text-slate-400">Acompanhe o status dos seus serviços.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-8">
                {['todos', 'confirmado', 'concluido', 'pendente'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-4 py-2 rounded-full text-sm font-bold capitalize transition-all ${
                            filterStatus === status 
                            ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/30' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(apt => (
                        <div key={apt.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-grow">
                                <div className="flex items-center gap-2 mb-1">
                                    <button 
                                        onClick={() => navigate('businessProfile', { businessId: apt.businessId })}
                                        className="font-bold text-lg text-slate-800 dark:text-white hover:text-primary-600 hover:underline text-left"
                                        title="Ver perfil do serviço"
                                    >
                                        {apt.serviceName}
                                    </button>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                                        apt.status === 'confirmado' ? 'bg-green-100 text-green-700' :
                                        apt.status === 'concluido' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                        {apt.status}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-primary-600 mb-2">{apt.businessName || 'Serviço'}</p>
                                <div className="text-sm text-slate-500 dark:text-slate-400 flex flex-wrap gap-4">
                                    <span className="flex items-center gap-1"><CalendarIcon className="h-4 w-4"/> {new Date(apt.date).toLocaleDateString()} às {apt.time}</span>
                                    <span>Contato: {apt.customerContact}</span>
                                </div>
                            </div>

                            {apt.status === 'pendente' && (
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => handleEditClick(apt)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm">
                                        <EditIcon className="h-4 w-4"/> Editar
                                    </button>
                                    <button onClick={() => handleDeleteClick(apt.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm">
                                        <DeleteIcon className="h-4 w-4"/> Cancelar
                                    </button>
                                </div>
                            )}
                            {apt.status === 'confirmado' && (
                                <div className="text-xs text-green-600 font-medium px-4 py-2 bg-green-50 rounded-xl">
                                    Agendamento Confirmado! Compareça no horário.
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                        <div className="text-5xl mb-4 opacity-50">📅</div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nenhum agendamento encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Você não tem serviços com o status selecionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientAppointmentsPage;