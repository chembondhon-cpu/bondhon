import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Send, Users, User, ArrowLeft, Plus, Search, X, Loader2, Crown, Trash2, LogOut, Check, Edit, Database, Eraser } from 'lucide-react';
import { supabase, withTimeout } from '../lib/supabase';

interface Profile {
  id: string;
  name: string;
  avatar_url: string;
}

interface Chat {
  id: string;
  type: 'individual' | 'group';
  name: string | null;
  created_at: string;
  created_by?: string;
  participants?: (Profile & { role?: string })[];
  last_message?: string;
  last_message_at?: string;
}

interface PresenceState {
  [key: string]: {
    user_id: string;
    online_at: string;
  }[];
}

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
}

export const Messages = ({ 
  currentUser, 
  profiles, 
  syncStatus,
  initialTargetId,
  onChatStarted
}: { 
  currentUser: any, 
  profiles: Profile[], 
  syncStatus: 'online' | 'offline' | 'syncing',
  initialTargetId?: string | null,
  onChatStarted?: () => void
}) => {
  const [rawChats, setRawChats] = useState<any[]>([]);
  const [chatParticipantsMap, setChatParticipantsMap] = useState<Record<string, { profile_id: string, role: string }[]>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showParticipants, setShowParticipants] = useState(false);
  const [isAddingParticipant, setIsAddingParticipant] = useState(false);
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editedGroupName, setEditedGroupName] = useState('');
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitializedTarget = useRef(false);

  // Presence tracking
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channel
      .on('presence' as any, { event: 'sync' }, () => {
        const state = channel.presenceState();
        const onlineIds = new Set<string>();
        Object.keys(state).forEach((key) => {
          onlineIds.add(key);
        });
        setOnlineUsers(onlineIds);
      })
      .on('presence' as any, { event: 'join' }, ({ newPresences }: any) => {
        console.log('Joined:', newPresences);
      })
      .on('presence' as any, { event: 'leave' }, ({ leftPresences }: any) => {
        console.log('Left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: currentUser.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser?.id]);

  // Derive formatted chats from raw data and latest profiles
  const chats: Chat[] = rawChats.map(chat => {
    const participantsData = chatParticipantsMap[chat.id] || [];
    const chatProfiles = participantsData.map(pd => {
      const profile = profiles.find(p => p.id === pd.profile_id);
      return profile ? { ...profile, role: pd.role } : null;
    }).filter(Boolean) as (Profile & { role?: string })[];

    return {
      ...chat,
      participants: chatProfiles
    };
  });

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    if (currentUser?.id) {
      fetchChats();
    } else {
      setIsLoading(false);
    }

    // Failsafe: stop loading after 15 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    return () => clearTimeout(timer);
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      
      // Subscribe to new messages
      const subscription = supabase
        .channel(`chat:${activeChatId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'messages',
          filter: `chat_id=eq.${activeChatId}`
        }, payload => {
          const newMsg = payload.new as Message;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          scrollToBottom();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [activeChatId]);

  // Inject sender profiles into messages for rendering
  const formattedMessages = messages.map(msg => ({
    ...msg,
    sender: profiles.find(p => p.id === msg.sender_id)
  }));

  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (initialTargetId && profiles.length > 0 && currentUser?.id && !hasInitializedTarget.current) {
      handleStartDirectChat(initialTargetId);
      hasInitializedTarget.current = true;
    }
  }, [initialTargetId, profiles.length, currentUser?.id]);

  const handleStartDirectChat = async (targetId: string) => {
    if (targetId === currentUser.id) return;
    
    // Check if chat already exists
    const existingChat = chats.find(c => 
      c.type === 'individual' && 
      c.participants?.some(p => p.id === targetId)
    );

    if (existingChat) {
      setActiveChatId(existingChat.id);
      onChatStarted?.();
      return;
    }

    // Create new chat
    try {
      setIsLoading(true);
      
      const { data: chatData, error: chatError } = await withTimeout(supabase
        .from('chats')
        .insert([{ type: 'individual', created_by: currentUser.id }])
        .select()
        .single()) as any;

      if (chatError) throw chatError;

      const participantsToInsert = [
        { chat_id: chatData.id, profile_id: currentUser.id, role: 'member' },
        { chat_id: chatData.id, profile_id: targetId, role: 'member' }
      ];

      const { error: partError } = await withTimeout(supabase
        .from('chat_participants')
        .insert(participantsToInsert)) as any;

      if (partError) {
        // If role column is missing, try without it
        if (partError.message?.includes('column "role" does not exist')) {
          const fallbackInsert = [
            { chat_id: chatData.id, profile_id: currentUser.id },
            { chat_id: chatData.id, profile_id: targetId }
          ];
          const { error: fallbackError } = await withTimeout(supabase
            .from('chat_participants')
            .insert(fallbackInsert)) as any;
          if (fallbackError) throw fallbackError;
        } else {
          throw partError;
        }
      }

      // Update local state instead of full refetch
      setRawChats(prev => [chatData, ...prev]);
      setChatParticipantsMap(prev => ({
        ...prev,
        [chatData.id]: [
          { profile_id: currentUser.id, role: 'member' },
          { profile_id: targetId, role: 'member' }
        ]
      }));
      
      setActiveChatId(chatData.id);
      onChatStarted?.();
    } catch (err: any) {
      console.error('Error starting direct chat:', err);
      setError('Failed to start chat: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChats = async () => {
    if (!currentUser?.id) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the withTimeout helper
      const { data: myParticipantData, error: participantError } = await withTimeout(supabase
        .from('chat_participants')
        .select('*')
        .eq('profile_id', currentUser.id)) as any;

      if (participantError) throw participantError;

      if (!myParticipantData || myParticipantData.length === 0) {
        setRawChats([]);
        setChatParticipantsMap({});
        return;
      }

      const chatIds = myParticipantData.map((p: any) => p.chat_id);

      // Fetch chat details
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .in('id', chatIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (chatsError) throw chatsError;

      // Fetch ALL participants for these chats
      const { data: allParticipants, error: allPartError } = await supabase
        .from('chat_participants')
        .select('chat_id, profile_id, role')
        .in('chat_id', chatIds);
        
      if (allPartError) {
        // If role column is missing, try without it
        if (allPartError.message?.includes('column "role" does not exist')) {
          const { data: fallbackParticipants, error: fallbackError } = await supabase
            .from('chat_participants')
            .select('chat_id, profile_id')
            .in('chat_id', chatIds);
          
          if (fallbackError) throw fallbackError;
          
          const participantMap: Record<string, { profile_id: string, role: string }[]> = {};
          fallbackParticipants.forEach((p: any) => {
            if (!participantMap[p.chat_id]) participantMap[p.chat_id] = [];
            participantMap[p.chat_id].push({ profile_id: p.profile_id, role: 'member' });
          });
          setRawChats(chatsData);
          setChatParticipantsMap(participantMap);
          return;
        }
        throw allPartError;
      }

      // Create a map of chat_id -> participants data
      const participantMap: Record<string, { profile_id: string, role: string }[]> = {};
      allParticipants.forEach((p: any) => {
        if (!participantMap[p.chat_id]) participantMap[p.chat_id] = [];
        participantMap[p.chat_id].push({ profile_id: p.profile_id, role: p.role || 'member' });
      });

      setRawChats(chatsData);
      setChatParticipantsMap(participantMap);
    } catch (err: any) {
      console.error('Error fetching chats:', err);
      if (err.message?.includes('relation "chat_participants" does not exist') || err.message?.includes('infinite recursion')) {
        setError("Chat system tables are missing or misconfigured. Please run the SQL setup script below in your Supabase dashboard.");
      } else {
        setError("Failed to load chats: " + (err.message || 'Unknown error'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await withTimeout(supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })) as any;

      if (error) throw error;
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !activeChatId || isSending) return;
    
    if (syncStatus === 'offline') {
      alert('You are currently offline. Messages cannot be sent without an internet connection.');
      return;
    }

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      const { error } = await supabase
        .from('messages')
        .insert([{
          chat_id: activeChatId,
          sender_id: currentUser.id,
          content: messageContent
        }]);

      if (error) throw error;

      // Update last message in chats table
      const now = new Date().toISOString();
      await supabase
        .from('chats')
        .update({
          last_message: messageContent,
          last_message_at: now
        })
        .eq('id', activeChatId);

      // Update local state for immediate feedback
      setRawChats(prev => {
        const updated = prev.map(c => 
          c.id === activeChatId 
            ? { ...c, last_message: messageContent, last_message_at: now } 
            : c
        );
        // Re-sort to bring active chat to top
        return updated.sort((a, b) => {
          const timeA = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const timeB = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return timeB - timeA;
        });
      });
    } catch (err: any) {
      console.error('Error sending message:', err);
      setNewMessage(messageContent); // Restore message on failure
      alert('Failed to send message: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;
    
    if (syncStatus === 'offline') {
      alert('You are currently offline. New chats cannot be created without an internet connection.');
      return;
    }
    
    const isGroup = selectedUsers.length > 1;
    if (isGroup && !groupName.trim()) {
      alert('Please enter a group name.');
      return;
    }

    try {
      // If it's an individual chat, check if it already exists
      if (!isGroup) {
        const targetId = selectedUsers[0];
        const existingChat = chats.find(c => 
          c.type === 'individual' && 
          c.participants?.some(p => p.id === targetId)
        );

        if (existingChat) {
          setActiveChatId(existingChat.id);
          setIsCreatingChat(false);
          setSelectedUsers([]);
          return;
        }
      }

      setIsLoading(true);

      // 1. Create chat
      const { data: chatData, error: chatError } = await withTimeout(supabase
        .from('chats')
        .insert([{
          type: isGroup ? 'group' : 'individual',
          name: isGroup ? groupName.trim() : null,
          created_by: currentUser.id
        }])
        .select()
        .single()) as any;

      if (chatError) throw chatError;
      if (!chatData) throw new Error('Failed to create chat record: No data returned');

      // 2. Add participants (including current user)
      const participantsToInsert = [
        { chat_id: chatData.id, profile_id: currentUser.id, role: isGroup ? 'admin' : 'member' },
        ...selectedUsers.map(id => ({ chat_id: chatData.id, profile_id: id, role: 'member' }))
      ];

      const { error: partError } = await withTimeout(supabase
        .from('chat_participants')
        .insert(participantsToInsert)) as any;

      if (partError) {
        // If role column is missing, try without it
        if (partError.message?.includes('column "role" does not exist')) {
          const fallbackInsert = [
            { chat_id: chatData.id, profile_id: currentUser.id },
            ...selectedUsers.map(id => ({ chat_id: chatData.id, profile_id: id }))
          ];
          const { error: fallbackError } = await withTimeout(supabase
            .from('chat_participants')
            .insert(fallbackInsert)) as any;
          if (fallbackError) throw fallbackError;
        } else {
          throw partError;
        }
      }

      // Update local state
      setRawChats(prev => [chatData, ...prev]);
      setChatParticipantsMap(prev => ({
        ...prev,
        [chatData.id]: [
          { profile_id: currentUser.id, role: isGroup ? 'admin' : 'member' },
          ...selectedUsers.map(id => ({ profile_id: id, role: 'member' }))
        ]
      }));
      
      setIsCreatingChat(false);
      setSelectedUsers([]);
      setGroupName('');
      setActiveChatId(chatData.id);
      
    } catch (err: any) {
      console.error('Error creating chat:', err);
      alert('Failed to create chat: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      setIsLoading(true);
      
      // Delete the chat. Cascade will handle participants and messages.
      const { error } = await withTimeout(supabase
        .from('chats')
        .delete()
        .eq('id', chatId)) as any;

      if (error) throw error;

      // Update local state
      setRawChats(prev => prev.filter(c => c.id !== chatId));
      if (activeChatId === chatId) {
        setActiveChatId(null);
      }
    } catch (err: any) {
      console.error('Error deleting chat:', err);
      alert('Failed to delete chat: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const isChatAdmin = (chat: Chat) => {
    if (!currentUser) return false;
    if (chat.created_by === currentUser.id) return true;
    const me = chat.participants?.find(p => p.id === currentUser.id);
    return me?.role === 'admin';
  };

  const handleClearHistory = async () => {
    if (!activeChatId) return;
    
    if (!confirm('Are you sure you want to clear all messages in this chat? This cannot be undone.')) {
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await withTimeout(supabase
        .from('messages')
        .delete()
        .eq('chat_id', activeChatId)) as any;

      if (error) throw error;

      // Update local state
      setMessages([]);
      
      // Also update the last message in the chat list
      setRawChats(prev => prev.map(c => 
        c.id === activeChatId ? { ...c, last_message: null, last_message_at: null } : c
      ));

      // Update the chat in the database to clear last message preview
      await withTimeout(supabase
        .from('chats')
        .update({ last_message: null, last_message_at: null })
        .eq('id', activeChatId));

    } catch (err: any) {
      console.error('Error clearing history:', err);
      alert('Failed to clear history: ' + (err.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!activeChatId || !editedGroupName.trim()) return;
    try {
      const { error } = await supabase
        .from('chats')
        .update({ name: editedGroupName.trim() })
        .eq('id', activeChatId);

      if (error) throw error;

      // Update local state
      setRawChats(prev => prev.map(c => 
        c.id === activeChatId ? { ...c, name: editedGroupName.trim() } : c
      ));
      setIsEditingGroupName(false);
    } catch (err: any) {
      console.error('Error renaming group:', err);
      alert('Failed to rename group: ' + err.message);
    }
  };

  const handlePromoteToAdmin = async (profileId: string) => {
    if (!activeChatId) return;
    if (!confirm('Promote this member to admin? Admins can rename the group and manage participants.')) return;

    try {
      const { error } = await supabase
        .from('chat_participants')
        .update({ role: 'admin' })
        .eq('chat_id', activeChatId)
        .eq('profile_id', profileId);

      if (error) throw error;

      // Update local state
      setChatParticipantsMap(prev => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).map(p => 
          p.profile_id === profileId ? { ...p, role: 'admin' } : p
        )
      }));
      
      alert('Member promoted to admin successfully.');
    } catch (err: any) {
      console.error('Error promoting to admin:', err);
      alert('Failed to promote to admin: ' + err.message);
    }
  };

  const handleAddParticipant = async (profileId: string) => {
    if (!activeChatId) return;
    try {
      const { error } = await supabase
        .from('chat_participants')
        .insert([{ chat_id: activeChatId, profile_id: profileId, role: 'member' }]);

      if (error) throw error;

      // Update local state
      setChatParticipantsMap(prev => ({
        ...prev,
        [activeChatId]: [...(prev[activeChatId] || []), { profile_id: profileId, role: 'member' }]
      }));
      setIsAddingParticipant(false);
    } catch (err: any) {
      console.error('Error adding participant:', err);
      alert('Failed to add participant: ' + err.message);
    }
  };

  const handleRemoveParticipant = async (profileId: string) => {
    if (!activeChatId) return;
    if (profileId === currentUser.id) {
      if (!confirm('Are you sure you want to leave this group?')) return;
    } else {
      if (!confirm('Remove this participant?')) return;
    }

    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', activeChatId)
        .eq('profile_id', profileId);

      if (error) throw error;

      // Update local state
      setChatParticipantsMap(prev => ({
        ...prev,
        [activeChatId]: (prev[activeChatId] || []).filter(p => p.profile_id !== profileId)
      }));

      if (profileId === currentUser.id) {
        setActiveChatId(null);
        setRawChats(prev => prev.filter(c => c.id !== activeChatId));
      }
    } catch (err: any) {
      console.error('Error removing participant:', err);
      alert('Failed to remove participant: ' + err.message);
    }
  };

  const getChatName = (chat: Chat) => {
    if (chat.type === 'group') return chat.name || 'Group Chat';
    const otherUser = chat.participants?.find(p => p.id !== currentUser.id);
    if (!otherUser) {
      // If we have participant IDs but no profile yet, show a placeholder
      const participantsData = chatParticipantsMap[chat.id] || [];
      const otherId = participantsData.find(pd => pd.profile_id !== currentUser.id)?.profile_id;
      return otherId ? 'Loading user...' : 'Chat';
    }
    return otherUser.name || 'User';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'group') return null; // Can use a generic group icon
    const otherUser = chat.participants?.find(p => p.id !== currentUser.id);
    return otherUser?.avatar_url;
  };

  if (!currentUser) {
    return (
      <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] min-h-[500px] bg-white/80 backdrop-blur-xl rounded-3xl premium-shadow border border-white/50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
          <MessageSquare size={40} className="text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Login Required</h3>
        <p className="text-slate-600 mb-8 max-w-sm">Please login to your account to view your conversations and start messaging with other members.</p>
      </div>
    );
  }

  const filteredProfiles = profiles.filter(p => 
    p.id !== currentUser.id && 
    p.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading && chats.length === 0 && !error) {
    return (
      <div className="max-w-5xl mx-auto h-[calc(100vh-200px)] min-h-[500px] bg-white/80 backdrop-blur-xl rounded-3xl premium-shadow border border-white/50 flex flex-col items-center justify-center p-8">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-100 animate-pulse"></div>
            <Loader2 size={48} className="animate-spin text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Connecting to Chat...</h3>
          <p className="text-slate-500 font-medium mb-8">This may take a few seconds depending on your connection.</p>
          <button 
            onClick={() => fetchChats()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Retry Now
          </button>
        </div>
      </div>
    );
  }

  if (error && error.includes("Chat system tables are missing")) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-3xl premium-shadow border border-indigo-100 text-center">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Database size={40} className="text-indigo-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Database Setup Required</h3>
        <p className="text-slate-600 mb-6">The messaging tables haven't been created in your Supabase database yet. Please run the following SQL in your Supabase SQL Editor:</p>
        
        <div className="bg-slate-900 rounded-2xl p-6 mb-8 text-left overflow-x-auto">
          <pre className="text-indigo-300 text-sm font-mono leading-relaxed">{`
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create tables if they don't exist
CREATE TABLE IF NOT EXISTS chats (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  type TEXT DEFAULT 'individual',
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- 2. Repair existing tables (run this if you already have the tables)
ALTER TABLE chats ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'individual';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id);
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE chats ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chat_id, profile_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Security Definer function to break RLS recursion
CREATE OR REPLACE FUNCTION check_chat_membership(chat_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM chat_participants
    WHERE chat_id = chat_id_param
    AND profile_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Participants can view chats" ON chats;
DROP POLICY IF EXISTS "Authenticated users can create chats" ON chats;
DROP POLICY IF EXISTS "Participants can view chat participants" ON chat_participants;
DROP POLICY IF EXISTS "Authenticated users can add participants" ON chat_participants;
DROP POLICY IF EXISTS "Participants can view messages" ON messages;
DROP POLICY IF EXISTS "Participants can delete messages" ON messages;
DROP POLICY IF EXISTS "Participants can delete chats" ON chats;
DROP POLICY IF EXISTS "Admins can update chats" ON chats;
DROP POLICY IF EXISTS "Admins can update participants" ON chat_participants;

-- Create fixed policies using the helper function
CREATE POLICY "Participants can view chats" ON chats 
  FOR SELECT USING (check_chat_membership(id) OR created_by = auth.uid());

CREATE POLICY "Authenticated users can create chats" ON chats 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update chats" ON chats 
  FOR UPDATE USING (check_chat_membership(id)); -- We'll refine this in the app logic, but allow participants to update (like last_message)

CREATE POLICY "Participants can delete chats" ON chats 
  FOR DELETE USING (check_chat_membership(id) OR created_by = auth.uid());

CREATE POLICY "Participants can view chat participants" ON chat_participants 
  FOR SELECT USING (check_chat_membership(chat_id));

CREATE POLICY "Authenticated users can add participants" ON chat_participants 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can update participants" ON chat_participants 
  FOR UPDATE USING (check_chat_membership(chat_id));

CREATE POLICY "Participants can view messages" ON messages 
  FOR SELECT USING (check_chat_membership(chat_id));

CREATE POLICY "Participants can insert messages" ON messages 
  FOR INSERT WITH CHECK (check_chat_membership(chat_id) AND auth.uid() = sender_id);

CREATE POLICY "Participants can delete messages" ON messages 
  FOR DELETE USING (check_chat_membership(chat_id));

-- Enable real-time
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;
`}</pre>
        </div>
        <button 
          onClick={() => fetchChats()}
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          Check Again / Refresh
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-8 bg-white/90 backdrop-blur-xl rounded-3xl premium-shadow border border-red-100 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <X size={40} className="text-red-500" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h3>
        <p className="text-slate-600 mb-8 max-w-md mx-auto">{error}</p>
        
        <div className="flex flex-col items-center space-y-4">
          <button 
            onClick={() => fetchChats()}
            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            Try Again
          </button>
          
          <button 
            onClick={() => setError(null)}
            className="text-slate-400 text-sm hover:text-slate-600 underline"
          >
            Dismiss error
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto h-[calc(100vh-200px)] min-h-[500px] bg-white/80 backdrop-blur-xl rounded-3xl premium-shadow border border-white/50 overflow-hidden flex"
    >
      {/* Sidebar - Chat List */}
      <div className={`w-full md:w-1/3 border-r border-slate-100 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => fetchChats()}
              className="p-2 text-slate-400 hover:text-indigo-600 rounded-full hover:bg-slate-100 transition-colors"
              title="Refresh Chats"
            >
              <Loader2 size={18} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setIsCreatingChat(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>
          ) : chats.length === 0 ? (
            <div className="text-center p-8 text-slate-500">
              <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">No messages yet.</p>
              <button onClick={() => setIsCreatingChat(true)} className="text-indigo-600 font-bold mt-2 block w-full">Start a chat</button>
              <button onClick={() => fetchChats()} className="text-slate-400 text-xs mt-4 hover:text-indigo-600 transition-colors">Refresh List</button>
            </div>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setActiveChatId(chat.id);
                  }
                }}
                role="button"
                tabIndex={0}
                className={`w-full text-left p-3 rounded-xl flex items-center space-x-3 transition-all duration-200 group relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  activeChatId === chat.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-[1.02] z-10' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                {activeChatId === chat.id && (
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                )}
                <div className="relative flex-shrink-0">
                  {chat.type === 'group' ? (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeChatId === chat.id ? 'bg-indigo-500' : 'bg-blue-100 text-blue-600'}`}>
                      <Users size={24} />
                    </div>
                  ) : getChatAvatar(chat) ? (
                    <img src={getChatAvatar(chat)!} alt="Avatar" className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                  ) : (
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeChatId === chat.id ? 'bg-indigo-500' : 'bg-slate-200 text-slate-500'}`}>
                      <User size={24} />
                    </div>
                  )}
                  {chat.type !== 'group' && chat.participants?.some(p => p.id !== currentUser.id && onlineUsers.has(p.id)) && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h4 className={`font-bold truncate ${activeChatId === chat.id ? 'text-white' : 'text-slate-900'}`}>
                      {getChatName(chat)}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {chat.last_message_at && (
                        <span className={`text-[10px] font-medium flex-shrink-0 ${activeChatId === chat.id ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {new Date(chat.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      
                      {chatToDelete === chat.id ? (
                        <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-2 duration-200">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteChat(chat.id, e);
                              setChatToDelete(null);
                            }}
                            className="p-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors shadow-sm"
                            title="Confirm Delete"
                          >
                            <Check size={12} />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setChatToDelete(null);
                            }}
                            className="p-1 bg-slate-500 text-white rounded-md hover:bg-slate-600 transition-colors shadow-sm"
                            title="Cancel"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setChatToDelete(chat.id);
                          }}
                          className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                            activeChatId === chat.id ? 'hover:bg-indigo-500 text-indigo-100' : 'hover:bg-slate-500'
                          }`}
                          title="Delete conversation"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className={`text-xs truncate ${activeChatId === chat.id ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {chat.last_message || (chat.type === 'group' ? 'Group Chat' : 'Direct Message')}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-50/50 ${!activeChatId && !isCreatingChat ? 'hidden md:flex' : 'flex'}`}>
        {isCreatingChat ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-white flex items-center space-x-3">
              <button onClick={() => setIsCreatingChat(false)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <h3 className="text-lg font-bold text-slate-900">New Message</h3>
            </div>
            
            <div className="p-4 bg-white border-b border-slate-100">
              {selectedUsers.length > 1 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Group Name</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Enter group name..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedUsers.map(id => {
                    const profile = profiles.find(p => p.id === id);
                    return (
                      <div key={id} className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm flex items-center space-x-1">
                        <span>{profile?.name}</span>
                        <button onClick={() => setSelectedUsers(prev => prev.filter(u => u !== id))} className="text-indigo-600 hover:text-indigo-900">
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredProfiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => {
                    if (selectedUsers.includes(profile.id)) {
                      setSelectedUsers(prev => prev.filter(id => id !== profile.id));
                    } else {
                      setSelectedUsers(prev => [...prev, profile.id]);
                    }
                  }}
                  className="w-full text-left p-3 flex items-center space-x-3 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-500" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">{profile.name}</h4>
                  </div>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedUsers.includes(profile.id) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-300'}`}>
                    {selectedUsers.includes(profile.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </button>
              ))}
            </div>
            
            <div className="p-4 bg-white border-t border-slate-100">
              <button 
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 transition-colors"
              >
                {selectedUsers.length > 1 ? 'Create Group Chat' : 'Start Chat'}
              </button>
            </div>
          </div>
        ) : activeChat ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-100 flex items-center space-x-3 shadow-sm z-10">
              <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex items-center justify-center text-slate-500">
                {activeChat.type === 'group' ? <Users size={20} /> : getChatAvatar(activeChat) ? <img src={getChatAvatar(activeChat)!} alt="" className="w-full h-full object-cover" /> : <User size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-900 truncate">{getChatName(activeChat)}</h3>
                <p className="text-xs text-slate-500">{activeChat.type === 'group' ? `${activeChat.participants?.length} members` : 'Direct Message'}</p>
              </div>
              <div className="flex items-center space-x-1">
                <button 
                  onClick={handleClearHistory}
                  className="p-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                  title="Clear History"
                >
                  <Eraser size={20} />
                </button>
                {activeChat.type === 'group' && (
                  <button 
                    onClick={() => setShowParticipants(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    title="View Participants"
                  >
                    <Users size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
              {showParticipants && activeChat && (
                <div className="absolute inset-0 z-20 bg-white flex flex-col">
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex-1 mr-4">
                      {isEditingGroupName ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text"
                            value={editedGroupName}
                            onChange={(e) => setEditedGroupName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm border border-indigo-500 rounded outline-none"
                            autoFocus
                          />
                          <button onClick={handleRenameGroup} className="p-1 text-indigo-600 hover:bg-indigo-50 rounded">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setIsEditingGroupName(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-slate-900 truncate">
                            {activeChat.name || 'Group Participants'}
                          </h4>
                          {isChatAdmin(activeChat) && (
                            <button 
                              onClick={() => {
                                setEditedGroupName(activeChat.name || '');
                                setIsEditingGroupName(true);
                              }}
                              className="p-1 text-slate-400 hover:text-indigo-600"
                            >
                              <Edit size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => { setShowParticipants(false); setIsAddingParticipant(false); setIsEditingGroupName(false); }} className="p-1 text-slate-400 hover:text-slate-600">
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4">
                    {isAddingParticipant ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => setIsAddingParticipant(false)} className="p-1 text-slate-400 hover:text-indigo-600">
                            <ArrowLeft size={18} />
                          </button>
                          <h5 className="font-medium text-slate-700">Add New Participant</h5>
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-2">
                          {profiles
                            .filter(p => 
                              p.id !== currentUser.id && 
                              !activeChat.participants?.some(part => part.id === p.id) &&
                              p.name?.toLowerCase().includes(searchQuery.toLowerCase())
                            )
                            .slice(0, 5)
                            .map(profile => (
                              <div key={profile.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                                    {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-slate-500" />}
                                  </div>
                                  <span className="font-medium text-slate-900">{profile.name}</span>
                                </div>
                                <button 
                                  onClick={() => handleAddParticipant(profile.id)}
                                  className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                                >
                                  <Plus size={18} />
                                </button>
                              </div>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {isChatAdmin(activeChat) && (
                          <button 
                            onClick={() => setIsAddingParticipant(true)}
                            className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center justify-center space-x-2"
                          >
                            <Plus size={18} />
                            <span>Add Participant</span>
                          </button>
                        )}
                        
                        <div className="space-y-3">
                          {activeChat.participants?.map(participant => (
                            <div key={participant.id} className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="relative">
                                  <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                    {participant.avatar_url ? <img src={participant.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-500" />}
                                  </div>
                                  {onlineUsers.has(participant.id) && (
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900 flex items-center">
                                    {participant.name}
                                    {participant.id === activeChat.created_by && (
                                      <Crown size={12} className="ml-1.5 text-amber-500" title="Owner" />
                                    )}
                                    {participant.role === 'admin' && participant.id !== activeChat.created_by && (
                                      <Crown size={12} className="ml-1.5 text-indigo-500" title="Admin" />
                                    )}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {participant.id === activeChat.created_by ? 'Owner' : participant.role === 'admin' ? 'Admin' : 'Member'} • {onlineUsers.has(participant.id) ? 'Online' : 'Offline'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                {activeChat.created_by === currentUser.id && participant.id !== currentUser.id && participant.role !== 'admin' && (
                                  <button 
                                    onClick={() => handlePromoteToAdmin(participant.id)}
                                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors"
                                    title="Promote to Admin"
                                  >
                                    <Crown size={18} />
                                  </button>
                                )}
                                {(isChatAdmin(activeChat) || participant.id === currentUser.id) && (
                                  <button 
                                    onClick={() => handleRemoveParticipant(participant.id)}
                                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                    title={participant.id === currentUser.id ? "Leave Group" : "Remove Participant"}
                                  >
                                    {participant.id === currentUser.id ? <LogOut size={18} /> : <Trash2 size={18} />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {formattedMessages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser.id;
                const showSender = activeChat.type === 'group' && !isMe && (idx === 0 || formattedMessages[idx - 1].sender_id !== msg.sender_id);
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {showSender && <span className="text-xs text-slate-500 ml-12 mb-1">{msg.sender?.name}</span>}
                    <div className={`flex items-end space-x-2 max-w-[80%] ${isMe ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      {!isMe && activeChat.type === 'group' && (
                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                          {msg.sender?.avatar_url ? <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-full h-full p-1.5 text-slate-500" />}
                        </div>
                      )}
                      <div className={`px-4 py-2 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-slate-100 border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'}`}>
                        <p className="whitespace-pre-wrap break-words text-sm md:text-base font-medium">{msg.content}</p>
                        <span className={`text-[10px] mt-1 block font-normal ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 max-h-32 min-h-[44px] px-4 py-2.5 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-slate-900 bg-white font-medium placeholder:text-slate-400"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!newMessage.trim() || isSending}
                  className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <MessageSquare size={64} className="text-indigo-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-600 mb-2">Your Messages</h3>
            <p className="mb-6 max-w-xs mx-auto">Select a conversation from the sidebar or start a new one to begin chatting.</p>
            <button 
              onClick={() => setIsCreatingChat(true)} 
              className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 premium-button"
            >
              Start a New Chat
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
