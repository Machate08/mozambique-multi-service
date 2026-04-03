
import React, { useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import { PharmacyLogoIcon } from './common/icons';

const Footer: React.FC = () => {
    const { navigate, currentUser } = useContext(AppContext);

    return (
        <footer className="bg-gray-800 dark:bg-gray-900 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-8">
                    <div>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <PharmacyLogoIcon className="h-8 w-8 text-blue-400" />
                            <h2 className="text-xl font-bold">PSMZ</h2>
                        </div>
                        <p className="text-gray-400 text-sm">Plataforma de Serviços de Moçambique.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-8">
                        <div>
                            <h3 className="font-semibold mb-2">Links Rápidos</h3>
                            <ul className="space-y-1 text-gray-300">
                                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('home'); }} className="hover:text-blue-400">Home</a></li>
                                <li>
                                    <a 
                                        href="#" 
                                        onClick={(e) => { 
                                            e.preventDefault(); 
                                            if (currentUser) {
                                                navigate('settings', { openNewService: true });
                                            } else {
                                                navigate('login');
                                            }
                                        }} 
                                        className="hover:text-blue-400"
                                    >
                                        Cadastrar Serviço
                                    </a>
                                </li>
                                <li><a href="#" onClick={(e) => { e.preventDefault(); navigate('favorites'); }} className="hover:text-blue-400">Meus Favoritos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Contato</h3>
                            <ul className="space-y-1 text-gray-300">
                                <li><a href="#" className="hover:text-blue-400">Fale Conosco</a></li>
                                <li><a href="#" className="hover:text-blue-400">Suporte</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-4 border-t border-gray-700 text-center text-gray-500 text-sm">
                    <p>&copy; {new Date().getFullYear()} PSMZ. Todos os direitos reservados.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
