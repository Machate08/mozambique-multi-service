
import React, { useState, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { EyeOpenIcon, EyeSlashIcon, GoogleIcon } from './common/icons';
import * as api from '../services/api';

const RegisterPage: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const { register, loginWithGoogle, navigate, isLoading } = useContext(AppContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (!name || !email || !password) {
            setError('Por favor, preencha todos os campos.');
            return;
        }

        try {
            const user = await register(name, email, password);
            if (user) {
                // If registration succeeds but email confirmation is needed, the user object might exist but login could fail later
            }
        } catch (err: any) {
            console.error("Erro no registro:", err);
            const msg = api.getErrorMessage(err, 'Não foi possível criar a conta.');
            setError(msg);
        }
    };

    return (
        <div className="flex items-center justify-center py-12">
            <div className="mx-auto w-full max-w-md">
                <div className="bg-white dark:bg-gray-800 p-8 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-1">Crie sua Conta</h2>
                    <p className="text-center text-gray-500 dark:text-gray-400 mb-6">Comece a divulgar sua farmácia hoje mesmo.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="text-red-500 text-sm text-center bg-red-100 dark:bg-red-900/50 p-3 rounded-md">{error}</p>}
                        <div>
                            <label htmlFor="name"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nome de Usuário</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label htmlFor="email"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        <div className="relative">
                            <label htmlFor="password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Senha</label>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                             <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 top-6 pr-3 flex items-center text-sm leading-5"
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <EyeOpenIcon className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                        </div>
                         <div>
                            <label htmlFor="confirm-password"  className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar Senha</label>
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Criando conta...' : 'Cadastrar'}
                            </button>
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Ou use sua conta</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => loginWithGoogle()}
                            disabled={isLoading}
                            className="w-full flex justify-center items-center gap-3 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                            <GoogleIcon className="h-5 w-5" />
                            Google
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        Já tem uma conta?{' '}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('login'); }} className="font-medium text-green-600 hover:text-green-500">
                            Faça login
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
