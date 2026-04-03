
import React, { useState, useEffect, useContext } from 'react';
import { Post, Business, Comment } from '../types';
import * as api from '../services/api';
import { AppContext } from '../contexts/AppContext';
import { EditIcon, DeleteIcon, ImageIcon, ChatIcon, HeartIcon } from './common/icons';

interface PostCardProps {
    post: Post;
    isOwner?: boolean;
    onEdit?: (post: Post) => void;
    onDelete?: (postId: string) => void;
    onImageClick?: (images: string[], startIndex: number) => void;
}

const CommentsModal: React.FC<{ post: Post; onClose: () => void; isOwner: boolean }> = ({ post, onClose, isOwner }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [loading, setLoading] = useState(true);
    const { currentUser, showNotification } = useContext(AppContext);

    useEffect(() => {
        loadComments();
    }, [post.id]);

    const loadComments = async () => {
        setLoading(true);
        const data = await api.getComments(post.id);
        setComments(data);
        setLoading(false);
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        
        try {
            let added: Comment;
            if (replyingTo) {
                added = await api.replyToComment(post.id, currentUser.id, newComment, replyingTo.id, isOwner, post.businessId);
            } else {
                added = await api.addComment(post.id, currentUser.id, newComment);
            }
            setComments(prev => [...prev, added]);
            setNewComment('');
            setReplyingTo(null);
        } catch (error) {
            showNotification('Erro ao comentar', 'error');
        }
    };

    const renderComments = (parentId: string | null = null, depth = 0) => {
        return comments
            .filter(c => (parentId === null ? !c.parentCommentId : c.parentCommentId === parentId))
            .map(comment => (
                <div key={comment.id} className={`flex flex-col ${depth > 0 ? 'ml-8 mt-2 border-l-2 border-slate-100 dark:border-slate-700 pl-3' : 'mt-4'}`}>
                    <div className="flex gap-3">
                        <div className="shrink-0 h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                             {comment.userAvatar ? <img src={comment.userAvatar} className="h-full w-full object-cover" referrerPolicy="no-referrer"/> : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-slate-500">{comment.userName[0]}</div>}
                        </div>
                        <div className="flex-1">
                            <div className={`rounded-2xl rounded-tl-none px-4 py-2 ${comment.isBusinessReply ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800' : 'bg-slate-100 dark:bg-slate-700/50'}`}>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{comment.userName}</p>
                                    {comment.isBusinessReply && <span className="text-[9px] bg-primary-500 text-white px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">Proprietário</span>}
                                </div>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1 ml-2">
                                <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                {isOwner && !comment.parentCommentId && (
                                    <button 
                                        onClick={() => setReplyingTo(comment)}
                                        className="text-[10px] font-bold text-primary-600 hover:underline"
                                    >
                                        Responder
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    {renderComments(comment.id, depth + 1)}
                </div>
            ));
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-4 h-[500px] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 dark:text-white">Comentários</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-slate-800 dark:text-slate-400">&times;</button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex justify-center p-4"><div className="animate-spin h-6 w-6 border-b-2 border-primary-500 rounded-full"></div></div>
                    ) : comments.length > 0 ? (
                        renderComments()
                    ) : (
                        <p className="text-center text-slate-400 text-sm mt-10">Seja o primeiro a comentar!</p>
                    )}
                </div>

                {replyingTo && (
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <p className="text-xs text-slate-500">Respondendo a <span className="font-bold">{replyingTo.userName}</span></p>
                        <button onClick={() => setReplyingTo(null)} className="text-xs text-red-500 font-bold">Cancelar</button>
                    </div>
                )}

                <form onSubmit={handleSendComment} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                    <input 
                        type="text" 
                        value={newComment}
                        onChange={e => setNewComment(e.target.value)}
                        placeholder={currentUser ? (replyingTo ? "Escreva uma resposta..." : "Escreva um comentário...") : "Faça login para comentar"}
                        disabled={!currentUser}
                        className="flex-grow px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 text-sm"
                    />
                    <button type="submit" disabled={!newComment.trim() || !currentUser} className="text-primary-600 disabled:opacity-50 font-bold px-2">Enviar</button>
                </form>
            </div>
        </div>
    );
};

