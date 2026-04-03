
import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { EyeOpenIcon, EyeSlashIcon, PharmacyLogoIcon, GoogleIcon } from './common/icons';
import * as api from '../services/api';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { login, loginWithGoogle, navigate, isLoading } = useContext(AppContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        try {
            await login(email, password);
        } catch (err: any) {
            const errorMessage = api.getErrorMessage(err, 'Credenciais inválidas.');
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4 bg-slate-50 dark:bg-slate-900">
            <div className="w-full max-w-md">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700">
                    <div className="text-center mb-8">
                        <div className="bg-primary-500 text-white w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
                            <PharmacyLogoIcon className="h-8 w-8" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Bem-vindo de volta</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Acesse para gerenciar seu negócio ou explorar.</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && <div className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-100 dark:border-red-900/50">{error}</div>}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="seu@email.com"
                            />
                        </div>
                        <div className="relative">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Senha</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                placeholder="••••••••"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-9 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeOpenIcon className="h-5 w-5" />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Ou continue com</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loginWithGoogle()}
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all flex items-center justify-center gap-3 shadow-sm"
                        >
                            <GoogleIcon className="h-5 w-5" />
                            Google
                        </button>
                    </form>
                    <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                        Não tem uma conta?{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('register'); }} className="font-bold text-primary-600 hover:text-primary-700 hover:underline">
                            Criar conta
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
