
export interface User {
  id: string;
  name: string;
  email: string;
  businessId?: string; // Primary/Last accessed business
  businessName?: string;
  profilePicUrl?: string;
}

export type BusinessCategory = 'Saúde' | 'Tecnologia' | 'Técnico Profissional' | 'Diversos';

export interface Business {
  id: string;
  name: string;
  category: BusinessCategory;
  profilePicUrl: string;
  coverImageUrl?: string; 
  country: string;
  province: string; // Added province
  city: string;
  neighborhood: string;
  ownerId: string;
  openingHours: string;
  openDays: string;
  contact: string;
  description: string;
}

export interface Post {
  id: string;
  businessId: string;
  imageUrls: string[];
  title: string;
  description: string;
  createdAt: string;
  // Campos virtuais para UI
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  parentCommentId?: string;
  isBusinessReply?: boolean;
  repliesCount?: number;
}

export interface CatalogItem {
  id: string;
  businessId: string;
  name: string;
  description: string;
  imageUrls: string[];
  tags: string[]; 
  quantity: number; 
  price: number;
  // Campos virtuais para UI
  isLiked?: boolean;
  likesCount?: number;
}

export interface StockMovement {
  id: string;
  itemId: string;
  businessId: string;
  type: 'entrada' | 'saida';
  quantity: number;
  created_at: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  userId?: string; // ID do usuário que agendou
  customerName: string;
  customerContact: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'pendente' | 'confirmado' | 'concluido';
}

export interface Message {
  id: string;
  businessId: string;
  userId: string;
  senderType: 'user' | 'business';
  content: string;
  createdAt: string;
  isRead: boolean;
}

export interface ChatConversation {
  id: string; // businessId or userId depending on view
  name: string;
  avatarUrl: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'business' | 'user'; // 'business' means I am a user talking to a business
}

export interface ViewState {
  page: 'home' | 'login' | 'register' | 'businessProfile' | 'dashboard' | 'favorites' | 'clientAppointments' | 'settings' | 'chat';
  props?: any;
}
