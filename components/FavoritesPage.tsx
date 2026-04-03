
import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../contexts/AppContext';
import * as api from '../services/api';
import { Post, CatalogItem, Business } from '../types';
import PostCard from './PostCard';
import { ItemCard } from './PharmacyCatalogPage'; // Using the exported component
import { ImageGallery } from './common/ImageGallery';

const FavoritesPage: React.FC = () => {
    const { currentUser, navigate, showNotification } = useContext(AppContext);
    const [posts, setPosts] = useState<Post[]>([]);
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [businesses, setBusinesses] = useState<Record<string, Business>>({});
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'items'>('posts');
    
    // Gallery
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryIndex, setGalleryIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    useEffect(() => {
        if (!currentUser) {
            navigate('login');
            return;
        }
        loadFavorites();
    }, [currentUser]);

    const loadFavorites = async () => {
        if (!currentUser) return;
        setLoading(true);
        
        try {
            const [favPosts, favItems, allBiz] = await Promise.all([
                api.getFavoritePosts(currentUser.id),
                api.getFavoriteItems(currentUser.id),
                api.getBusinesses()
            ]);

            // Map businesses for easy access by ID
            const bizMap: Record<string, Business> = {};
            allBiz.forEach(b => bizMap[b.id] = b);
            
            setPosts(favPosts);
            setItems(favItems);
            setBusinesses(bizMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }
    
    const handleImageClick = (images: string[], index: number) => {
        setGalleryImages(images);
        setGalleryIndex(index);
        setIsGalleryOpen(true);
    }
    
    const handleScheduleItem = (item: CatalogItem) => {
        // Navigate to business profile AND ask to open schedule modal
        navigate('businessProfile', { 
            businessId: item.businessId,
            openSchedule: true,
            serviceName: item.name
        });
        showNotification("Redirecionando para agendamento...", "success");
    };

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {isGalleryOpen && <ImageGallery images={galleryImages} onClose={() => setIsGalleryOpen(false)} initialIndex={galleryIndex} />}
            
            <div className="text-center mb-10">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Seus Favoritos</h2>
                <p className="text-slate-500 dark:text-slate-400">Tudo que você amou em um só lugar.</p>
            </div>

            <div className="flex justify-center border-b border-slate-200 dark:border-slate-700 mb-8">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={`px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'posts' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Anúncios
                </button>
                <button
                    onClick={() => setActiveTab('items')}
                    className={`px-8 py-3 text-sm font-bold uppercase tracking-wide border-b-2 transition-all ${activeTab === 'items' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
                >
                    Catálogo
                </button>
            </div>

            {activeTab === 'posts' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {posts.length > 0 ? (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} onImageClick={handleImageClick} />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            <p>Você ainda não curtiu nenhum anúncio.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'items' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                    {items.length > 0 ? (
                        items.map(item => (
                            businesses[item.businessId] ? (
                                <ItemCard 
                                    key={item.id} 
                                    item={item} 
                                    business={businesses[item.businessId]} 
                                    onImageClick={handleImageClick}
                                    onSchedule={handleScheduleItem}
                                />
                            ) : null
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-slate-400">
                            <p>Você ainda não favoritou nenhum item do catálogo.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
