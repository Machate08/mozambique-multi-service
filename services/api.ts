
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    updateDoc, 
    deleteDoc, 
    query, 
    where, 
    orderBy, 
    addDoc, 
    onSnapshot,
    limit,
    getDocFromServer,
    increment
} from 'firebase/firestore';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged,
    updateProfile,
    User as FirebaseUser,
    GoogleAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import { db, auth } from '../src/firebase';
import { User, Business, Post, CatalogItem, StockMovement, Appointment, Comment, Message, ChatConversation } from '../types';

// --- ERROR HANDLING ---

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getErrorMessage = (error: any, defaultMessage: string = 'Ocorreu um erro inesperado.'): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) {
        try {
            const parsed = JSON.parse(error.message);
            if (parsed.error) return parsed.error;
        } catch {
            return error.message;
        }
    }
    return defaultMessage;
};

// --- HELPERS FOR DATA MAPPING ---

const mapProfileToUser = (profile: any, authUser: FirebaseUser, business?: any): User => ({
    id: authUser.uid,
    name: profile?.name || authUser.displayName || authUser.email?.split('@')[0] || 'User',
    email: authUser.email || '',
    profilePicUrl: profile?.profilePicUrl || authUser.photoURL || '',
    businessId: business?.id,
    businessName: business?.name
});

// --- API FUNCTIONS ---

// User & Auth
export const login = async (email: string, pass: string): Promise<User | null> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, pass);
        return fetchUserData(userCredential.user);
    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error("O login com email/senha não está ativado no Firebase Console. Por favor, ative-o ou use o Google Login.");
        }
        throw new Error(getErrorMessage(error, "Credenciais inválidas ou erro no login."));
    }
}

export const loginWithGoogle = async (): Promise<User | null> => {
    try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
        
        // Check if profile exists, if not create it
        const profileDoc = await getDoc(doc(db, 'profiles', user.uid));
        if (!profileDoc.exists()) {
            const profileData = {
                id: user.uid,
                name: user.displayName || 'Usuário',
                email: user.email || '',
                profilePicUrl: user.photoURL || '',
                role: 'user'
            };
            await setDoc(doc(db, 'profiles', user.uid), profileData);
        }
        
        return fetchUserData(user);
    } catch (error: any) {
        throw new Error(getErrorMessage(error, "Erro ao fazer login com Google"));
    }
}

export const register = async (name: string, email: string, pass: string): Promise<User | null> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: name });

        const profileData = {
            id: user.uid,
            name: name,
            email: email,
            profilePicUrl: '',
            role: 'user'
        };

        await setDoc(doc(db, 'profiles', user.uid), profileData);
        return mapProfileToUser(profileData, user);
    } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
            throw new Error("O registro com email/senha não está ativado no Firebase Console. Por favor, ative-o ou use o Google Login.");
        }
        throw new Error(getErrorMessage(error, "Erro ao registrar usuário"));
    }
}

export const checkSession = (): Promise<User | null> => {
    return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userData = await fetchUserData(user);
                resolve(userData);
            } else {
                resolve(null);
            }
        });
    });
}

export const fetchUserData = async (authUser: FirebaseUser): Promise<User | null> => {
    try {
        const profileDoc = await getDoc(doc(db, 'profiles', authUser.uid));
        const profile = profileDoc.exists() ? profileDoc.data() : null;
        
        // Fetch first business for backward compatibility
        const q = query(collection(db, 'businesses'), where('ownerId', '==', authUser.uid), limit(1));
        const businessDocs = await getDocs(q);
        const business = !businessDocs.empty ? { id: businessDocs.docs[0].id, ...businessDocs.docs[0].data() } : null;
        
        return mapProfileToUser(profile, authUser, business);
    } catch (e) {
        return mapProfileToUser(null, authUser, null);
    }
}

export const logout = async () => {
    await signOut(auth);
}

