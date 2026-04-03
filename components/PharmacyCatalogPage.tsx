
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Business, CatalogItem } from '../types';
import * as api from '../services/api';
import { SearchIcon, ImageIcon, PharmacyLogoIcon, HeartIcon, PlusCircleIcon, CalendarIcon } from './common/icons';
import { formatPrice } from '../utils/currency';
import { ImageGallery } from './common/ImageGallery';
import { AppContext } from '../contexts/AppContext';

interface ItemCardProps {
    item: CatalogItem;
    business: Business;
    onImageClick: (images: string[], startIndex: number) => void;
    onSchedule?: (item: CatalogItem) => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ item, business, onImageClick, onSchedule }) => {
    const { favoriteIds, currentUser, refreshFavorites, showNotification } = useContext(AppContext);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(item.likesCount || 0);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setIsLiked(favoriteIds.items.has(item.id));
    }, [favoriteIds, item.id]);

    const toggleLike = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!currentUser) {
            showNotification('Faça login para salvar favoritos!', 'error');
            return;
        }

        if (currentUser.id === business.ownerId) {
            showNotification('Você não pode curtir seu próprio item!', 'error');
            return;
        }
        
        const newState = !isLiked;
        setIsLiked(newState);
        setLikesCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));

        try {
            await api.toggleFavorite(currentUser.id, 'item', item.id);
            await refreshFavorites();
        } catch (e) {
            setIsLiked(!newState); 
            setLikesCount(prev => newState ? Math.max(0, prev - 1) : prev + 1);
        }
    };

    const handleScheduleClick = () => {
        if (!currentUser) {
            showNotification('Faça login para agendar este serviço!', 'error');
            return;
        }
        if (currentUser.id === business.ownerId) {
            showNotification('Você não pode agendar um serviço no seu próprio negócio.', 'error');
            return;
        }
        if (onSchedule) {
            onSchedule(item);
        }
    };

    const isBusinessOwner = currentUser?.id === business.ownerId;

    return (
        <div className={`group bg-white dark:bg-slate-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700/50 overflow-hidden flex flex-col h-full relative ${isExpanded ? 'row-span-2' : ''}`}>
            {/* Image Area */}
            <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700/50 cursor-pointer" onClick={() => item.imageUrls.length > 0 && onImageClick(item.imageUrls, 0)}>
                {item.imageUrls.length > 0 ? (
                    <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center flex-col gap-2 text-slate-300 dark:text-slate-500">
                        <PharmacyLogoIcon className="h-12 w-12" />
                        <span className="text-xs font-medium uppercase tracking-widest">Sem Imagem</span>
                    </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {item.quantity > 0 && (
                     <div className="absolute top-3 left-3 bg-green-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg z-10">
                        {item.quantity} vagas/un
                    </div>
                )}
                
                <button 
                    onClick={toggleLike}
                    className="absolute top-3 right-3 p-1 rounded-full transition-transform active:scale-90 z-20 focus:outline-none flex flex-col items-center gap-0.5"
                    title={isLiked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                >
                     <div className="relative">
                         <HeartIcon 
                            className={`h-7 w-7 drop-shadow-md transition-all duration-300 ${
                                isLiked 
                                ? 'fill-red-500 text-red-500 scale-110' 
                                : 'text-white hover:text-red-200 stroke-[1.5px]'
                            }`} 
                         />
                     </div>
                     <span className="text-[10px] font-bold text-white drop-shadow-md bg-black/20 px-1.5 rounded-full backdrop-blur-sm min-w-[1.5rem]">
                         {likesCount}
                     </span>
                </button>
                
                {item.imageUrls.length > 1 && (
                     <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 z-10">
                        <ImageIcon className="h-3 w-3" />
                        <span>{item.imageUrls.length}</span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="p-5 flex flex-col flex-grow relative">
                 <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-tight line-clamp-2 group-hover:text-primary-600 transition-colors pr-8">{item.name}</h3>
                 </div>
                 
                 <div className="mb-4 relative">
                     <p className={`text-sm text-slate-500 dark:text-slate-400 leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                         {item.description}
                     </p>
                     <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`absolute -top-1 right-0 p-1 text-slate-400 hover:text-primary-600 transition-colors ${isExpanded ? 'rotate-45' : ''}`}
                        title={isExpanded ? "Ver menos" : "Ver descrição completa"}
                     >
                         <PlusCircleIcon className="h-6 w-6" />
                     </button>
                 </div>
                 
                 <div className="mt-auto space-y-3">
                    <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                        <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                            {formatPrice(item.price, business.country)}
                        </div>
                        {onSchedule && (
                            <button 
                                onClick={handleScheduleClick}
                                disabled={isBusinessOwner}
                                className={`rounded-full px-4 py-2 shadow-lg transform active:scale-95 transition-all flex items-center gap-2 text-sm font-bold ${isBusinessOwner ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-500/30'}`}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span>{isBusinessOwner ? 'Seu Serviço' : 'Agendar'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

interface PharmacyCatalogPageProps {
    business: Business;
    onBack?: () => void;
    isEmbedded?: boolean;
    onScheduleItem?: (item: CatalogItem) => void;
}

const PharmacyCatalogPage: React.FC<PharmacyCatalogPageProps> = ({ business, onBack, isEmbedded = false, onScheduleItem }) => {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [tagFilter, setTagFilter] = useState('');
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            setLoading(true);
            try {
                const fetchedItems = await api.getItemsByBusinessId(business.id);
                setItems(fetchedItems || []);
            } catch (e) {
                setItems([]);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [business.id]);
    
    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        items.forEach(item => item.tags.forEach(t => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [items]);

    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = tagFilter ? item.tags.includes(tagFilter) : true;
            return matchesSearch && matchesTag;
        });
    }, [items, searchTerm, tagFilter]);

    const handleImageClick = (images: string[], startIndex: number) => {
        setGalleryImages(images);
        setIsGalleryOpen(true);
    };

    return (
        <div className={`${!isEmbedded ? 'container mx-auto px-4 py-8' : ''} animate-fadeIn`}>
             {isGalleryOpen && <ImageGallery images={galleryImages} onClose={() => setIsGalleryOpen(false)} />}
            
            {!isEmbedded && (
                <div className="flex items-center gap-4 mb-8">
                    {onBack && (
                        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-300">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Catálogo & Serviços</h2>
                        <p className="text-slate-500 dark:text-slate-400">Explore o que a <span className="font-semibold text-primary-600">{business.name}</span> tem a oferecer.</p>
                    </div>
                </div>
            )}

            <div className={`z-30 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8 flex flex-col md:flex-row gap-4 items-center ${!isEmbedded ? 'sticky top-20' : ''}`}>
                <div className="relative flex-grow w-full md:w-auto">
                    <input
                        type="text"
                        placeholder="Buscar produto ou serviço..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                    />
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchIcon className="h-5 w-5 text-slate-400" />
                    </div>
                </div>
                
                {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        <button 
                            onClick={() => setTagFilter('')}
                            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${!tagFilter ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                        >
                            Todos
                        </button>
                        {allTags.map(tag => (
                             <button 
                                key={tag}
                                onClick={() => setTagFilter(tag === tagFilter ? '' : tag)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${tag === tagFilter ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'}`}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {loading ? (
                 <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                 </div>
            ) : filteredItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                    {filteredItems.map(item => (
                        <ItemCard 
                            key={item.id} 
                            item={item} 
                            business={business} 
                            onImageClick={handleImageClick} 
                            onSchedule={onScheduleItem} 
                        />
                    ))}
                </div>
            ) : (
                 <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="text-5xl mb-4 opacity-50">📦</div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Nenhum item encontrado</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Tente limpar os filtros ou busque por outro termo.</p>
                </div>
            )}
        </div>
    );
};
export { ItemCard };
export default PharmacyCatalogPage;