const PostCard: React.FC<PostCardProps> = ({ post, isOwner = false, onEdit, onDelete, onImageClick }) => {
    const [business, setBusiness] = useState<Business | null>(null);
    const [showComments, setShowComments] = useState(false);
    const { navigate, favoriteIds, currentUser, refreshFavorites, showNotification } = useContext(AppContext);

    // Initial check for like status based on context
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    
    useEffect(() => {
        setIsLiked(favoriteIds.posts.has(post.id));
    }, [favoriteIds, post.id]);

    useEffect(() => {
        const fetchBusiness = async () => {
            const fetchedBiz = await api.getBusinessById(post.businessId);
            if (fetchedBiz) {
                setBusiness(fetchedBiz);
            }
        };
        fetchBusiness();
    }, [post.businessId]);

    const toggleLike = async () => {
        if (!currentUser) {
            showNotification('Faça login para curtir!', 'error');
            return;
        }

        if (currentUser.id === business.ownerId) {
            showNotification('Você não pode curtir seu próprio anúncio!', 'error');
            return;
        }

        // Optimistic update
        const newState = !isLiked;
        setIsLiked(newState);
        setLikesCount(prev => newState ? prev + 1 : Math.max(0, prev - 1));

        try {
            await api.toggleFavorite(currentUser.id, 'post', post.id);
            await refreshFavorites();
        } catch (e) {
            // revert on error
            setIsLiked(!newState); 
            setLikesCount(prev => newState ? Math.max(0, prev - 1) : prev + 1);
        }
    };
    
    const openComments = () => {
        if (!currentUser) {
            showNotification('Faça login para ver ou adicionar comentários!', 'error');
            return;
        }
        setShowComments(true);
    }

    if (!business) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 animate-pulse shadow-sm h-64">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    </div>
                </div>
                <div className="h-32 bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
            </div>
        );
    }

    const handleProfileClick = () => {
        navigate('businessProfile', { businessId: business.id });
    };

    return (
        <>
        {showComments && <CommentsModal post={post} onClose={() => setShowComments(false)} isOwner={isOwner} />}
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className="p-5 flex-grow">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={handleProfileClick}>
                        <img src={business.profilePicUrl} alt={business.name} className="h-10 w-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-primary-500 transition-all" referrerPolicy="no-referrer" />
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm group-hover:text-primary-600 transition-colors">{business.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{business.city} • {business.category}</p>
                        </div>
                    </div>
                     {isOwner && onEdit && onDelete && (
                        <div className="flex items-center gap-1 opacity-100 transition-opacity">
                            <button onClick={() => onEdit(post)} className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <EditIcon className="h-4 w-4" />
                            </button>
                            <button onClick={() => onDelete(post.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full transition-colors">
                                <DeleteIcon className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="mb-4">
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2 leading-tight">{post.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line line-clamp-4">{post.description}</p>
                </div>

                {/* Images */}
                {post.imageUrls && post.imageUrls.length > 0 && (
                    <div className="relative group overflow-hidden rounded-xl mt-auto">
                        <img 
                            src={post.imageUrls[0]} 
                            alt={post.title} 
                            className="w-full h-48 object-cover transform group-hover:scale-105 transition-transform duration-500 cursor-pointer" 
                            onClick={() => onImageClick && onImageClick(post.imageUrls, 0)}
                            referrerPolicy="no-referrer"
                        />
                        {post.imageUrls.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                <span>+{post.imageUrls.length - 1}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </div>
                )}
            </div>
            
            {/* Actions Footer */}
             <div className="px-5 py-3 border-t border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                 <div className="flex gap-4">
                     <button onClick={toggleLike} className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-red-500'}`}>
                         <HeartIcon className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                         <span>{likesCount}</span>
                     </button>
                     <button onClick={openComments} className="flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary-600 transition-colors">
                         <ChatIcon className="h-5 w-5" />
                         <span>{post.commentsCount || 0}</span>
                     </button>
                 </div>
                <div className="text-slate-400">
                    {new Date(post.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </div>
             </div>
        </div>
        </>
    );
};

export default PostCard;