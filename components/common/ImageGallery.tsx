import React, { useState, useEffect } from 'react';
import { CloseIcon } from './icons';

export const ImageGallery: React.FC<{ images: string[]; onClose: () => void; initialIndex?: number }> = ({ images, onClose, initialIndex = 0 }) => {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isZoomed, setIsZoomed] = useState(false);

    const nextImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }
    const prevImage = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }
    
    useEffect(() => {
        setIsZoomed(false);
    }, [currentIndex]);
    
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [images.length]);

    if (!images || images.length === 0) {
        return null;
    }

    const handleDoubleClick = () => {
        setIsZoomed(prev => !prev);
    };


    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-50" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 text-white z-50 p-2 bg-black bg-opacity-30 rounded-full hover:bg-opacity-50" aria-label="Fechar galeria">
                <CloseIcon className="h-6 w-6"/>
            </button>

            <div className="relative w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                {images.length > 1 && (
                    <>
                        <button onClick={prevImage} className="absolute left-2 sm:left-4 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 z-50 text-2xl" aria-label="Imagem anterior">&#10094;</button>
                        <button onClick={nextImage} className="absolute right-2 sm:right-4 p-2 bg-black bg-opacity-30 rounded-full text-white hover:bg-opacity-50 z-50 text-2xl" aria-label="Próxima imagem">&#10095;</button>
                    </>
                )}
                
                <div className="w-full h-full flex items-center justify-center overflow-hidden">
                    <img 
                        src={images[currentIndex]} 
                        alt={`Imagem ${currentIndex + 1} de ${images.length}`} 
                        className={`max-h-full max-w-full object-contain p-1 sm:p-2 select-none transition-transform duration-300 ease-in-out ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 cursor-zoom-in'}`}
                        onDoubleClick={handleDoubleClick}
                    />
                </div>
                
                <div className="absolute bottom-4 text-white bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">{currentIndex + 1} / {images.length}</div>
            </div>
        </div>
    );
};