export const updateUserProfile = async (userId: string, updates: { name: string; email: string; profilePicUrl?: string }) => {
    const path = `profiles/${userId}`;
    try {
        await updateDoc(doc(db, 'profiles', userId), {
            name: updates.name,
            email: updates.email,
            profilePicUrl: updates.profilePicUrl || ''
        });
        if (auth.currentUser) {
            await updateProfile(auth.currentUser, { 
                displayName: updates.name,
                photoURL: updates.profilePicUrl
            });
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
}

// Business
export const getBusinesses = async (): Promise<Business[]> => {
    const path = 'businesses';
    try {
        const querySnapshot = await getDocs(collection(db, path));
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const getUserBusinesses = async (userId: string): Promise<Business[]> => {
    const path = 'businesses';
    try {
        const q = query(collection(db, path), where('ownerId', '==', userId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const getBusinessById = async (id: string): Promise<Business | null> => {
    const path = `businesses/${id}`;
    try {
        const docSnap = await getDoc(doc(db, 'businesses', id));
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as Business;
        }
        return null;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, path);
        return null;
    }
}

export const createBusiness = async (bizData: Omit<Business, 'id' | 'ownerId' | 'profilePicUrl'>, ownerId: string): Promise<{ user: User; business: Business }> => {
    const path = 'businesses';
    try {
        const profilePicUrl = `https://avatar.iran.liara.run/username?username=${encodeURIComponent(bizData.name)}`;
        
        const newBizRef = doc(collection(db, path));
        const dbData = {
            ...bizData,
            id: newBizRef.id,
            ownerId,
            profilePicUrl,
            createdAt: new Date().toISOString()
        };

        await setDoc(newBizRef, dbData);
        
        const newBusiness = { ...dbData } as Business;
        const updatedUser = await fetchUserData(auth.currentUser!);
        if (!updatedUser) throw new Error("Não foi possível recuperar os dados do usuário");

        return { user: updatedUser, business: newBusiness };
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export const updateBusiness = async (bizData: Business): Promise<Business> => {
    const path = `businesses/${bizData.id}`;
    try {
        const { id, ...data } = bizData;
        await updateDoc(doc(db, 'businesses', id), data);
        return bizData;
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
    }
}

export const deleteBusiness = async (businessId: string) => {
    const path = `businesses/${businessId}`;
    try {
        await deleteDoc(doc(db, 'businesses', businessId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
}

// Posts
export const getPosts = async (): Promise<Post[]> => {
    const path = 'posts';
    try {
        const q = query(collection(db, path), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const posts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
        return posts;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const getPostsByBusinessId = async (bizId: string): Promise<Post[]> => {
    const path = 'posts';
    try {
        const q = query(collection(db, path), where('businessId', '==', bizId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const addPost = async (postData: Omit<Post, 'id' | 'createdAt'>): Promise<Post> => {
    const path = 'posts';
    try {
        const newPostRef = doc(collection(db, path));
        const dbData = {
            ...postData,
            id: newPostRef.id,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0
        };
        await setDoc(newPostRef, dbData);
        return dbData as Post;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export const updatePost = async (postData: Post): Promise<Post> => {
    const path = `posts/${postData.id}`;
    try {
        const { id, ...data } = postData;
        await updateDoc(doc(db, 'posts', id), data);
        return postData;
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
    }
}

export const deletePost = async (postId: string): Promise<void> => {
    const path = `posts/${postId}`;
    try {
        await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
}

// Catalog (Items) & Stock
export const getItemsByBusinessId = async (bizId: string): Promise<CatalogItem[]> => {
    const path = 'items';
    try {
        const q = query(collection(db, path), where('businessId', '==', bizId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogItem));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const getAllItemsByBusinessId = async (bizId: string): Promise<CatalogItem[]> => {
    return getItemsByBusinessId(bizId);
}

export const getStockMovementsByBusinessId = async (bizId: string): Promise<StockMovement[]> => {
    const path = 'stock_movements';
    try {
        const q = query(collection(db, path), where('businessId', '==', bizId), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockMovement));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const addItem = async (itemData: Omit<CatalogItem, 'id'>): Promise<CatalogItem> => {
    const path = 'items';
    try {
        const newItemRef = doc(collection(db, path));
        const dbData = {
            ...itemData,
            id: newItemRef.id,
            likesCount: 0
        };
        await setDoc(newItemRef, dbData);

        if (dbData.quantity > 0) {
            await addDoc(collection(db, 'stock_movements'), {
                itemId: newItemRef.id,
                businessId: dbData.businessId,
                type: 'entrada',
                quantity: dbData.quantity,
                createdAt: new Date().toISOString()
            });
        }
        return dbData as CatalogItem;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export const updateItem = async (itemData: CatalogItem): Promise<CatalogItem> => {
    const path = `items/${itemData.id}`;
    try {
        const { id, ...data } = itemData;
        await updateDoc(doc(db, 'items', id), data);
        return itemData;
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
    }
}

export const deleteItem = async (itemId: string): Promise<void> => {
    const path = `items/${itemId}`;
    try {
        const q = query(collection(db, 'stock_movements'), where('itemId', '==', itemId));
        const movements = await getDocs(q);
        for (const m of movements.docs) {
            await deleteDoc(doc(db, 'stock_movements', m.id));
        }
        await deleteDoc(doc(db, 'items', itemId));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
}

export const recordStockMovement = async (itemId: string, type: 'entrada' | 'saida', quantity: number): Promise<CatalogItem> => {
    const path = `items/${itemId}`;
    try {
        const itemDoc = await getDoc(doc(db, 'items', itemId));
        if (!itemDoc.exists()) throw new Error("Item não encontrado");
        const currentItem = itemDoc.data() as CatalogItem;

        const newQuantity = type === 'entrada' ? currentItem.quantity + quantity : currentItem.quantity - quantity;
        if (newQuantity < 0) throw new Error("O estoque não pode ser negativo");

        await updateDoc(doc(db, 'items', itemId), { quantity: newQuantity });

        await addDoc(collection(db, 'stock_movements'), {
            itemId: itemId,
            businessId: currentItem.businessId,
            type: type,
            quantity: quantity,
            createdAt: new Date().toISOString()
        });
        
        return { ...currentItem, quantity: newQuantity };
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
    }
}

// Appointments
export const checkAppointmentConflict = async (businessId: string, date: string, time: string): Promise<boolean> => {
    const path = 'appointments';
    try {
        const q = query(
            collection(db, path), 
            where('businessId', '==', businessId),
            where('date', '==', date),
            where('time', '==', time),
            where('status', '!=', 'concluido')
        );
        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    } catch (error) {
        return false;
    }
};

export const getAppointmentsByBusinessId = async (bizId: string): Promise<Appointment[]> => {
    const path = 'appointments';
    try {
        const q = query(collection(db, path), where('businessId', '==', bizId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const getUserAppointments = async (userId: string): Promise<(Appointment & { businessName?: string })[]> => {
    const path = 'appointments';
    try {
        const q = query(collection(db, path), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const appts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
        
        if (appts.length === 0) return [];

        const businessIds = [...new Set(appts.map(a => a.businessId))];
        const bizPromises = businessIds.map(id => getBusinessById(id));
        const businesses = await Promise.all(bizPromises);
        
        const bizMap = businesses.reduce((acc: any, b: any) => {
            if (b) acc[b.id] = b.name;
            return acc;
        }, {});

        return appts.map(a => ({
            ...a,
            businessName: bizMap[a.businessId]
        }));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
}

export const createAppointment = async (aptData: Omit<Appointment, 'id' | 'status'> & { userId: string }): Promise<Appointment> => {
    const path = 'appointments';
    try {
        const business = await getBusinessById(aptData.businessId);
        if (business && business.ownerId === aptData.userId) {
            throw new Error("Você não pode agendar um serviço no seu próprio negócio.");
        }

        const hasConflict = await checkAppointmentConflict(aptData.businessId, aptData.date, aptData.time);
        if (hasConflict) {
            throw new Error("Este horário já está ocupado por outro cliente.");
        }

        const newAptRef = doc(collection(db, path));
        const dbData = {
            ...aptData,
            id: newAptRef.id,
            status: 'pendente'
        };
        await setDoc(newAptRef, dbData);
        return dbData as Appointment;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export const updateAppointment = async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    const path = `appointments/${id}`;
    try {
        await updateDoc(doc(db, 'appointments', id), updates);
        const docSnap = await getDoc(doc(db, 'appointments', id));
        return { id: docSnap.id, ...docSnap.data() } as Appointment;
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
        throw error;
    }
}

export const deleteAppointment = async (id: string): Promise<void> => {
    const path = `appointments/${id}`;
    try {
        await deleteDoc(doc(db, 'appointments', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
}

export const updateAppointmentStatus = async (id: string, status: Appointment['status']): Promise<void> => {
    const path = `appointments/${id}`;
    try {
        await updateDoc(doc(db, 'appointments', id), { status });
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, path);
    }
}

// --- MESSAGES (CHAT) ---

export const getMessages = async (businessId: string, userId: string): Promise<Message[]> => {
    const path = 'messages';
    try {
        const q = query(
            collection(db, path),
            where('businessId', '==', businessId),
            where('userId', '==', userId),
            orderBy('createdAt', 'asc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return [];
    }
};

export const sendMessage = async (businessId: string, userId: string, senderType: 'user' | 'business', content: string): Promise<Message> => {
    const path = 'messages';
    try {
        const newMessageRef = doc(collection(db, path));
        const dbData = {
            id: newMessageRef.id,
            businessId,
            userId,
            senderType,
            content,
            createdAt: new Date().toISOString(),
            isRead: false
        };
        await setDoc(newMessageRef, dbData);
        return dbData as Message;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
};

export const markMessagesRead = async (businessId: string, userId: string, readerType: 'user' | 'business') => {
    const path = 'messages';
    try {
        const senderTypeToMark = readerType === 'user' ? 'business' : 'user';
        const q = query(
            collection(db, path),
            where('businessId', '==', businessId),
            where('userId', '==', userId),
            where('senderType', '==', senderTypeToMark),
            where('isRead', '==', false)
        );
        const querySnapshot = await getDocs(q);
        for (const d of querySnapshot.docs) {
            await updateDoc(doc(db, path, d.id), { isRead: true });
        }
    } catch (error) {
        console.error("Error marking messages as read", error);
    }
}

export const getUnreadCount = async (userId: string): Promise<{ messages: number, appointments: number }> => {
    try {
        const q1 = query(
            collection(db, 'messages'),
            where('userId', '==', userId),
            where('senderType', '==', 'business'),
            where('isRead', '==', false)
        );
        const userUnreadDocs = await getDocs(q1);
        const userUnread = userUnreadDocs.size;

        const businesses = await getUserBusinesses(userId);
        let businessUnread = 0;
        let pendingAppointments = 0;

        if (businesses.length > 0) {
            const businessIds = businesses.map(b => b.id);
            
            const q2 = query(
                collection(db, 'messages'),
                where('businessId', 'in', businessIds),
                where('senderType', '==', 'user'),
                where('isRead', '==', false)
            );
            const bizUnreadDocs = await getDocs(q2);
            businessUnread = bizUnreadDocs.size;

            const q3 = query(
                collection(db, 'appointments'),
                where('businessId', 'in', businessIds),
                where('status', '==', 'pendente')
            );
            const pendingApptDocs = await getDocs(q3);
            pendingAppointments = pendingApptDocs.size;
        }

        return { 
            messages: userUnread + businessUnread,
            appointments: pendingAppointments
        };
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'unread_counts');
        return { messages: 0, appointments: 0 };
    }
}

export const getConversations = async (userId: string): Promise<ChatConversation[]> => {
    try {
        const conversations: ChatConversation[] = [];
        
        const q1 = query(collection(db, 'messages'), where('userId', '==', userId), orderBy('createdAt', 'desc'));
        const userMsgsDocs = await getDocs(q1);
        const userMsgs = userMsgsDocs.docs.map(doc => doc.data());

        const seenBiz = new Set();
        for (const msg of userMsgs) {
            if (!seenBiz.has(msg.businessId)) {
                seenBiz.add(msg.businessId);
                const biz = await getBusinessById(msg.businessId);
                if (biz) {
                    const unread = userMsgs.filter(m => m.businessId === biz.id && m.senderType === 'business' && !m.isRead).length;
                    conversations.push({
                        id: biz.id,
                        name: biz.name,
                        avatarUrl: biz.profilePicUrl,
                        lastMessage: msg.content,
                        lastMessageTime: msg.createdAt,
                        unreadCount: unread,
                        type: 'business'
                    });
                }
            }
        }

        const myBusinesses = await getUserBusinesses(userId);
        if (myBusinesses.length > 0) {
            const myBusinessIds = myBusinesses.map(b => b.id);
            const q2 = query(collection(db, 'messages'), where('businessId', 'in', myBusinessIds), orderBy('createdAt', 'desc'));
            const bizMsgsDocs = await getDocs(q2);
            const bizMsgs = bizMsgsDocs.docs.map(doc => doc.data());

            const seenUserInBiz = new Set<string>();
            for (const msg of bizMsgs) {
                const key = `${msg.businessId}-${msg.userId}`;
                if (!seenUserInBiz.has(key)) {
                    seenUserInBiz.add(key);
                    const profileDoc = await getDoc(doc(db, 'profiles', msg.userId));
                    const profile = profileDoc.exists() ? profileDoc.data() : null;
                    const biz = myBusinesses.find(b => b.id === msg.businessId);
                    
                    if (profile && biz) {
                        const unread = bizMsgs.filter(m => m.businessId === msg.businessId && m.userId === msg.userId && m.senderType === 'user' && !m.isRead).length;
                         conversations.push({
                            id: `${msg.businessId}:${msg.userId}`,
                            name: `${profile.name} (via ${biz.name})`,
                            avatarUrl: profile.profilePicUrl || '',
                            lastMessage: msg.content,
                            lastMessageTime: msg.createdAt,
                            unreadCount: unread,
                            type: 'user'
                        });
                    }
                }
            }
        }

        return conversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'conversations');
        return [];
    }
}

export const deleteUser = async (userId: string): Promise<void> => {
    const path = `profiles/${userId}`;
    try {
        // Delete profile
        await deleteDoc(doc(db, 'profiles', userId));
        
        // Delete user's businesses
        const businesses = await getUserBusinesses(userId);
        for (const biz of businesses) {
            await deleteBusiness(biz.id);
        }

        // Note: auth.currentUser.delete() requires recent login
        if (auth.currentUser && auth.currentUser.uid === userId) {
            await auth.currentUser.delete();
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, path);
    }
}

export const toggleFavorite = async (userId: string, type: 'post' | 'item', id: string): Promise<boolean> => {
    const path = 'favorites';
    const targetCollection = type === 'post' ? 'posts' : 'items';
    try {
        const q = query(
            collection(db, path),
            where('userId', '==', userId),
            where('type', '==', type),
            where('targetId', '==', id)
        );
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            await deleteDoc(doc(db, path, querySnapshot.docs[0].id));
            await updateDoc(doc(db, targetCollection, id), {
                likesCount: increment(-1)
            });
            return false;
        } else {
            const newFavRef = doc(collection(db, path));
            await setDoc(newFavRef, {
                id: newFavRef.id,
                userId,
                type,
                targetId: id
            });
            await updateDoc(doc(db, targetCollection, id), {
                likesCount: increment(1)
            });
            return true;
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, path);
        return false;
    }
}

export const getUserFavoritesIds = async (userId: string): Promise<{ posts: string[], items: string[] }> => {
    const path = 'favorites';
    try {
        const q = query(collection(db, path), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => doc.data());
        
        const posts = data.filter(r => r.type === 'post').map(r => r.targetId);
        const items = data.filter(r => r.type === 'item').map(r => r.targetId);
        return { posts, items };
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, path);
        return { posts: [], items: [] };
    }
}

export const getFavoritePosts = async (userId: string): Promise<Post[]> => {
    try {
        const { posts: postIds } = await getUserFavoritesIds(userId);
        if (postIds.length === 0) return [];

        const posts: Post[] = [];
        for (let i = 0; i < postIds.length; i += 10) {
            const chunk = postIds.slice(i, i + 10);
            const q = query(collection(db, 'posts'), where('id', 'in', chunk));
            const querySnapshot = await getDocs(q);
            posts.push(...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
        }
        return posts;
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'favorite_posts');
        return [];
    }
}

export const getFavoriteItems = async (userId: string): Promise<CatalogItem[]> => {
    try {
        const { items: itemIds } = await getUserFavoritesIds(userId);
        if (itemIds.length === 0) return [];

        const items: CatalogItem[] = [];
        for (let i = 0; i < itemIds.length; i += 10) {
            const chunk = itemIds.slice(i, i + 10);
            const q = query(collection(db, 'items'), where('id', 'in', chunk));
            const querySnapshot = await getDocs(q);
            items.push(...querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CatalogItem)));
        }
        return items;
    } catch (e) {
        return [];
    }
}

export const getComments = async (postId: string): Promise<Comment[]> => {
    try {
        const q = query(collection(db, 'comments'), where('postId', '==', postId), orderBy('createdAt', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
    } catch (e) {
        return [];
    }
}

export const addComment = async (postId: string, userId: string, content: string): Promise<Comment> => {
    const path = 'comments';
    try {
        const profileDoc = await getDoc(doc(db, 'profiles', userId));
        const profile = profileDoc.exists() ? profileDoc.data() : null;

        const newCommentRef = doc(collection(db, path));
        const dbData = {
            id: newCommentRef.id,
            postId,
            userId,
            userName: profile?.name || 'Usuário',
            userAvatar: profile?.profilePicUrl || '',
            content,
            createdAt: new Date().toISOString()
        };
        await setDoc(newCommentRef, dbData);
        
        // Update commentsCount on post
        await updateDoc(doc(db, 'posts', postId), {
            commentsCount: increment(1)
        });
        
        return dbData as Comment;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export const replyToComment = async (postId: string, userId: string, content: string, parentCommentId: string, isBusinessReply: boolean, businessId?: string): Promise<Comment> => {
    const path = 'comments';
    try {
        let name = 'Usuário';
        let avatar = '';

        if (isBusinessReply && businessId) {
            const biz = await getBusinessById(businessId);
            if (biz) {
                name = biz.name;
                avatar = biz.profilePicUrl;
            }
        } else {
            const profileDoc = await getDoc(doc(db, 'profiles', userId));
            const profile = profileDoc.exists() ? profileDoc.data() : null;
            name = profile?.name || 'Usuário';
            avatar = profile?.profilePicUrl || '';
        }

        const newCommentRef = doc(collection(db, path));
        const dbData = {
            id: newCommentRef.id,
            postId,
            userId,
            userName: name,
            userAvatar: avatar,
            content,
            createdAt: new Date().toISOString(),
            parentCommentId,
            isBusinessReply
        };
        await setDoc(newCommentRef, dbData);

        // Update commentsCount on post
        await updateDoc(doc(db, 'posts', postId), {
            commentsCount: increment(1)
        });

        // Update repliesCount on parent comment
        await updateDoc(doc(db, 'comments', parentCommentId), {
            repliesCount: increment(1)
        });

        return dbData as Comment;
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, path);
        throw error;
    }
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
