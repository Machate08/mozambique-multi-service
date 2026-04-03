
import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Post, Business } from '../types';
import * as api from '../services/api';
import PostCard from './PostCard';
import { AppContext } from '../contexts/AppContext';
import { ImageGallery } from './common/ImageGallery';

const HomePage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const { searchTerm, categoryFilter, locationFilter } = useContext(AppContext);
    const [galleryImages, setGalleryImages] = useState<string[]>([]);
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const [fetchedPosts, fetchedBusinesses] = await Promise.all([
                api.getPosts(),
                api.getBusinesses()
            ]);
            setPosts(fetchedPosts);
            setBusinesses(fetchedBusinesses);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredPosts = useMemo(() => {
        let filtered = posts;

        // Create a map for fast lookup
        const bizMap = new Map<string, Business>(businesses.map(b => [b.id, b] as [string, Business]));

        // Filter by Category
        if (categoryFilter) {
            filtered = filtered.filter(p => {
                const b = bizMap.get(p.businessId);
                return b && b.category === categoryFilter;
            });
        }

        // Filter by Location
        if (locationFilter.value.trim()) {
            const locValue = locationFilter.value.toLowerCase();
            filtered = filtered.filter(p => {
                const b = bizMap.get(p.businessId);
                if (!b) return false;
                
                if (locationFilter.type === 'Cidade') {
                    return b.city.toLowerCase().includes(locValue);
                }
                if (locationFilter.type === 'Bairro') {
                    return b.neighborhood.toLowerCase().includes(locValue);
                }
                if (locationFilter.type === 'Província') {
                    return (b.province || '').toLowerCase().includes(locValue);
                }
                return false;
            });
        }

        // Filter by Search Term
        if (searchTerm.trim()) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(post => {
                const b = bizMap.get(post.businessId);
                return (
                    (b && (b.name.toLowerCase().includes(lowercasedTerm) || 
                           b.city.toLowerCase().includes(lowercasedTerm) || 
                           b.neighborhood.toLowerCase().includes(lowercasedTerm))) ||
                    post.title.toLowerCase().includes(lowercasedTerm) ||
                    post.description.toLowerCase().includes(lowercasedTerm)
                );
            });
        }

        return filtered;
    }, [searchTerm, categoryFilter, locationFilter, posts, businesses]);
    
    const handleImageClick = (images: string[], startIndex: number) => {
        setGalleryImages(images);
        setGalleryInitialIndex(startIndex);
        setIsGalleryOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                <p className="mt-4 text-slate-500 font-medium">Carregando experiências...</p>
            </div>
        );
    }

    return (
        <div>
            {/* Hero Section (Only show when not searching) */}
            {!searchTerm && !categoryFilter && !locationFilter.value && (
                <div className="relative bg-slate-900 text-white py-20 sm:py-32 overflow-hidden mb-12">
                     {/* Updated Image: Geometric description of Mozambique flag */}
                     <img 
                        src="https://image.pollinations.ai/prompt/Three%20young%20black%20Mozambican%20professionals%20under%2030%20years%20old%20standing%20proudly.%20Left%3A%20Male%20Construction%20Engineer%20with%20helmet.%20Center%3A%20Male%20CEO%20in%20suit.%20Right%3A%20Female%20Doctor%20in%20white%20coat.%20Background%20is%20the%20flag%20of%20Mozambique%3A%20Horizontal%20stripes%20of%20Green%20(top)%2C%20Black%20(middle)%2C%20Yellow%20(bottom)%2C%20separated%20by%20white%20lines%2C%20with%20a%20Red%20Triangle%20on%20the%20left.%20Photorealistic%2C%208k%2C%20cinematic%20lighting?width=1280&height=720&nologo=true&seed=MOZ_FLAG_FINAL_V3"
                        alt="Equipe de Jovens Profissionais Moçambicanos"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                     />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/80 to-slate-900/30"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-4 drop-shadow-lg">
                            Descubra o melhor <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">ao seu redor.</span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-200 max-w-2xl mb-8 drop-shadow-md font-medium">
                            Conecte-se com farmácias, clínicas, técnicos e serviços locais. 
                            Tudo o que você precisa, em um só lugar.
                        </p>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 pb-12">
                <div className="flex flex-col items-center mb-10">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        {categoryFilter || locationFilter.value ? (
                            <>
                                Explorando
                                {categoryFilter && <span className="text-primary-600 ml-2">{categoryFilter}</span>}
                                {locationFilter.value && <span className="text-slate-500 dark:text-slate-400 ml-2">em {locationFilter.value}</span>}
                            </>
                        ) : 'Feed de Novidades'}
                    </h2>
                    <div className="h-1 w-20 bg-primary-500 rounded-full mt-2"></div>
                </div>

                {filteredPosts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                        {filteredPosts.map(post => (
                            <PostCard key={post.id} post={post} onImageClick={handleImageClick} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-slate-800 dark:text-white">Nenhum resultado encontrado</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Tente ajustar sua busca ou filtro.</p>
                    </div>
                )}
                
                {isGalleryOpen && <ImageGallery images={galleryImages} onClose={() => setIsGalleryOpen(false)} initialIndex={galleryInitialIndex} />}
            </div>
        </div>
    );
};

export default HomePage;
