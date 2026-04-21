import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Phone, Mail, Facebook, Linkedin, Users, GraduationCap, 
  Briefcase, Building, FlaskConical, LogOut, Database, User as UserIcon, 
  MapPin, Camera, Eye, EyeOff, Loader2, Home, MessageSquare, Lightbulb, 
  Target, X, Clock, Map, Bookmark, Calendar, CheckCircle, CalendarDays,
  BadgeCheck, FileText, ExternalLink, MoreVertical, Edit, Trash2, Crown, HelpCircle,
  ShieldCheck, ArrowRight, Building2, Copy, Check, BookOpen, Hash, Atom, Hexagon,
  Sparkles,
  TestTube, TestTubes, Microscope, Dna, Pipette, Beaker, Activity, LayoutGrid, List, Cloud, CloudOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase, withTimeout } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { saveProfilesLocally, getLocalProfiles, saveOfflineMutation, getOfflineMutations, clearOfflineMutation } from './lib/db';
import { Messages } from './components/Messages';

type CurrentStatus = 'Student' | 'Govt Job' | 'Private Job' | 'Business' | 'Abroad' | '';

export interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  batch: string;
  chemistry_batch?: string;
  hall_name?: string;
  student_id?: string;
  department: string;
  university: string;
  current_status: CurrentStatus;
  job_title?: string;
  institute_name?: string;
  location?: string;
  permanent_address?: string;
  blood_group?: string;
  bio?: string;
  phone?: string;
  is_phone_private?: boolean;
  email?: string;
  social_links: {
    facebook?: string;
    linkedin?: string;
  };
  is_public: boolean;
  role?: 'user' | 'admin';
  verification_status?: 'none' | 'pending' | 'verified' | 'rejected';
}

interface Teacher {
  id: string;
  name: string;
  designation: string;
  department: string;
  university: string;
  phone?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
}

interface Bookmark {
  profile_id: string;
}

const STATUS_OPTIONS: CurrentStatus[] = ['Student', 'Govt Job', 'Private Job', 'Business', 'Abroad'];

const INITIAL_FORM_DATA: Partial<Profile> = {
  department: '',
  university: '',
  hall_name: '',
  current_status: '',
  blood_group: '',
  is_public: true,
  is_phone_private: false,
  social_links: {},
  name: '',
  email: '',
  batch: '',
  chemistry_batch: '',
  student_id: '',
  avatar_url: '',
  bio: '',
  phone: '',
  location: '',
  permanent_address: '',
  job_title: '',
  institute_name: '',
  verification_status: 'none'
};

const MoleculeBackground = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const elementCount = isMobile ? 12 : 25;
  const icons = [Atom, Hexagon, FlaskConical, TestTube, TestTubes, Microscope, Dna, Pipette, Beaker];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-gradient-to-b from-[#1e3a8a] via-[#4f46e5] to-[#fcd34d]">
      {/* Dynamic Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/30 blur-[100px] mix-blend-overlay animate-pulse" style={{animationDuration: '10s'}}></div>
      <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-indigo-300/30 blur-[100px] mix-blend-overlay animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}}></div>
      <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-yellow-300/30 blur-[100px] mix-blend-overlay animate-pulse" style={{animationDuration: '14s', animationDelay: '4s'}}></div>
      <div className="absolute top-[40%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-indigo-400/30 blur-[100px] mix-blend-overlay animate-pulse" style={{animationDuration: '11s', animationDelay: '1s'}}></div>
      
      {/* Hexagon Pattern Watermark */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
      
      {/* Floating Chemistry Elements */}
      {[...Array(elementCount)].map((_, i) => {
        const Icon = icons[i % icons.length];
        const colors = ['text-white/20', 'text-indigo-100/20', 'text-yellow-100/20', 'text-blue-100/20'];
        const color = colors[i % colors.length];
        
        return (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "vw", 
              y: Math.random() * 100 + "vh",
              scale: Math.random() * 1.5 + 0.5,
              rotate: Math.random() * 360
            }}
            animate={{ 
              x: [Math.random() * 100 + "vw", Math.random() * 100 + "vw"],
              y: [Math.random() * 100 + "vh", Math.random() * 100 + "vh"],
              rotate: [Math.random() * 360, Math.random() * 360 + 360]
            }}
            transition={{ 
              duration: 40 + Math.random() * 60, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className={`absolute ${color}`}
          >
            <Icon size={isMobile ? 40 : 80} />
          </motion.div>
        );
      })}
    </div>
  );
};

const KingBadge = ({ size = 16 }: { size?: number }) => (
  <motion.span
    animate={{ 
      rotate: [0, -10, 10, -10, 10, 0],
      scale: [1, 1.1, 1, 1.1, 1]
    }}
    transition={{ 
      duration: 2, 
      repeat: Infinity,
      ease: "easeInOut"
    }}
    className="inline-flex items-center justify-center ml-1"
    title="Admin"
  >
    <Crown size={size} className="text-amber-500 fill-amber-200" />
  </motion.span>
);

const VerifiedBadge = ({ size = 16, animated = false }: { size?: number, animated?: boolean }) => {
  const content = <BadgeCheck size={size} className="text-blue-500" title="Verified Member" />;
  
  if (!animated) return <span className="ml-1 inline-flex items-center justify-center">{content}</span>;

  return (
    <motion.span
      animate={{ 
        scale: [1, 1.2, 1],
        filter: ["drop-shadow(0 0 0px rgba(59, 130, 246, 0))", "drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))", "drop-shadow(0 0 0px rgba(59, 130, 246, 0))"]
      }}
      transition={{ 
        duration: 2, 
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="ml-1 inline-flex items-center justify-center"
    >
      {content}
    </motion.span>
  );
};

const UserBadges = ({ profile, size = 16 }: { profile: any, size?: number }) => {
  const isAdmin = profile?.role === 'admin' || profile?.email === 'fllimonm1212@gmail.com' || profile?.email === 'chembondhon@gmail.com';
  const isVerified = profile?.verification_status === 'verified';

  if (!isAdmin && !isVerified) return null;

  return (
    <span className="inline-flex items-center">
      {isAdmin && <KingBadge size={size} />}
      {isVerified && <VerifiedBadge size={size} animated={isAdmin} />}
    </span>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [dbError, setDbError] = useState('');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<'feed' | 'directory' | 'profile' | 'teachers' | 'saved' | 'admin' | 'messages'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterBatch, setFilterBatch] = useState<string>('All');
  const [filterBloodGroup, setFilterBloodGroup] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'batch_asc' | 'batch_desc' | 'name_asc' | 'name_desc'>('batch_asc');
  const [adminEmailToAdd, setAdminEmailToAdd] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [exportBatch, setExportBatch] = useState<string>('');
  const [exportChemistryBatch, setExportChemistryBatch] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const [downloadingCardId, setDownloadingCardId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Teachers State
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [isCreatingTeacher, setIsCreatingTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    name: '',
    designation: '',
    department: 'Chemistry',
    university: 'University of Rajshahi',
    phone: '',
    email: '',
  });

  // Profile Form State
  const [formData, setFormData] = useState<Partial<Profile>>(INITIAL_FORM_DATA);

  // Offline & Sync State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<'online' | 'offline' | 'syncing'>('online');
  const [pendingMutationsCount, setPendingMutationsCount] = useState(0);

  const isAdmin = currentUser?.email === 'fllimonm1212@gmail.com' || currentUser?.email === 'chembondhon@gmail.com' || profiles.find(p => p.id === currentUser?.id)?.role === 'admin';
  const myProfile = profiles.find(p => p.id === currentUser?.id);

  const defaultHeroImage = 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2080&auto=format&fit=crop';
  const [heroImageUrl, setHeroImageUrl] = useState<string>(defaultHeroImage);
  const [isUploadingHero, setIsUploadingHero] = useState(false);
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  
  const [isFeedEnabled, setIsFeedEnabled] = useState(true);
  
  const [newPostContent, setNewPostContent] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postImageFile, setPostImageFile] = useState<File | null>(null);
  const postImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message && (
        event.reason.message.includes('Refresh Token Not Found') || 
        event.reason.message.includes('Invalid Refresh Token')
      )) {
        console.warn('Caught invalid refresh token error, signing out...');
        supabase.auth.signOut();
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (event.message && (
        event.message.includes('Refresh Token Not Found') || 
        event.message.includes('Invalid Refresh Token')
      )) {
        console.warn('Caught invalid refresh token error, signing out...');
        supabase.auth.signOut();
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
          supabase.auth.signOut();
        }
      }
      setCurrentUser(session?.user ?? null);
      setIsLoading(false);
    }).catch((err) => {
      console.error('Unexpected session error:', err);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
      } else {
        setCurrentUser(session?.user ?? null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const syncData = async () => {
    if (!navigator.onLine) {
      alert("Cannot sync while offline. Please check your internet connection.");
      return;
    }
    setSyncStatus('syncing');
    let hasErrors = false;
    let syncedCount = 0;
    
    try {
      const mutations = await getOfflineMutations();
      for (const mutation of mutations) {
        if (mutation.type === 'profile_update') {
          // Check for basic data integrity before upsert
          if (!mutation.payload || !mutation.payload.id) {
            hasErrors = true;
            console.warn("Invalid offline mutation payload:", mutation);
            continue;
          }
          
          const { error } = await supabase
            .from('profiles')
            .upsert([mutation.payload]);
            
          if (!error && mutation.id) {
            await clearOfflineMutation(mutation.id);
            syncedCount++;
          } else if (error) {
            console.error('Conflict or error syncing profile:', error);
            hasErrors = true;
          }
        }
      }
      await fetchProfiles();
      const remaining = await getOfflineMutations();
      setPendingMutationsCount(remaining.length);
      setSyncStatus('online');
      
      if (hasErrors) {
        alert("Sync partially complete: some conflicts or errors occurred while saving offline changes.");
      } else if (syncedCount > 0) {
        // Optional silently succeed or show a small toast if we implement it.
        console.log(`Successfully synced ${syncedCount} changes.`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('online'); // fallback
      alert("An unexpected error occurred during synchronization. Please try again.");
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('online');
      syncData();
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (navigator.onLine) {
      syncData();
    } else {
      setSyncStatus('offline');
    }

    // Load pending count
    getOfflineMutations().then(m => setPendingMutationsCount(m.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchSiteConfig();
    if (currentUser) {
      fetchProfiles();
      fetchMyProfile();
      fetchPosts();
      fetchBookmarks();
      fetchTeachers();
    }
  }, [currentUser]);

  const fetchMyProfile = async () => {
    if (!currentUser) return;
    
    // Reset form data to initial state first to avoid showing previous user's info
    setFormData(INITIAL_FORM_DATA);

    const cachedMyProfile = localStorage.getItem(`chem_my_profile_${currentUser.id}`);
    if (cachedMyProfile) {
      try {
        const data = JSON.parse(cachedMyProfile);
        setFormData({
          name: data.name,
          avatar_url: data.avatar_url,
          batch: data.batch,
          chemistry_batch: data.chemistry_batch,
          hall_name: data.hall_name || '',
          student_id: data.student_id,
          department: data.department || '',
          university: data.university || '',
          current_status: (data.current_status as CurrentStatus) || '',
          job_title: data.job_title,
          institute_name: data.institute_name,
          location: data.location,
          permanent_address: data.permanent_address,
          blood_group: data.blood_group,
          bio: data.bio,
          phone: data.phone,
          is_phone_private: data.is_phone_private ?? false,
          email: data.email,
          social_links: data.social_links || {},
          is_public: data.is_public ?? true,
          verification_status: data.verification_status || 'none'
        });
      } catch (e) {
        console.error('Failed to parse cached my profile', e);
      }
    }

    if (!navigator.onLine) return;

    try {
      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single()) as any;

      if (error) {
        if (error.code === 'PGRST116') {
          // New user - no profile in DB yet
          setFormData({
            ...INITIAL_FORM_DATA,
            name: currentUser.user_metadata?.full_name || '',
            email: currentUser.email || ''
          });
          // Redirect new users to profile edit immediately
          setActiveTab('profile');
          setIsEditingProfile(true);
        } else {
          console.error('Error fetching my profile:', error);
        }
      } else if (data) {
        localStorage.setItem(`chem_my_profile_${currentUser.id}`, JSON.stringify(data));
        setFormData({
          name: data.name,
          avatar_url: data.avatar_url,
        batch: data.batch,
        chemistry_batch: data.chemistry_batch,
        hall_name: data.hall_name || '',
        student_id: data.student_id,
        department: data.department || '',
        university: data.university || '',
        current_status: (data.current_status as CurrentStatus) || '',
        job_title: data.job_title,
        institute_name: data.institute_name,
        location: data.location,
        permanent_address: data.permanent_address,
        blood_group: data.blood_group,
        bio: data.bio,
        phone: data.phone,
        is_phone_private: data.is_phone_private ?? false,
        email: data.email,
        social_links: data.social_links || {},
        is_public: data.is_public ?? true,
        verification_status: data.verification_status || 'none'
      });
    }
  } catch (err) {
    console.error('Network error fetching my profile:', err);
  }
};

  const fetchProfiles = async () => {
    // Also fetch site config
    fetchSiteConfig();
    try {
      const localProfiles = await getLocalProfiles();
      if (localProfiles && localProfiles.length > 0) {
        setProfiles(localProfiles);
      }
    } catch (e) {
      console.error('Failed to load local profiles', e);
    }

    if (!navigator.onLine) return;

    try {
      const { data, error } = await withTimeout(supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })) as any;

      if (error) {
        console.error('Error fetching profiles:', error);
        if (error.code === '42P01') {
          setDbError('Database tables are missing. Please run the SQL setup script below in your Supabase SQL Editor.');
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('Network error')) {
          setDbError('Network Error: Could not connect to Supabase. This could be due to invalid API keys, a paused project, or an internet issue.');
        } else {
          setDbError('Failed to connect to database. Please check your Supabase configuration.');
        }
      } else if (data) {
        setDbError('');
        setProfiles(data as Profile[]);
        try {
          await saveProfilesLocally(data as Profile[]);
        } catch (e) {
          console.error('Failed to save profiles locally', e);
        }
      }
    } catch (err: any) {
      console.error('Network error fetching profiles:', err);
      setDbError(err.message || 'Failed to fetch profiles. Please check your internet connection.');
    }
  };

  const fetchSiteConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('*');
      
      if (data) {
        data.forEach(config => {
          if (config.key === 'hero_image_url' && config.value.startsWith('http')) {
            setHeroImageUrl(config.value);
          }
          if (config.key === 'is_feed_enabled') {
            setIsFeedEnabled(config.value === 'true');
          }
        });
      } else if (error) {
        console.warn('Site config error:', error);
      }
    } catch (e) {
      console.error('Config fetch failed:', e);
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!isAdmin) {
      alert("Access Denied: You must be an admin to change the hero image.");
      return;
    }

    try {
      setIsUploadingHero(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `hero_${Date.now()}.${fileExt}`;
      const filePath = `hero/${fileName}`;

      console.log('Uploading hero image to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      // Save to site_config
      const { error: configError } = await supabase
        .from('site_config')
        .upsert({ key: 'hero_image_url', value: publicUrl, updated_at: new Date().toISOString() });

      if (configError) {
        console.error('Database/Config error:', configError);
        throw configError;
      }

      setHeroImageUrl(publicUrl);
      alert('Hero image updated successfully!');
    } catch (error: any) {
      console.error('Error uploading hero image:', error);
      alert('Error uploading hero image: ' + (error.message || 'Unknown error. Check console for details.'));
    } finally {
      setIsUploadingHero(false);
      if (heroFileInputRef.current) heroFileInputRef.current.value = '';
    }
  };

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(name, avatar_url, chemistry_batch)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Error fetching posts:', err);
    }
  };

  const createPost = async (content: string, imageUrl?: string) => {
    if (!currentUser) return;
    try {
      const { error } = await supabase
        .from('posts')
        .insert({
          author_id: currentUser.id,
          content,
          image_url: imageUrl,
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      fetchPosts();
      return true;
    } catch (err) {
      console.error('Error creating post:', err);
      return false;
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      fetchPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    }
  };

  const fetchTeachers = async () => {
    const cachedTeachers = localStorage.getItem('chem_teachers');
    if (cachedTeachers) {
      try {
        setTeachers(JSON.parse(cachedTeachers));
      } catch (e) {
        console.error('Failed to parse cached teachers', e);
      }
    }

    if (!navigator.onLine) return;

    try {
      setIsLoadingTeachers(true);
      const { data, error } = await withTimeout(supabase
        .from('teachers')
        .select('*')
        .order('name', { ascending: true })) as any;

      if (!error && data) {
        setTeachers(data as Teacher[]);
        localStorage.setItem('chem_teachers', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching teachers:', err);
    } finally {
      setIsLoadingTeachers(false);
    }
  };

  const fetchBookmarks = async () => {
    if (!currentUser) return;

    const cachedBookmarks = localStorage.getItem(`chem_bookmarks_${currentUser.id}`);
    if (cachedBookmarks) {
      try {
        setBookmarks(new Set(JSON.parse(cachedBookmarks)));
      } catch (e) {
        console.error('Failed to parse cached bookmarks', e);
      }
    }

    if (!navigator.onLine) return;

    try {
      const { data, error } = await withTimeout(supabase
        .from('bookmarks')
        .select('profile_id')
        .eq('user_id', currentUser.id)) as any;

      if (!error && data) {
        const bookmarkIds = data.map(b => b.profile_id);
        setBookmarks(new Set(bookmarkIds));
        localStorage.setItem(`chem_bookmarks_${currentUser.id}`, JSON.stringify(bookmarkIds));
      }
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    }
  };


  // Scroll to top when tab changes
  useEffect(() => {
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  }, [activeTab]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDeletePost = async () => {}; // Removed for posts removal

  const filteredProfiles = useMemo(() => {
    return profiles.filter(profile => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (profile.name || '').toLowerCase().includes(searchLower) ||
        (profile.batch || '').toLowerCase().includes(searchLower) ||
        (profile.chemistry_batch || '').toLowerCase().includes(searchLower) ||
        (profile.location || '').toLowerCase().includes(searchLower) ||
        (profile.institute_name || '').toLowerCase().includes(searchLower) ||
        (profile.job_title || '').toLowerCase().includes(searchLower);
      
      let matchesStatus = filterStatus === 'All' || profile.current_status === filterStatus;
      
      if (filterStatus === 'Classmates') {
        matchesStatus = profile.chemistry_batch === formData.chemistry_batch && profile.id !== currentUser?.id;
      }

      const matchesBatch = filterBatch === 'All' || profile.chemistry_batch === filterBatch;
      const matchesBloodGroup = filterBloodGroup === 'All' || profile.blood_group === filterBloodGroup;

      return matchesSearch && matchesStatus && matchesBatch && matchesBloodGroup;
    }).sort((a, b) => {
      const batchA = parseInt(a.chemistry_batch || '999');
      const batchB = parseInt(b.chemistry_batch || '999');
      
      if (sortBy === 'batch_asc') return batchA - batchB;
      if (sortBy === 'batch_desc') return batchB - batchA;
      if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
      
      return batchA - batchB;
    });
  }, [profiles, searchQuery, filterStatus, filterBatch, filterBloodGroup, sortBy, formData.chemistry_batch, currentUser?.id]);

  const groupedProfiles = useMemo(() => {
    const groups: { [key: string]: Profile[] } = {};
    filteredProfiles.forEach(profile => {
      const batch = profile.chemistry_batch || 'N/A';
      if (!groups[batch]) groups[batch] = [];
      groups[batch].push(profile);
    });
    
    // Sort profiles within each group
    Object.keys(groups).forEach(batch => {
      groups[batch].sort((a, b) => {
        // First sort by student ID if available
        if (a.student_id && b.student_id) {
          return a.student_id.localeCompare(b.student_id);
        }
        if (a.student_id) return -1;
        if (b.student_id) return 1;
        // Fallback to name
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    return Object.entries(groups).sort((a, b) => {
      if (a[0] === 'N/A') return 1;
      if (b[0] === 'N/A') return -1;
      const batchA = parseInt(a[0]);
      const batchB = parseInt(b[0]);
      if (isNaN(batchA)) return 1;
      if (isNaN(batchB)) return -1;
      return batchA - batchB;
    });
  }, [filteredProfiles]);

  const downloadSpecificCard = async (elementId: string, profileName: string) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    try {
      setDownloadingCardId(elementId);
      const dataUrl = await toPng(element, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        onclone: (clonedNode: any) => {
          const watermarks = clonedNode.querySelectorAll('.download-watermark');
          watermarks.forEach((w: any) => {
            w.classList.remove('hidden');
            w.classList.add('flex');
          });
        }
      } as any);
      
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${profileName.replace(/\s+/g, '_')}_Profile_Card.png`;
      link.click();
    } catch (error) {
      console.error('Error generating card image:', error);
      alert('Failed to download the profile card. Please try again.');
    } finally {
      setDownloadingCardId(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${currentUser.id}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    setIsUploading(true);
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) {
      console.error(uploadError);
      alert('Error uploading avatar! Make sure the "avatars" storage bucket exists and is public.');
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setFormData({ ...formData, avatar_url: data.publicUrl });
    }
    setIsUploading(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const profileData = {
      id: currentUser.id,
      name: formData.name || '',
      avatar_url: formData.avatar_url,
      batch: formData.batch || '',
      chemistry_batch: formData.chemistry_batch,
      hall_name: formData.hall_name || '',
      student_id: formData.student_id,
      department: formData.department || '',
      university: formData.university || '',
      current_status: formData.current_status || '',
      job_title: formData.job_title,
      institute_name: formData.institute_name,
      location: formData.location,
      permanent_address: formData.permanent_address,
      blood_group: formData.blood_group,
      bio: formData.bio,
      phone: formData.phone,
      is_phone_private: formData.is_phone_private ?? false,
      email: formData.email,
      social_links: formData.social_links || {},
      is_public: formData.is_public ?? true
    };

    if (!navigator.onLine) {
      await saveOfflineMutation('profile_update', profileData);
      const remaining = await getOfflineMutations();
      setPendingMutationsCount(remaining.length);
      
      // Update local profiles cache
      const localProfiles = await getLocalProfiles();
      const existingIndex = localProfiles.findIndex(p => p.id === currentUser.id);
      if (existingIndex >= 0) {
        localProfiles[existingIndex] = { ...localProfiles[existingIndex], ...profileData } as Profile;
      } else {
        localProfiles.push(profileData as Profile);
      }
      await saveProfilesLocally(localProfiles);
      setProfiles(localProfiles);
      
      setIsEditingProfile(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert([profileData]);

    if (error) {
      console.error('Error saving profile:', error);
      alert(`Failed to save profile: ${error.message || 'Unknown error'}. Please ensure all database columns are created correctly in Supabase.`);
    } else {
      // Optimistically update local cache to give immediate feedback
      setProfiles(prev => {
        const existingIndex = prev.findIndex(p => p.id === currentUser.id);
        const newProfiles = [...prev];
        if (existingIndex >= 0) {
          newProfiles[existingIndex] = { ...newProfiles[existingIndex], ...profileData } as Profile;
        } else {
          newProfiles.push(profileData as Profile);
        }
        
        // Also fire off background local storage save
        saveProfilesLocally(newProfiles).catch(e => console.error(e));
        return newProfiles;
      });
      
      // Update our form data wrapper
      setFormData(prev => ({ ...prev, ...profileData }));
      
      setIsEditingProfile(false);
      
      // Re-fetch in background to ensure sync with server
      fetchProfiles();
    }
  };

  const handleRequestVerification = async () => {
    if (!currentUser) return;
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: 'pending' })
      .eq('id', currentUser.id);
    
    if (error) {
      console.error('Error requesting verification:', error);
      alert('Failed to request verification.');
    } else {
      alert('Verification request submitted successfully!');
      fetchMyProfile();
      fetchProfiles();
    }
  };

  const handleVerifyProfile = async (profileId: string, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('profiles')
      .update({ verification_status: status })
      .eq('id', profileId);
    
    if (error) {
      console.error('Error updating verification status:', error);
      alert('Failed to update verification status.');
    } else {
      alert(`Profile ${status === 'verified' ? 'approved' : 'rejected'} successfully.`);
      fetchProfiles();
      if (profileId === currentUser?.id) {
        fetchMyProfile();
      }
    }
  };

  const handleTeacherAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !isAdmin) return;

    try {
      setIsCreatingTeacher(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `teacher_${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      
      setTeacherForm(prev => ({ ...prev, avatar_url: data.publicUrl }));
    } catch (error: any) {
      console.error('Error uploading teacher photo:', error);
      alert('Error uploading photo: ' + error.message);
    } finally {
      setIsCreatingTeacher(false);
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !isAdmin) return;
    setIsCreatingTeacher(true);
    
    try {
      const teacherData = {
        name: teacherForm.name,
        designation: teacherForm.designation,
        department: teacherForm.department,
        university: teacherForm.university,
        phone: teacherForm.phone,
        email: teacherForm.email,
        avatar_url: teacherForm.avatar_url
      };

      if (teacherForm.id) {
        // Optimistic update for edit
        const updatedTeachers = teachers.map(t => t.id === teacherForm.id ? { ...t, ...teacherData } as Teacher : t);
        setTeachers(updatedTeachers);
        localStorage.setItem('chem_teachers', JSON.stringify(updatedTeachers));

        const { error } = await supabase.from('teachers').update(teacherData).eq('id', teacherForm.id);
        if (error) {
          fetchTeachers(); // rollback
          throw error;
        }
      } else {
        const { error } = await supabase.from('teachers').insert([teacherData]);
        if (error) throw error;
        fetchTeachers(); // fetch newly created
      }

      setTeacherForm({ id: undefined, name: '', designation: '', department: 'Chemistry', university: 'University of Rajshahi', phone: '', email: '', avatar_url: undefined });
      setShowTeacherForm(false);
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      alert('Failed to save teacher: ' + error.message);
    } finally {
      setIsCreatingTeacher(false);
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    if (!isAdmin) return;
    const confirm = window.confirm('Are you sure you want to delete this teacher?');
    if (!confirm) return;

    try {
      // Optimistic update
      const updatedTeachers = teachers.filter(t => t.id !== id);
      setTeachers(updatedTeachers);
      localStorage.setItem('chem_teachers', JSON.stringify(updatedTeachers));

      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) {
        // Rollback on error
        fetchTeachers();
        throw error;
      }
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher: " + error.message);
    }
  };

  const toggleBookmark = async (profileId: string) => {
    if (!currentUser) return;
    const isBookmarked = bookmarks.has(profileId);
    if (isBookmarked) {
      await supabase.from('bookmarks').delete().match({ user_id: currentUser.id, profile_id: profileId });
      setBookmarks(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    } else {
      await supabase.from('bookmarks').insert([{ user_id: currentUser.id, profile_id: profileId }]);
      setBookmarks(prev => new Set(prev).add(profileId));
    }
  };

  const handleExportPDF = () => {
    const profilesToExport = profiles.filter(p => 
      (!exportBatch || p.batch === exportBatch) && 
      (!exportChemistryBatch || p.chemistry_batch === exportChemistryBatch)
    );
    const doc = new jsPDF('landscape');
    
    // Add a nice header background
    doc.setFillColor(13, 148, 136); // Teal 600
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    // Title
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255); // White
    doc.text('ChemConnect Directory', 14, 22);
    
    // Subtitle
    doc.setFontSize(12);
    doc.setTextColor(204, 251, 241); // Teal 100
    
    let subtitle = 'Chemistry Dept, University of Rajshahi - Official Member List';
    if (exportBatch && exportChemistryBatch) {
      subtitle += ` (Batch ${exportBatch}, Chem Batch ${exportChemistryBatch})`;
    } else if (exportBatch) {
      subtitle += ` (Batch ${exportBatch})`;
    } else if (exportChemistryBatch) {
      subtitle += ` (Chem Batch ${exportChemistryBatch})`;
    }
    
    doc.text(subtitle, 14, 30);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.width - 14, 22, { align: 'right' });
    
    const tableColumn = ["Name", "Batch", "Status", "Job Title", "Institute", "Location", "Phone", "Email"];
    const tableRows = profilesToExport.map(p => [
      p.name || 'N/A',
      p.batch || 'N/A',
      p.current_status || 'N/A',
      p.job_title || 'N/A',
      p.institute_name || 'N/A',
      p.location || 'N/A',
      p.phone || 'N/A',
      p.email || 'N/A'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      theme: 'grid',
      headStyles: { 
        fillColor: [13, 148, 136], 
        textColor: 255, 
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [51, 65, 85] // Slate 700
      },
      alternateRowStyles: { 
        fillColor: [248, 250, 252] // Slate 50
      },
      styles: { 
        cellPadding: 4,
        lineColor: [226, 232, 240], // Slate 200
        lineWidth: 0.1
      },
      columnStyles: {
        0: { fontStyle: 'bold', textColor: [15, 23, 42] } // Name column darker
      }
    });

    // Add footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.text(
        `Page ${i} of ${pageCount} - ChemConnect Directory`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      );
    }

    doc.save(`bondhon_directory${exportBatch ? `_batch_${exportBatch}` : ''}${exportChemistryBatch ? `_chem_${exportChemistryBatch}` : ''}.pdf`);
  };

  const handleExportCSV = () => {
    const profilesToExport = profiles.filter(p => 
      (!exportBatch || p.batch === exportBatch) && 
      (!exportChemistryBatch || p.chemistry_batch === exportChemistryBatch)
    );
    const headers = ['Name', 'Email', 'Phone', 'Batch', 'Chemistry Batch', 'Department', 'University', 'Current Status', 'Job Title', 'Institute', 'Location', 'Permanent Address'];
    const csvContent = [
      headers.join(','),
      ...profilesToExport.map(p => [
        `"${p.name || ''}"`,
        `"${p.email || ''}"`,
        `"${p.phone || ''}"`,
        `"${p.batch || ''}"`,
        `"${p.chemistry_batch || ''}"`,
        `"${p.department || ''}"`,
        `"${p.university || ''}"`,
        `"${p.current_status || ''}"`,
        `"${p.job_title || ''}"`,
        `"${p.institute_name || ''}"`,
        `"${p.location || ''}"`,
        `"${p.permanent_address || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bondhon_directory${exportBatch ? `_batch_${exportBatch}` : ''}${exportChemistryBatch ? `_chem_${exportChemistryBatch}` : ''}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    // Safety check - don't allow deleting self through this UI
    if (userToDelete.id === currentUser?.id) {
      alert("You cannot delete your own admin account from here.");
      setUserToDelete(null);
      return;
    }

    try {
      console.log("Attempting to delete user:", userToDelete.id);
      const { error, status } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
      
      if (error) {
        console.error("Supabase deletion error:", error);
        alert(`Failed to remove member.\nError: ${error.message}\nCode: ${error.code}\nStatus: ${status}`);
      } else {
        alert('Member removed successfully and database synchronized.');
        fetchProfiles();
      }
    } catch (err: any) {
      console.error("Unexpected deletion error:", err);
      alert('An unexpected error occurred during deletion: ' + (err.message || 'Check console for details'));
    } finally {
      setUserToDelete(null);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailToAdd) return;
    setIsAddingAdmin(true);
    
    // Check if user exists first
    const { data: userExists, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmailToAdd)
      .single();

    if (searchError || !userExists) {
      alert('No user found with this email. Make sure they have registered.');
      setIsAddingAdmin(false);
      return;
    }

    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('email', adminEmailToAdd);
    setIsAddingAdmin(false);
    if (error) {
      alert('Failed to add admin: ' + error.message);
    } else {
      alert('Admin added successfully!');
      setAdminEmailToAdd('');
      fetchProfiles();
    }
  };

  const toggleUserRole = async (profileId: string, currentRole: string) => {
    if (!isAdmin) return;
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', profileId);
    if (error) alert('Failed to update role');
    else fetchProfiles();
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsLoading(true);
    
    if (authMode === 'register') {
      const { data, error } = await supabase.auth.signUp({
        email: authForm.email,
        password: authForm.password,
        options: {
          data: { full_name: authForm.name }
        }
      });
      
      if (error) setAuthError(error.message);
      else if (data.user && !data.session) setAuthError('Registration successful! Please check your email to confirm your account.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: authForm.email,
        password: authForm.password,
      });
      if (error) setAuthError(error.message);
    }
    setIsLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthForm({ name: '', email: '', password: '' });
    setFormData(INITIAL_FORM_DATA);
    setActiveTab('feed');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(date);
  };

  const uniqueBatches = Array.from(new Set(profiles.map(p => p.batch).filter(Boolean))).sort();
  const uniqueChemistryBatches = Array.from(new Set(profiles.map(p => p.chemistry_batch).filter(Boolean))).sort();
  const uniqueBloodGroups = Array.from(new Set(profiles.map(p => p.blood_group).filter(Boolean))).sort();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        <MoleculeBackground />
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center text-indigo-700"
          >
            <div className="bg-white p-2 rounded-3xl shadow-2xl shadow-indigo-100/50 border border-indigo-50/50 w-24 h-24 flex items-center justify-center">
               <img src={heroImageUrl || defaultHeroImage} alt="Logo" className="w-full h-full object-cover rounded-2xl" />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center text-4xl font-extrabold text-slate-900 tracking-tight font-display"
          >
            ChemConnect
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center text-sm text-slate-500 font-medium"
          >
            Chemistry Student and Alumni Network
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        >
          <div className="glass-card py-10 px-4 sm:rounded-[2.5rem] sm:px-10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-slate-900 mb-8 text-center tracking-tight">
                {authMode === 'login' ? 'Welcome Back' : 'Join ChemConnect'}
              </h3>
            
            {authError && (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="mb-8 bg-red-50/50 backdrop-blur-sm border border-red-100 text-red-600 px-4 py-4 rounded-2xl text-sm font-medium flex items-center space-x-3"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <span>{authError}</span>
              </motion.div>
            )}

            <form className="space-y-6" onSubmit={handleAuth}>
              {authMode === 'register' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name</label>
                  <input
                    required
                    type="text"
                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900"
                    value={authForm.name}
                    onChange={e => setAuthForm({...authForm, name: e.target.value})}
                    placeholder="Rahim Uddin"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email address</label>
                <input
                  required
                  type="email"
                  className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900"
                  value={authForm.email}
                  onChange={e => setAuthForm({...authForm, email: e.target.value})}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Password</label>
                <input
                  required
                  type="password"
                  className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none text-slate-900"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-indigo-200/50 text-base font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 premium-button"
                >
                  {authMode === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>

            <div className="mt-10 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
                className="text-slate-500 hover:text-indigo-600 font-bold text-sm transition-colors"
              >
                {authMode === 'login' ? (
                  <>Don't have an account? <span className="text-indigo-600 underline underline-offset-4">Register here</span></>
                ) : (
                  <>Already have an account? <span className="text-indigo-600 underline underline-offset-4">Sign in here</span></>
                )}
              </button>
            </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans pb-20 sm:pb-8 pt-20 relative">
      <MoleculeBackground />
      {/* Header */}
      <header className="bg-[#1e3a8a]/90 backdrop-blur-2xl border-b border-white/10 shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div 
                animate={{ 
                  y: [0, -4, 0],
                  scale: [1, 1.05, 1]
                }}
                transition={{ 
                  duration: 4, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="bg-gradient-to-br from-white/20 to-white/5 p-1 rounded-2xl text-white shadow-lg shadow-black/10 border border-white/20 relative overflow-hidden w-14 h-14 shrink-0 flex items-center justify-center"
              >
                <img src={heroImageUrl || defaultHeroImage} alt="Logo" className="w-full h-full object-cover rounded-xl relative z-10" />
                <motion.div 
                  animate={{ y: [20, -20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-1/2 bg-white/20 blur-xl"
                />
              </motion.div>
              <div>
                <h1 className="text-xl font-black tracking-tight font-display text-white drop-shadow-sm leading-tight">
                  ChemConnect
                </h1>
                <div className="flex items-center space-x-2">
                  <span className="h-[2px] w-4 bg-blue-400 rounded-full"></span>
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Student & Alumni Hub</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-1 bg-white/10 p-1.5 rounded-2xl border border-white/10 relative">
              {[
                { id: 'feed', icon: LayoutGrid, label: 'Feed' },
                { id: 'directory', icon: Users, label: 'Directory' },
                { id: 'messages', icon: MessageSquare, label: 'Messages' },
                { id: 'teachers', icon: Users, label: 'Teachers' },
                { id: 'saved', icon: Bookmark, label: 'Saved' },
                { id: 'profile', icon: UserIcon, label: 'Profile' },
                ...(isAdmin ? [{ id: 'admin', icon: Database, label: 'Admin' }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'profile') setIsEditingProfile(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center space-x-2.5 relative z-10 ${
                    activeTab === tab.id 
                      ? 'text-white' 
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={16} className={`transition-all duration-500 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="desktop-nav-active"
                      className="absolute inset-0 bg-white/20 rounded-xl shadow-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden xl:flex flex-col items-end mr-4">
                 <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-0.5">Logged in as</span>
                 <span className="text-xs font-black text-white truncate max-w-[150px] uppercase tracking-wider">{myProfile?.name || currentUser?.email}</span>
              </div>

              <div className="hidden sm:flex items-center space-x-2 mr-4">
                {syncStatus === 'syncing' ? (
                  <span className="flex items-center text-xs font-bold text-amber-300 bg-amber-500/20 px-3 py-1.5 rounded-full border border-amber-500/30">
                    <Loader2 size={14} className="animate-spin mr-1.5" /> Syncing...
                  </span>
                ) : !isOnline ? (
                  <span className="flex items-center text-xs font-bold text-rose-300 bg-rose-500/20 px-3 py-1.5 rounded-full border border-rose-500/30">
                    <CloudOff size={14} className="mr-1.5" /> Offline ({pendingMutationsCount} pending)
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center text-xs font-bold text-blue-300 bg-blue-500/20 px-3 py-1.5 rounded-full border border-blue-500/30">
                      <Cloud size={14} className="mr-1.5" /> Online
                    </span>
                    {pendingMutationsCount > 0 && (
                      <button 
                        onClick={syncData}
                        className="flex items-center text-xs font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-full transition-colors"
                      >
                        Sync Now ({pendingMutationsCount})
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-white/50 uppercase tracking-widest">Logged in as</span>
                <span className="text-sm font-bold text-white">{currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-white/10 text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 border border-white/10"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Database Error Banner */}
      {dbError && (
        <div className="bg-amber-50 border-b border-amber-200 p-4">
          <div className="max-w-7xl mx-auto flex items-start space-x-3">
            <Database className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-800">Supabase Connection Issue</h3>
              <p className="text-sm text-amber-700 mt-1">{dbError}</p>
              <details className="mt-3">
                <summary className="text-xs text-indigo-600 font-bold cursor-pointer hover:underline">
                  Click to view SQL Setup Script (Run this in your Supabase SQL Editor if tables are missing)
                </summary>
                <div className="mt-3 bg-white p-3 rounded border border-amber-200 overflow-x-auto text-[10px] font-mono text-slate-800 max-h-[300px] custom-scrollbar">
                  <pre>{`-- SQL MASTER SETUP (Run this in Supabase SQL Editor)

-- 1. Profiles table
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  batch text,
  chemistry_batch text,
  student_id text,
  hall_name text,
  department text default 'Chemistry',
  university text default 'University of Rajshahi',
  current_status text,
  job_title text,
  institute_name text,
  location text,
  permanent_address text,
  blood_group text,
  bio text,
  phone text,
  is_phone_private boolean default false,
  email text,
  social_links jsonb default '{}'::jsonb,
  is_public boolean default true,
  role text default 'user',
  verification_status text default 'none',
  created_at timestamp with time zone default now()
);

-- 2. News Feed (Posts)
create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  image_url text,
  likes text[] default '{}',
  comments jsonb[] default '{}',
  created_at timestamp with time zone default now()
);

-- 3. Teachers
create table if not exists teachers (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  designation text not null,
  department text not null,
  university text not null,
  phone text,
  email text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- 4. Site Config
create table if not exists site_config (
  key text primary key,
  value text not null,
  updated_at timestamp with time zone default now()
);

-- 5. Bookmarks
create table if not exists bookmarks (
  user_id uuid references profiles(id) on delete cascade not null,
  profile_id uuid references profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  primary key (user_id, profile_id)
);

-- 6. Storage Buckets & Policies
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('post-images', 'post-images', true) on conflict do nothing;

create policy "Public Access" on storage.objects for select using (bucket_id = 'avatars' or bucket_id = 'post-images');
create policy "Authenticated Upload" on storage.objects for insert with check (auth.role() = 'authenticated' and (bucket_id = 'avatars' or bucket_id = 'post-images'));
create policy "Authenticated Update" on storage.objects for update with check (auth.role() = 'authenticated' and (bucket_id = 'avatars' or bucket_id = 'post-images'));

-- Note: You may still need to enable RLS or set policies in the Storage UI if uploads fail.

-- 7. Security (RLS Policies)
-- First drop existing policies to avoid "already exists" errors
drop policy if exists "profiles_all" on profiles;
drop policy if exists "profiles_self" on profiles;
drop policy if exists "profiles_admin" on profiles;
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;
drop policy if exists "profiles_delete" on profiles;
drop policy if exists "posts_all" on posts;
drop policy if exists "posts_write" on posts;
drop policy if exists "posts_owner" on posts;
drop policy if exists "teachers_all" on teachers;
drop policy if exists "teachers_admin" on teachers;
drop policy if exists "bookmarks_owner" on bookmarks;

alter table profiles enable row level security;
create policy "profiles_select" on profiles for select using (true);

create policy "profiles_insert" on profiles for insert with check (auth.uid() = id);

create policy "profiles_update" on profiles for update using (
  auth.uid() = id 
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com' 
  OR auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
  OR (select role from profiles where id = auth.uid()) = 'admin'
);

create policy "profiles_delete" on profiles for delete using (
  auth.uid() = id 
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com' 
  OR auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
  OR (select role from profiles where id = auth.uid()) = 'admin'
);

alter table posts enable row level security;
create policy "posts_all" on posts for select using (true);
create policy "posts_write" on posts for insert with check (auth.uid() = author_id);
create policy "posts_owner" on posts for all using (
  auth.uid() = author_id 
  OR (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com'
);

alter table site_config enable row level security;
create policy "config_all" on site_config for select using (true);
create policy "config_admin" on site_config for all using (
  (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com'
);

alter table teachers enable row level security;
create policy "teachers_all_select" on teachers for select using (true);
create policy "teachers_admin_insert" on teachers for insert with check (
  (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com'
  OR auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);
create policy "teachers_admin_update" on teachers for update using (
  (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com'
  OR auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);
create policy "teachers_admin_delete" on teachers for delete using (
  (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  OR auth.jwt() ->> 'email' = 'chembondhon@gmail.com'
  OR auth.jwt() ->> 'email' = 'fllimonm1212@gmail.com'
);

alter table bookmarks enable row level security;
create policy "bookmarks_owner" on bookmarks for all using (auth.uid() = user_id);
`}</pre>
                </div>
              </details>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 z-40 pb-safe shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        <div className="flex overflow-x-auto hide-scrollbar px-2">
          {[
            { id: 'feed', icon: LayoutGrid, label: 'Home' },
            { id: 'directory', icon: Users, label: 'Directory' },
            { id: 'messages', icon: MessageSquare, label: 'Messages' },
            { id: 'teachers', icon: Users, label: 'Teachers' },
            { id: 'saved', icon: Bookmark, label: 'Saved' },
            { id: 'profile', icon: UserIcon, label: 'Profile' },
            ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : [])
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                if (item.id === 'profile') setIsEditingProfile(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex-none w-[72px] py-4 flex flex-col items-center justify-center relative group"
            >
            <div className={`relative z-10 transition-all duration-300 ${activeTab === item.id ? 'text-white -translate-y-1' : 'text-slate-400'}`}>
              <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]' : ''} />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${activeTab === item.id ? 'text-indigo-800 opacity-100 scale-100' : 'text-slate-400 opacity-60 scale-90'}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="mobile-nav-active"
                className="absolute inset-x-2 inset-y-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-2xl -z-0 border border-indigo-400/50 shadow-lg shadow-indigo-200/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {/* FEED TAB */}
          {activeTab === 'feed' && (
            <motion.div
              key="feed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              {/* Hero Section */}
              <div className="relative rounded-[2.5rem] overflow-hidden bg-indigo-900 premium-shadow">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-900 to-slate-900"></div>
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
                <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center gap-12">
                  <div className="flex-1 text-center md:text-left">
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="inline-flex items-center space-x-2 bg-indigo-500/30 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-400/30 mb-6"
                    >
                      <Sparkles size={16} className="text-indigo-200" />
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-100 italic">Official Student & Alumni Network</span>
                    </motion.div>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-6 underline-offset-8 decoration-indigo-500/50">
                      Welcome Home, <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-indigo-100">Students & Alumni</span>
                    </h1>
                    <p className="text-lg text-indigo-100/70 font-medium max-w-xl leading-relaxed mb-10">
                      Stay connected with your classmates, share opportunities, and keep the Spirit of Chemistry alive across generations.
                    </p>
                    <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                      <button 
                        onClick={() => setActiveTab('directory')}
                        className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-950/20 active:scale-95"
                      >
                        Explore Directory
                      </button>
                      <button 
                         onClick={() => setActiveTab('teachers')}
                        className="px-8 py-4 bg-indigo-500/20 backdrop-blur-md text-white border border-white/20 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-500/30 transition-all active:scale-95"
                      >
                        View Teachers
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 hidden md:block relative group">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-125 transition-transform group-hover:scale-150 duration-1000"></div>
                    <img 
                      src={heroImageUrl || defaultHeroImage} 
                      alt="ChemConnect Network" 
                      className="relative z-10 w-full aspect-square object-cover rounded-[3rem] shadow-2xl rotate-3 group-hover:rotate-0 transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Total Students & Alumni', count: profiles.length, icon: Users, color: 'indigo', action: () => setActiveTab('directory') },
                  { label: 'Teachers', count: teachers.length, icon: Calendar, color: 'blue', action: () => setActiveTab('teachers') },
                  { label: 'Saved Contacts', count: bookmarks.size, icon: Bookmark, color: 'slate', action: () => setActiveTab('saved') }
                ].map((stat, idx) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    onClick={stat.action}
                    className="glass-card p-8 rounded-[2rem] premium-shadow premium-hover cursor-pointer relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] group-hover:scale-110 transition-transform duration-1000"></div>
                    <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl w-fit mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all`}>
                      <stat.icon size={28} />
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{stat.label}</h4>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.count}</p>
                    </div>
                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      <ArrowRight className={`text-${stat.color}-400`} size={24} />
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Announcement Banner */}
              <div className="glass-card p-6 sm:p-10 rounded-[2.5rem] premium-shadow border-slate-100 relative overflow-hidden bg-white">
                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="p-5 bg-amber-50 rounded-3xl text-amber-600 shadow-sm">
                    <ShieldCheck size={40} />
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2 uppercase italic">Verified Network</h3>
                    <p className="text-slate-600 font-medium leading-relaxed max-w-2xl">
                      Welcome to the official student and alumni platform for RU Chemistry students. Our goal is to create a secure space for all past and present students to connect and support each other.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                  >
                    Verify Profile
                  </button>
                </div>
              </div>

              {/* NEWS FEED SECTION */}
              {isFeedEnabled && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between px-4">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase italic">Community Feed</h3>
                    <button className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:underline">View All Updates</button>
                  </div>
                  
                  {/* Create Post Card */}
                  {currentUser && (
                    <div className="glass-card p-6 rounded-[2rem] premium-shadow border-slate-100 bg-white">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 overflow-hidden">
                        {formData.avatar_url ? (
                          <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={24} />
                        )}
                      </div>
                      <div className="flex-1 space-y-4">
                        <textarea
                          placeholder="Share something with the student and alumni network..."
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-medium min-h-[100px] resize-none"
                          value={newPostContent}
                          onChange={(e) => setNewPostContent(e.target.value)}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex gap-2">
                             <input 
                               type="file" 
                               ref={postImageInputRef} 
                               className="hidden" 
                               accept="image/*"
                               onChange={(e) => setPostImageFile(e.target.files?.[0] || null)}
                             />
                             <button 
                               onClick={() => postImageInputRef.current?.click()}
                               className={`p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${postImageFile ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : ''}`}
                             >
                               <Camera size={16} />
                               {postImageFile ? 'Photo Selected' : 'Add Photo'}
                             </button>
                          </div>
                          <button
                            onClick={async () => {
                              if (!newPostContent.trim()) return;
                              setIsCreatingPost(true);
                              let imageUrl = '';
                              
                              if (postImageFile) {
                                const fileExt = postImageFile.name.split('.').pop();
                                const fileId = Math.random().toString(36).substring(7);
                                const filePath = `posts/${fileId}_${Date.now()}.${fileExt}`;
                                
                                const { error: uploadError } = await supabase.storage
                                  .from('post-images')
                                  .upload(filePath, postImageFile);
                                
                                if (!uploadError) {
                                  const { data: { publicUrl } } = supabase.storage
                                    .from('post-images')
                                    .getPublicUrl(filePath);
                                  imageUrl = publicUrl;
                                }
                              }

                              const success = await createPost(newPostContent, imageUrl);
                              if (success) {
                                setNewPostContent('');
                                setPostImageFile(null);
                              }
                              setIsCreatingPost(false);
                            }}
                            disabled={!newPostContent.trim() || isCreatingPost}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200/50 disabled:opacity-50 flex items-center gap-2"
                          >
                            {isCreatingPost ? <Loader2 size={14} className="animate-spin" /> : <MessageSquare size={14} />}
                            Post Update
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Posts List */}
                <div className="space-y-6">
                  {posts.length === 0 ? (
                    <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                      <MessageSquare className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No posts yet. Be the first to share!</p>
                    </div>
                  ) : (
                    posts.map((post, idx) => (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * idx }}
                        className="glass-card p-6 rounded-[2.5rem] premium-shadow bg-white border-slate-100 flex flex-col gap-6"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 overflow-hidden shrink-0 border border-indigo-100">
                              {post.profiles?.avatar_url ? (
                                <img src={post.profiles.avatar_url} alt={post.profiles.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black text-xl">
                                  {post.profiles?.name?.[0]}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-slate-900 tracking-tight">{post.profiles?.name || 'Anonymous Student/Alumni'}</h4>
                                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                  Batch {post.profiles?.chemistry_batch || 'N/A'}
                                </span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(post.created_at).toLocaleDateString()} • {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          {(currentUser?.id === post.author_id || isAdmin) && (
                            <button 
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this post?')) {
                                  deletePost(post.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>

                        <div className="text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                          {post.content}
                        </div>

                        {post.image_url && (
                          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm transition-transform hover:scale-[1.01] duration-500">
                            <img 
                              src={post.image_url} 
                              alt="Post" 
                              className="w-full h-auto max-h-[500px] object-cover" 
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        <div className="pt-4 border-t border-slate-50 flex items-center gap-6">
                           <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors">
                             <CheckCircle size={18} className="text-slate-300" />
                             Useful ({post.likes?.length || 0})
                           </button>
                           <button className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-[10px] font-black uppercase tracking-widest transition-colors">
                             <MessageSquare size={18} className="text-slate-300" />
                             Comment ({post.comments?.length || 0})
                           </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
              )}
            </motion.div>
          )}

          {/* DIRECTORY TAB */}
          {activeTab === 'directory' && (
            <motion.div 
              key="directory"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
            >
            <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl premium-shadow mb-8 sm:mb-10 flex flex-col gap-4 sm:gap-6">
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-center w-full">
                <div className="relative flex-1 w-full">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students or alumni by name, batch, location..."
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar w-full lg:w-auto">
                  {(['All', 'Classmates', ...STATUS_OPTIONS] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status as any)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                        filterStatus === status 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                      }`}
                    >
                      {status === 'Classmates' ? 'Your Classmates' : status}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 w-full pt-4 border-t border-slate-100">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Batch</label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  >
                    <option value="All">All Batches</option>
                    {uniqueChemistryBatches.map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Blood Group</label>
                  <select
                    value={filterBloodGroup}
                    onChange={(e) => setFilterBloodGroup(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  >
                    <option value="All">All Blood Groups</option>
                    {uniqueBloodGroups.map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-slate-700 font-medium"
                  >
                    <option value="batch_asc">Batch (Oldest First)</option>
                    <option value="batch_desc">Batch (Newest First)</option>
                    <option value="name_asc">Name (A-Z)</option>
                    <option value="name_desc">Name (Z-A)</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="Grid View"
                    >
                      <LayoutGrid size={18} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      title="List View"
                    >
                      <List size={18} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                Showing {filteredProfiles.length} Members
              </div>
            </div>

            <div className="space-y-16">
              {filteredProfiles.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                  <Database className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No members found in directory.</p>
                </div>
              ) : viewMode === 'grid' ? (
                groupedProfiles.map(([batch, profilesInBatch]) => (
                  <div key={batch} className="space-y-8 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent -mx-4 sm:-mx-8 px-4 sm:px-8 pt-12 -mt-12 rounded-[3rem] -z-10 border-t border-indigo-100/50"></div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-lg shadow-lg shadow-indigo-200/50 flex items-center border border-indigo-400/30">
                        <FlaskConical size={20} className="mr-2 opacity-80" />
                        {batch === 'N/A' ? 'Batch Not Specified' : `Chemistry Batch ${batch}`}
                      </div>
                      <div className="h-px flex-1 bg-gradient-to-r from-indigo-600/50 to-transparent"></div>
                    </div>
                    
                    <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8">
                      <AnimatePresence>
                        {profilesInBatch.map((profile, idx) => (
                          <motion.div
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4, delay: idx * 0.05 }}
                            key={profile.id}
                            id={`profile-card-${profile.id}`}
                            className="glass-card min-w-[320px] max-w-[350px] sm:min-w-[350px] snap-center shrink-0 rounded-2xl sm:rounded-[2rem] premium-shadow premium-hover overflow-hidden group flex flex-col cursor-pointer relative bg-white"
                            onClick={() => setSelectedProfile(profile)}
                          >
                            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none z-0"></div>
                            <div className="h-32 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 relative overflow-hidden z-10">
                              <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                              <Hexagon className="absolute -right-6 -top-6 w-32 h-32 text-white opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                              <Atom className="absolute -left-4 -bottom-4 w-24 h-24 text-indigo-300 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                              <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); downloadSpecificCard(`profile-card-${profile.id}`, profile.name); }}
                                  disabled={downloadingCardId === `profile-card-${profile.id}`}
                                  className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50"
                                  title="Download Card"
                                >
                                  {downloadingCardId === `profile-card-${profile.id}` ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                                </button>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); toggleBookmark(profile.id); }}
                                  className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all border border-white/10"
                                  title={bookmarks.has(profile.id) ? "Remove Bookmark" : "Add Bookmark"}
                                >
                                  <Bookmark size={18} className={bookmarks.has(profile.id) ? "fill-current text-yellow-400" : ""} />
                                </button>
                              </div>
                            </div>
                            <div className="px-6 pb-6 flex-1 flex flex-col relative z-10">
                              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none -z-10"></div>
                              <div className="-mt-16 mb-4 relative">
                                {profile.avatar_url ? (
                                  <img src={profile.avatar_url} alt={profile.name} className="h-28 w-28 rounded-3xl border-[6px] border-white bg-white object-cover shadow-xl group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                  <div className="h-28 w-28 rounded-3xl border-[6px] border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-4xl font-black shadow-xl group-hover:scale-105 transition-transform duration-500">
                                    {profile.name?.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="absolute bottom-2 left-20">
                                  <div className="w-5 h-5 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                                </div>
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-black text-slate-900 leading-tight flex items-center group-hover:text-indigo-700 transition-colors tracking-tight">
                                  {profile.name}
                                  <UserBadges profile={profile} size={20} />
                                </h3>
                                <div className="mt-1.5 text-sm text-indigo-700 font-bold line-clamp-2 min-h-[2.5rem] bg-indigo-50/50 inline-block px-3 py-1 rounded-lg border border-indigo-100/50">
                                  {profile.job_title || profile.current_status} {profile.job_title && profile.institute_name && ' at '} {profile.institute_name}
                                </div>
                                
                                <div className="mt-5 space-y-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    {profile.location && (
                                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                        <MapPin size={12} className="mr-1.5 text-indigo-600"/> {profile.location}
                                      </span>
                                    )}
                                    <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                      <FlaskConical size={12} className="mr-1.5 text-indigo-600"/> {profile.chemistry_batch ? `Batch ${profile.chemistry_batch}` : 'N/A'}
                                    </span>
                                    {profile.student_id && (
                                      <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
                                        <Hash size={12} className="mr-1.5 text-indigo-600"/> ID: {profile.student_id}
                                      </span>
                                    )}
                                  </div>
                                  
                                  <div className="text-xs text-slate-500 space-y-2 mt-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                    {profile.department && profile.university && (
                                      <div className="flex flex-col gap-1.5">
                                        <div className="flex items-start gap-2.5">
                                          <Atom size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                          <span className="font-medium text-slate-700">{profile.department}, {profile.university}</span>
                                        </div>
                                        {profile.hall_name && (
                                          <div className="flex items-start gap-2.5 ml-6">
                                            <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{profile.hall_name}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {profile.email && (
                                      <div className="flex items-center gap-2.5">
                                        <Mail size={14} className="text-slate-400 shrink-0" />
                                        <span className="truncate font-medium">{profile.email}</span>
                                      </div>
                                    )}
                                    {profile.phone && (!profile.is_phone_private || isAdmin || currentUser?.id === profile.id) && (
                                      <div className="flex items-center gap-2.5">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span className="font-medium">{profile.phone}</span>
                                      </div>
                                    )}
                                    {profile.phone && profile.is_phone_private && !isAdmin && currentUser?.id !== profile.id && (
                                      <div className="flex items-center gap-2.5">
                                        <Phone size={14} className="text-slate-400 shrink-0" />
                                        <span className="italic text-slate-400 font-medium">Private</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {profile.bio && (
                                    <div className="mt-3 text-xs text-slate-600 italic line-clamp-3 bg-white p-3 rounded-xl border border-slate-100 shadow-sm relative">
                                      <div className="absolute top-2 left-2 text-slate-200">"</div>
                                      <span className="relative z-10 pl-3">{profile.bio}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-indigo-600 font-black text-xs uppercase tracking-widest group-hover:translate-x-1 transition-transform flex items-center">
                                  View Full Profile <ArrowRight size={14} className="ml-1" />
                                </span>
                                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                  <ArrowRight size={16} />
                                </div>
                              </div>
                              {/* Watermark for download */}
                              <div className="download-watermark hidden absolute bottom-4 right-4 items-center space-x-2 opacity-20 pointer-events-none">
                                <Atom size={24} className="text-indigo-900" />
                                <span className="font-black text-indigo-900 tracking-widest uppercase text-sm">ChemConnect</span>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-4">
                  <AnimatePresence>
                    {filteredProfiles.map((profile, idx) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.3, delay: Math.min(idx * 0.02, 0.2) }}
                        key={profile.id}
                        className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl premium-shadow premium-hover overflow-hidden group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 cursor-pointer relative bg-white"
                        onClick={() => setSelectedProfile(profile)}
                      >
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none z-0"></div>
                        <div className="relative shrink-0 z-10">
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt={profile.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-[3px] border-white bg-white object-cover shadow-md group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-[3px] border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-3xl font-black shadow-md group-hover:scale-105 transition-transform duration-500">
                              {profile.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2">
                            <UserBadges profile={profile} size={20} />
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0 z-10">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                            <h3 className="text-xl font-black text-slate-900 truncate group-hover:text-indigo-700 transition-colors tracking-tight">
                              {profile.name}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100">
                                <FlaskConical size={12} className="mr-1.5"/> Batch {profile.chemistry_batch || 'N/A'}
                              </span>
                              {profile.blood_group && (
                                <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-100">
                                  <Activity size={12} className="mr-1.5"/> {profile.blood_group}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-slate-600 font-medium truncate mb-3">
                            {profile.job_title || profile.current_status} {profile.job_title && profile.institute_name && ' at '} {profile.institute_name}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            {profile.location && (
                              <div className="flex items-center gap-1.5">
                                <MapPin size={14} className="text-slate-400" />
                                <span className="truncate max-w-[150px]">{profile.location}</span>
                              </div>
                            )}
                            {profile.email && (
                              <div className="flex items-center gap-1.5">
                                <Mail size={14} className="text-slate-400" />
                                <span className="truncate max-w-[180px]">{profile.email}</span>
                              </div>
                            )}
                            {profile.phone && (!profile.is_phone_private || isAdmin || currentUser?.id === profile.id) && (
                              <div className="flex items-center gap-1.5">
                                <Phone size={14} className="text-slate-400" />
                                <span>{profile.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="hidden sm:flex items-center justify-center h-10 w-10 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0 z-10">
                          <ArrowRight size={18} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}

          {/* PROFILE MANAGEMENT TAB */}
          {activeTab === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
            {!isEditingProfile ? (
              <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden relative">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="h-48 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <Hexagon className="absolute -right-10 -top-10 w-64 h-64 text-white opacity-5 rotate-12" />
                  <Atom className="absolute left-10 -bottom-10 w-48 h-48 text-indigo-300 opacity-10" />
                </div>
                
                <div className="pt-20 px-10 pb-10 relative">
                  <div className="absolute -top-16 left-10 group z-10">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt={formData.name} className="h-32 w-32 rounded-[2.5rem] border-4 border-white bg-white object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-4xl font-bold shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {formData.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Verification Status Banner (View Mode) */}
                  <div className="mb-10 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-inner">
                    <div className="flex items-center space-x-5">
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        (formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com' || formData.email === 'chembondhon@gmail.com') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        formData.verification_status === 'verified' ? 'bg-green-50 text-green-600 border border-green-100' :
                        formData.verification_status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        formData.verification_status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {(formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com' || formData.email === 'chembondhon@gmail.com') ? (
                          <div className="flex items-center space-x-2">
                            <KingBadge size={32} />
                            {formData.verification_status === 'verified' && <VerifiedBadge size={32} animated={true} />}
                          </div>
                        ) : formData.verification_status === 'verified' ? <VerifiedBadge size={32} /> : <Target size={32} />}
                      </div>
                      <div>
                        <div className="text-lg font-black text-slate-900 tracking-tight">
                          {
                            formData.verification_status === 'verified' ? 'Verified Member' :
                            formData.verification_status === 'pending' ? 'Verification Pending' :
                            formData.verification_status === 'rejected' ? 'Verification Rejected' :
                            'Unverified Profile'
                          }
                        </div>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Verified profiles gain access to premium networking tools.</p>
                      </div>
                    </div>
                    
                    {(formData.verification_status === 'none' || formData.verification_status === 'rejected' || !formData.verification_status) && (
                      <button
                        type="button"
                        onClick={handleRequestVerification}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 premium-button"
                      >
                        Get Verified Now
                      </button>
                    )}
                    
                    {formData.verification_status === 'pending' && (
                      <div className="text-amber-600 text-xs font-black uppercase tracking-widest bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 animate-pulse">
                        Under Review
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                    <div className="flex-1">
                      <h2 className="text-4xl font-black text-slate-900 flex items-center tracking-tight">
                        {formData.name}
                        <UserBadges profile={formData} size={32} />
                      </h2>
                      <div className="flex items-center mt-3 space-x-3">
                        <span className="text-indigo-700 font-bold bg-indigo-50 px-3 py-1 rounded-lg text-sm border border-indigo-100">
                          {formData.department}
                        </span>
                        <span className="text-slate-400 font-bold text-sm">•</span>
                        <span className="text-slate-600 font-bold text-sm">
                          {formData.university}
                        </span>
                        {formData.hall_name && (
                          <>
                            <span className="text-slate-400 font-bold text-sm">•</span>
                            <span className="text-amber-700 font-bold bg-amber-50 px-3 py-1 rounded-lg text-sm border border-amber-100">
                              {formData.hall_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center premium-button"
                    >
                      <Edit size={18} className="mr-2 text-indigo-600" /> Edit Profile Settings
                    </button>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Academic Background</h3>
                        <div className="space-y-5">
                          <div className="flex items-center group">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <GraduationCap size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University Session</p>
                              <p className="text-slate-900 font-bold">{formData.batch}</p>
                            </div>
                          </div>
                          {formData.chemistry_batch && (
                            <div className="flex items-center group">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <FlaskConical size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chemistry Batch</p>
                                <p className="text-slate-900 font-bold">{formData.chemistry_batch}</p>
                              </div>
                            </div>
                          )}
                          {formData.student_id && (
                            <div className="flex items-center group">
                              <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mr-4 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <BadgeCheck size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student ID</p>
                                <p className="text-slate-900 font-bold">{formData.student_id}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Professional Status</h3>
                        <div className="space-y-5">
                          <div className="flex items-center group">
                            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Briefcase size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Role</p>
                              <p className="text-slate-900 font-bold">{formData.job_title || formData.current_status}</p>
                            </div>
                          </div>
                          {formData.institute_name && (
                            <div className="flex items-center group">
                              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mr-4 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <Building2 size={20} />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Organization</p>
                                <p className="text-slate-900 font-bold">{formData.institute_name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">About Me</h3>
                        <p className="text-slate-700 leading-relaxed font-medium">
                          {formData.bio || "No bio provided yet. Add a short description about yourself to help others know you better."}
                        </p>
                      </div>

                      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Contact & Social</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {formData.email && (
                            <div className="flex items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <Mail size={16} className="text-indigo-600 mr-3" />
                              <span className="text-xs font-bold text-slate-700 truncate">{formData.email}</span>
                            </div>
                          )}
                          {formData.phone && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center truncate">
                                <Phone size={16} className="text-indigo-600 mr-3" />
                                <span className="text-xs font-bold text-slate-700 truncate">{formData.phone}</span>
                                {formData.is_phone_private && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md flex items-center">
                                    <EyeOff size={8} className="mr-1" /> Private
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleCopy(formData.phone!, 'profile-phone')}
                                className="p-1.5 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-indigo-600"
                                title="Copy Number"
                              >
                                {copiedId === 'profile-phone' ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                            </div>
                          )}
                          {formData.social_links?.facebook && (
                            <a href={formData.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-all">
                              <Facebook size={16} className="text-blue-600 mr-3" />
                              <span className="text-xs font-bold text-blue-700">Facebook</span>
                            </a>
                          )}
                          {formData.social_links?.linkedin && (
                            <a href={formData.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center p-3 bg-sky-50 rounded-2xl border border-sky-100 hover:bg-sky-100 transition-all">
                              <Linkedin size={16} className="text-sky-600 mr-3" />
                              <span className="text-xs font-bold text-sky-700">LinkedIn</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${formData.is_public ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      <span className="text-sm font-medium text-slate-600">
                        {formData.is_public ? 'Public Profile' : 'Private Profile'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Member since {new Date().getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden relative">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="p-6 sm:p-10 border-b border-slate-100 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 flex flex-col sm:flex-row justify-between items-start sm:items-center relative overflow-hidden z-10">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <Hexagon className="absolute -right-6 -top-6 w-32 h-32 text-white opacity-5 rotate-12" />
                  <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white tracking-tight">Edit Profile</h2>
                    <p className="text-indigo-100 mt-1 font-medium">Update your information in the ChemConnect directory.</p>
                  </div>
                  <div className="flex items-center space-x-3 mt-4 sm:mt-0 relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        if (myProfile) {
                          setFormData({
                            name: myProfile.name,
                            avatar_url: myProfile.avatar_url,
                            batch: myProfile.batch,
                            chemistry_batch: myProfile.chemistry_batch,
                            hall_name: myProfile.hall_name || '',
                            student_id: myProfile.student_id,
                            department: myProfile.department || '',
                            university: myProfile.university || '',
                            current_status: (myProfile.current_status as any) || '',
                            job_title: myProfile.job_title,
                            institute_name: myProfile.institute_name,
                            location: myProfile.location,
                            permanent_address: myProfile.permanent_address,
                            blood_group: myProfile.blood_group,
                            bio: myProfile.bio,
                            phone: myProfile.phone,
                            is_phone_private: myProfile.is_phone_private ?? false,
                            email: myProfile.email,
                            social_links: myProfile.social_links || {},
                            is_public: myProfile.is_public ?? true,
                            role: myProfile.role || 'member',
                            verification_status: myProfile.verification_status || 'none'
                          });
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-white/80 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md border border-white/20"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                      className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${
                        formData.is_public ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-slate-700 text-slate-200 shadow-slate-900/20'
                      }`}
                    >
                      {formData.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span className="hidden sm:inline">{formData.is_public ? 'Public Profile' : 'Private Profile'}</span>
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="p-6 sm:p-10 space-y-8 relative z-10">
                  {/* Verification Status */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        (formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com' || formData.email === 'chembondhon@gmail.com') ? 'bg-amber-100 text-amber-600' :
                        formData.verification_status === 'verified' ? 'bg-green-100 text-green-600' :
                        formData.verification_status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        formData.verification_status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {(formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com' || formData.email === 'chembondhon@gmail.com') ? (
                          <div className="flex items-center">
                            <KingBadge size={24} />
                            {formData.verification_status === 'verified' && <VerifiedBadge size={24} animated={true} />}
                          </div>
                        ) : formData.verification_status === 'verified' ? <VerifiedBadge size={24} /> : <Target size={24} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">
                          Verification Status: {
                            formData.verification_status === 'verified' ? 'Verified' :
                            formData.verification_status === 'pending' ? 'Pending Approval' :
                            formData.verification_status === 'rejected' ? 'Verification Rejected' :
                            'Not Verified'
                          }
                        </div>
                        <p className="text-xs text-slate-500">Verified profiles get a special badge and higher visibility.</p>
                      </div>
                    </div>
                    
                    {(formData.verification_status === 'none' || formData.verification_status === 'rejected' || !formData.verification_status) && (
                      <button
                        type="button"
                        onClick={handleRequestVerification}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        Request Verification
                      </button>
                    )}
                    
                    {formData.verification_status === 'pending' && (
                      <div className="text-amber-600 text-sm font-medium bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                        Under Review
                      </div>
                    )}
                  </div>

                  {/* Profile Picture */}
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
                  <div className="relative">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="Profile" className="h-24 w-24 rounded-full object-cover border-4 border-slate-100 shadow-sm" />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-50 shadow-sm">
                        <UserIcon size={40} className="text-slate-400" />
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition-colors"
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Profile Picture</h3>
                    <p className="text-sm text-slate-500">Upload a professional photo for your directory card.</p>
                  </div>
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
                      <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Session (e.g. 2019-20) *</label>
                      <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.batch || ''} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chemistry Batch No. (e.g. 50th)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 50th" value={formData.chemistry_batch || ''} onChange={(e) => setFormData({ ...formData, chemistry_batch: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Attached Hall Name</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Shaheed Ziaur Rahman Hall" value={formData.hall_name || ''} onChange={(e) => setFormData({ ...formData, hall_name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Optional)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 1910123456" value={formData.student_id || ''} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                      <input type="text" readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none" value={formData.department || 'Chemistry'} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">University</label>
                      <input type="text" readOnly className="w-full px-4 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg outline-none" value={formData.university || 'University of Rajshahi'} />
                    </div>
                  </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Current Status & Work</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Status *</label>
                      <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={formData.current_status || ''} onChange={(e) => setFormData({ ...formData, current_status: e.target.value as CurrentStatus })}>
                        <option value="" disabled>Select Status</option>
                        {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Title / Position</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Software Engineer" value={formData.job_title || ''} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Institute / Company Name</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Google" value={formData.institute_name || ''} onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Location & Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Location (City/Country)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Dhaka, Bangladesh" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Rajshahi, Bangladesh" value={formData.permanent_address || ''} onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                      <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={formData.blood_group || ''} onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">About</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bio / About Me</label>
                    <textarea rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Write a short bio about yourself..." value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Contact Information</h3>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_phone_private: !formData.is_phone_private })}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        formData.is_phone_private 
                          ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {formData.is_phone_private ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{formData.is_phone_private ? 'Phone Hidden' : 'Phone Public'}</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                      <input type="tel" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="01XXXXXXXXX" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Use the toggle above to hide your number from others.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="email@example.com" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
                      <input type="url" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://facebook.com/..." value={formData.social_links?.facebook || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                      <input type="url" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="https://linkedin.com/in/..." value={formData.social_links?.linkedin || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex justify-center items-center space-x-2">
                    <UserIcon size={20} />
                    <span>Save My Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      )}
          {activeTab === 'teachers' && (
            <motion.div 
              key="teachers"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
              className="max-w-5xl mx-auto"
            >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">Our Teachers</h2>
                  <button 
                    onClick={fetchTeachers}
                    disabled={isLoadingTeachers}
                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                  >
                    <ArrowRight className={`w-5 h-5 ${isLoadingTeachers ? 'animate-spin' : ''} rotate-180`} />
                  </button>
                </div>
                <p className="text-slate-500 font-medium">Meet the esteemed faculty of our Chemistry Department.</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowTeacherForm(!showTeacherForm)}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center premium-button"
                >
                  {showTeacherForm ? <X size={18} className="mr-2" /> : <UserIcon size={18} className="mr-2" />}
                  {showTeacherForm ? 'Close Form' : 'Add Teacher'}
                </button>
              )}
            </div>

            {showTeacherForm && isAdmin && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-12 overflow-hidden">
                <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-slate-100 premium-shadow">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{teacherForm.id ? 'Edit Teacher Details' : 'Teacher Details'}</h3>
                  <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g., Dr. Mst. Shamsur Rahman"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                          value={teacherForm.name}
                          onChange={(e) => setTeacherForm({ ...teacherForm, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designation</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g., Professor"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                          value={teacherForm.designation}
                          onChange={(e) => setTeacherForm({ ...teacherForm, designation: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Photo (Optional)</label>
                          <label className="w-full flex items-center justify-center px-5 py-4 bg-slate-50 border border-slate-100 border-dashed rounded-2xl cursor-pointer hover:bg-slate-100 transition-all text-sm font-medium text-slate-500 group relative overflow-hidden">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleTeacherAvatarUpload}
                              disabled={isCreatingTeacher}
                            />
                            {teacherForm.avatar_url ? (
                              <span className="text-emerald-600 font-bold flex items-center">
                                <CheckCircle size={16} className="mr-2" /> Uploaded Space
                              </span>
                            ) : (
                              <span className="flex items-center">
                                <Camera size={16} className="mr-2 group-hover:text-indigo-600 transition-colors" />
                                {isCreatingTeacher ? 'Uploading...' : 'Upload Photo'}
                              </span>
                            )}
                          </label>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Phone (Optional)</label>
                          <input
                            type="text"
                            placeholder="+880..."
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            value={teacherForm.phone || ''}
                            onChange={(e) => setTeacherForm({ ...teacherForm, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email (Optional)</label>
                          <input
                            type="email"
                            placeholder="teacher@ru.ac.bd"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                            value={teacherForm.email || ''}
                            onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="flex gap-4 mt-4">
                        <button
                          type="submit"
                          disabled={isCreatingTeacher}
                          className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-2xl font-black text-sm hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 premium-button"
                        >
                          {isCreatingTeacher ? 'Saving...' : (teacherForm.id ? 'Save Changes' : 'Add Teacher')}
                        </button>
                        {teacherForm.id && (
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherForm({ id: undefined, name: '', designation: '', department: 'Chemistry', university: 'University of Rajshahi', phone: '', email: '', avatar_url: undefined });
                              setShowTeacherForm(false);
                            }}
                            className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {isLoadingTeachers && teachers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-indigo-200 animate-spin mb-4" />
                <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Loading teachers...</p>
              </div>
            )}

            {!isLoadingTeachers && (
              <div className="flex flex-col gap-4">
              {teachers.map(teacher => (
                <motion.div
                  key={teacher.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl premium-shadow premium-hover overflow-hidden group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 relative bg-white"
                >
                  <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none z-0"></div>
                  <div className="relative shrink-0 z-10">
                    {teacher.avatar_url ? (
                      <img src={teacher.avatar_url} alt={teacher.name} className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-[3px] border-white bg-white object-cover shadow-md group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-[3px] border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-3xl font-black shadow-md group-hover:scale-105 transition-transform duration-500">
                        {teacher.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 z-10 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">
                        {teacher.name}
                      </h3>
                      {isAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => {
                              setTeacherForm(teacher);
                              setShowTeacherForm(true);
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                            className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Teacher"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDeleteTeacher(teacher.id)}
                            className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Teacher"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm font-bold text-indigo-700 truncate mb-3 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 inline-flex items-center">
                      <Briefcase size={14} className="mr-2" /> {teacher.designation}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-4">
                      {teacher.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate-400" />
                          <a href={`mailto:${teacher.email}`} className="truncate hover:text-indigo-600">{teacher.email}</a>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Atom size={14} className="text-slate-400" />
                        <span className="truncate">{teacher.department}, {teacher.university}</span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    {teacher.phone && (
                      <div className="flex flex-wrap items-center gap-2 mt-2 pt-4 border-t border-slate-100">
                        <a 
                          href={`tel:${teacher.phone}`}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2"
                        >
                          <Phone size={14} /> Call <span className="hidden sm:inline">{teacher.phone}</span>
                        </a>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(teacher.phone || '');
                            alert('Phone number copied to clipboard!');
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                          title="Copy Phone Number"
                        >
                          <Copy size={14} /> Copy
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {teachers.length === 0 && (
                <div className="col-span-full text-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-100 premium-shadow-sm">
                  <div className="w-24 h-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                    <Users className="h-12 w-12 text-indigo-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">No Teachers Added</h3>
                  <p className="text-slate-500 font-medium max-w-xs mx-auto">Admins can add teachers to display here.</p>
                </div>
              )}
            </div>
            )}
          </motion.div>
        )}

          {/* SAVED PROFILES TAB */}
          {activeTab === 'saved' && (
            <motion.div 
              key="saved"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
              className="max-w-6xl mx-auto"
            >
            <div className="mb-10">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Saved Connections</h2>
              <p className="text-slate-500 mt-2 font-medium">Quick access to the profiles you've bookmarked.</p>
            </div>
            
            <div className="flex overflow-x-auto gap-8 pb-8 snap-x snap-mandatory hide-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8">
              {profiles.filter(p => bookmarks.has(p.id)).map(profile => (
                <motion.div
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  id={`saved-profile-card-${profile.id}`}
                  className="glass-card min-w-[280px] max-w-[300px] snap-center shrink-0 rounded-2xl sm:rounded-[2.5rem] premium-shadow premium-hover overflow-hidden group cursor-pointer border-slate-100 hover:border-indigo-400/50 hover:shadow-indigo-900/5 transition-all duration-500 relative bg-white"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="h-28 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 relative overflow-hidden w-full">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <Hexagon className="absolute -right-6 -top-6 w-32 h-32 text-white opacity-5 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                    <Atom className="absolute -left-4 -bottom-4 w-24 h-24 text-indigo-300 opacity-10 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); downloadSpecificCard(`saved-profile-card-${profile.id}`, profile.name); }}
                        disabled={downloadingCardId === `saved-profile-card-${profile.id}`}
                        className="bg-white/10 backdrop-blur-md p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all border border-white/10 disabled:opacity-50"
                        title="Download Card"
                      >
                        {downloadingCardId === `saved-profile-card-${profile.id}` ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleBookmark(profile.id); }}
                        className="p-2 bg-white/10 backdrop-blur-md text-white/80 rounded-xl hover:bg-white/20 hover:text-white transition-all shadow-sm border border-white/10"
                      >
                        <Bookmark size={18} className="fill-current text-yellow-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="px-5 sm:px-8 pb-8 flex flex-col items-center text-center relative -mt-14 z-10">
                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none -z-10 mt-14"></div>
                    <div className="relative mb-4">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="h-28 w-28 rounded-[2rem] object-cover border-[6px] border-white bg-white shadow-xl group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-28 w-28 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-4xl font-black border-[6px] border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                          {profile.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2">
                        <UserBadges profile={profile} size={24} />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 line-clamp-1 tracking-tight mb-1">
                      {profile.name}
                    </h3>
                    <p className="text-sm text-indigo-700 font-bold mb-1 line-clamp-1 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100/50 inline-block">
                      {profile.job_title || profile.current_status}
                    </p>
                    <p className="text-xs text-slate-500 font-bold line-clamp-1 uppercase tracking-widest mb-4">
                      {profile.institute_name || profile.university}
                    </p>
                    
                    <div className="w-full text-left space-y-2 text-xs text-slate-500 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                      <div className="flex flex-wrap justify-center gap-2 mb-3">
                        {profile.location && (
                          <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                            <MapPin size={12} className="mr-1.5 text-indigo-600"/> {profile.location}
                          </span>
                        )}
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200">
                          <FlaskConical size={12} className="mr-1.5 text-indigo-600"/> {profile.chemistry_batch ? `Batch ${profile.chemistry_batch}` : 'N/A'}
                        </span>
                      </div>
                      
                      {profile.department && profile.university && (
                        <div className="flex flex-col gap-1.5">
                           <div className="flex items-start gap-2.5">
                             <Atom size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                             <span className="font-medium text-slate-700">{profile.department}, {profile.university}</span>
                           </div>
                           {profile.hall_name && (
                             <div className="flex items-start gap-2.5 ml-6">
                               <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">{profile.hall_name}</span>
                             </div>
                           )}
                        </div>
                      )}
                      {profile.email && (
                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate font-medium">{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (!profile.is_phone_private || isAdmin || currentUser?.id === profile.id) && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span className="font-medium">{profile.phone}</span>
                        </div>
                      )}
                      {profile.phone && profile.is_phone_private && !isAdmin && currentUser?.id !== profile.id && (
                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span className="italic text-slate-400 font-medium">Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-5 sm:px-8 pb-8">
                    <button className="w-full py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all premium-button shadow-lg shadow-slate-200">
                      View Full Profile
                    </button>
                  </div>
                  {/* Watermark for download */}
                  <div className="download-watermark hidden absolute bottom-4 right-4 items-center space-x-2 opacity-20 pointer-events-none">
                    <Atom size={24} className="text-indigo-900" />
                    <span className="font-black text-indigo-900 tracking-widest uppercase text-sm">ChemConnect</span>
                  </div>
                </motion.div>
              ))}
              
              {profiles.filter(p => bookmarks.has(p.id)).length === 0 && (
                <div className="col-span-full text-center py-12 sm:py-20 glass-card rounded-2xl sm:rounded-[3rem] border-dashed border-2 border-slate-200">
                  <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Bookmark className="h-10 w-10 text-slate-300" />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Your collection is empty</h3>
                  <p className="text-slate-500 mt-2 font-medium">Bookmark profiles from the directory to build your network.</p>
                  <button 
                    onClick={() => setActiveTab('directory')}
                    className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all premium-button"
                  >
                    Explore Directory
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'messages' && (
          <Messages 
            currentUser={currentUser} 
            profiles={profiles} 
            syncStatus={syncStatus} 
            initialTargetId={targetProfileId}
            onChatStarted={() => setTargetProfileId(null)}
          />
        )}

        {activeTab === 'admin' && isAdmin && (
          <motion.div 
            key="admin"
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: 20 }} 
            transition={{ duration: 0.3 }}
            className="max-w-5xl mx-auto space-y-8"
          >
            <div className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl premium-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                <p className="text-slate-500 mt-1">Manage users, view analytics, and export data.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={exportBatch}
                  onChange={(e) => setExportBatch(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">All Univ. Batches</option>
                  {uniqueBatches.map(batch => (
                    <option key={batch} value={batch}>Univ. Batch {batch}</option>
                  ))}
                </select>
                <select
                  value={exportChemistryBatch}
                  onChange={(e) => setExportChemistryBatch(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">All Chem. Batches</option>
                  {uniqueChemistryBatches.map(batch => (
                    <option key={batch} value={batch}>Chem. Batch {batch}</option>
                  ))}
                </select>
                <button onClick={handleExportPDF} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors flex items-center shadow-sm">
                  <FileText size={16} className="mr-2" /> Export PDF
                </button>
                <button onClick={handleExportCSV} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center shadow-sm">
                  <Database size={16} className="mr-2" /> Export CSV
                </button>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              <motion.div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow premium-hover border-slate-100 flex items-center space-x-4 sm:space-x-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-sm relative z-10">
                  <Users size={32} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{profiles.length}</h3>
                </div>
              </motion.div>
              <motion.div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow premium-hover border-slate-100 flex items-center space-x-4 sm:space-x-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm relative z-10">
                  <GraduationCap size={32} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Teachers</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{teachers.length}</h3>
                </div>
              </motion.div>
              <motion.div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow premium-hover border-slate-100 flex items-center space-x-4 sm:space-x-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm relative z-10">
                  <MessageSquare size={32} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Posts</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{posts.length}</h3>
                </div>
              </motion.div>
              <motion.div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow premium-hover border-slate-100 flex items-center space-x-4 sm:space-x-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-sm relative z-10">
                  <BadgeCheck size={32} />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Verifications</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">
                    {profiles.filter(p => p.verification_status === 'pending').length}
                  </h3>
                </div>
              </motion.div>
            </div>

            {/* Verification Requests */}
            <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden mt-8 sm:mt-12 border-slate-100 relative">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center relative z-10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100">
                    <Crown size={20} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Verification Requests</h3>
                </div>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-amber-200">
                  {profiles.filter(p => p.verification_status === 'pending').length} Pending Review
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-4">User Identity</th>
                      <th className="px-8 py-4">Academic Batch</th>
                      <th className="px-8 py-4">Current Role</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {profiles.filter(p => p.verification_status === 'pending').map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              {p.avatar_url ? (
                                <img src={p.avatar_url} alt="" className="w-12 h-12 rounded-2xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 font-black text-sm shadow-sm">
                                  {p.name?.charAt(0) || '?'}
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-black text-slate-900 tracking-tight">{p.name}</div>
                              <div className="text-xs font-medium text-slate-400">{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{p.batch || '-'}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{p.current_status || '-'}</td>
                        <td className="px-8 py-5 text-sm text-right space-x-3">
                          <button 
                            onClick={() => setSelectedProfile(p)}
                            className="bg-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                          >
                            Details
                          </button>
                          <button 
                            onClick={() => handleVerifyProfile(p.id, 'verified')}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={() => handleVerifyProfile(p.id, 'rejected')}
                            className="bg-white text-red-600 border border-red-100 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all shadow-sm"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                    {profiles.filter(p => p.verification_status === 'pending').length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-8 py-20 text-center">
                          <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="text-slate-200" size={32} />
                          </div>
                          <p className="text-slate-400 font-bold text-sm">No pending verification requests at the moment.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* User Management Table */}
            <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden mt-8 sm:mt-12 border-slate-100 relative">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 relative z-10">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Community Directory Management</h3>
              </div>
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      <th className="px-8 py-4">Name</th>
                      <th className="px-8 py-4">Email Address</th>
                      <th className="px-8 py-4">Batch</th>
                      <th className="px-8 py-4">System Role</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {profiles.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="text-sm font-black text-slate-900 tracking-tight">{p.name}</div>
                          <div className="flex items-center gap-2 mt-1">
                            {p.verification_status === 'verified' && <BadgeCheck size={12} className="text-blue-500" />}
                            <span className={`text-[9px] font-black uppercase tracking-tighter ${p.verification_status === 'verified' ? 'text-blue-600' : 'text-slate-400'}`}>
                              {p.verification_status || 'none'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{p.email}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{p.chemistry_batch || p.batch || '-'}</td>
                        <td className="px-8 py-5 text-sm">
                          <button 
                            onClick={() => toggleUserRole(p.id, p.role || 'user')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                              p.role === 'admin' || p.email === 'fllimonm1212@gmail.com' || p.email === 'chembondhon@gmail.com'
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                                : 'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100'
                            }`}
                          >
                            <ShieldCheck size={12} />
                            {p.role === 'admin' || p.email === 'fllimonm1212@gmail.com' || p.email === 'chembondhon@gmail.com' ? 'Admin' : 'Member'}
                          </button>
                        </td>
                        <td className="px-8 py-5 text-sm text-right space-x-3">
                          {p.verification_status !== 'verified' && (
                            <button onClick={() => handleVerifyProfile(p.id, 'verified')} className="text-emerald-600 hover:text-emerald-700 font-black text-[10px] uppercase tracking-widest">Approve</button>
                          )}
                          <button onClick={() => setSelectedProfile(p)} className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest">View Profile</button>
                          <button onClick={() => setUserToDelete({id: p.id, name: p.name})} className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
              {/* Add Admin */}
              <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100 relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-slate-900 text-white rounded-2xl">
                      <ShieldCheck size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Elevate to Admin</h3>
                  </div>
                  <form onSubmit={handleAddAdmin} className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">User Email Address</label>
                      <input 
                        required 
                        type="email" 
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-slate-700" 
                        placeholder="Enter registered email..."
                        value={adminEmailToAdd} 
                        onChange={e => setAdminEmailToAdd(e.target.value)} 
                      />
                      <p className="text-[10px] text-slate-400 font-bold mt-3 ml-1 uppercase tracking-tight">Note: User must already have an account.</p>
                    </div>
                    <button type="submit" disabled={isAddingAdmin} className="w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-indigo-600 transition-all disabled:opacity-50 uppercase text-xs tracking-widest premium-button">
                      {isAddingAdmin ? 'Processing...' : 'Grant Admin Privileges'}
                    </button>
                  </form>
                </div>
              </div>

              {/* Bulk Upload Info */}
              <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100 flex flex-col relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                <div className="relative z-10 flex-grow flex flex-col">
                  <div className="flex items-center space-x-4 mb-8">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <Database size={24} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Operations</h3>
                  </div>
                  <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 text-sm text-slate-600 space-y-4 flex-grow">
                    <p className="font-bold">To bulk upload members, use the Supabase Infrastructure:</p>
                    <ul className="space-y-3">
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">1</div>
                        <span className="font-medium">Access Supabase Dashboard</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">2</div>
                        <span className="font-medium">Authentication &gt; Users &gt; Import</span>
                      </li>
                      <li className="flex items-start">
                        <div className="h-5 w-5 rounded-full bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">3</div>
                        <span className="font-medium">Upload CSV with required headers</span>
                      </li>
                    </ul>
                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Protocol</p>
                      <p className="text-xs font-medium mt-1">Direct bulk creation is restricted to infrastructure level for security.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Site Configuration (Hero Image) */}
            <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100 mt-8 sm:mt-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-amber-500 text-white rounded-2xl">
                    <Camera size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Hero Image Management</h3>
                </div>
                
                <div className="flex flex-col lg:flex-row gap-10 items-center">
                  <div className="w-full lg:w-1/3">
                    <div className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-video border-4 border-white bg-slate-100">
                      <img src={heroImageUrl} alt="Current Hero" className="w-full h-full object-cover" />
                      {isUploadingHero && (
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <Loader2 className="animate-spin text-white" size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <h4 className="text-lg font-black text-slate-800 tracking-tight">Customize Landing Page</h4>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      This image appears in the welcome section for all users. Upload a professional image (Recommended 800x800px or larger).
                    </p>
                    <div className="pt-2">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        ref={heroFileInputRef} 
                        onChange={handleHeroImageUpload} 
                      />
                      <button 
                        onClick={() => heroFileInputRef.current?.click()}
                        disabled={isUploadingHero}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl disabled:opacity-50 flex items-center space-x-3"
                      >
                        <Camera size={18} />
                        <span>{isUploadingHero ? 'Processing...' : 'Change Hero Image'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Site Configuration (Features) */}
            <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100 mt-8 sm:mt-12 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-blue-500 text-white rounded-2xl">
                    <LayoutGrid size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Feature Management</h3>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">Enable Feed Posts</h4>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                        Turn this off to completely hide both the post creation option and all older posts from the 'Home' tab. The 'Home' tab itself and other sections on it will remain visible.
                      </p>
                    </div>
                    
                    <button
                      onClick={async () => {
                        const newState = !isFeedEnabled;
                        setIsFeedEnabled(newState);
                        
                        const { error } = await supabase
                          .from('site_config')
                          .upsert({ key: 'is_feed_enabled', value: String(newState), updated_at: new Date().toISOString() });
                          
                        if (error) {
                          console.error("Failed to update config", error);
                          alert("Failed to update settings. Please try again.");
                          setIsFeedEnabled(!newState); // revert
                        }
                      }}
                      className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2 ${isFeedEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                      role="switch"
                      aria-checked={isFeedEnabled}
                    >
                      <span className="sr-only">Enable posting</span>
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isFeedEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin User List */}
            <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden mt-8 sm:mt-12 border-slate-100 relative">
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 relative z-10">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Current Admins</h3>
              </div>
              <div className="divide-y divide-slate-100 relative z-10">
                {profiles.filter(p => p.role === 'admin' || p.email === 'fllimonm1212@gmail.com' || p.email === 'chembondhon@gmail.com').map(admin => (
                  <div key={admin.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {admin.avatar_url ? (
                        <img src={admin.avatar_url} alt="" className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                          {admin.name?.charAt(0) || 'A'}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-slate-900 flex items-center">
                          {admin.name}
                          <UserBadges profile={admin} size={16} />
                        </p>
                        <p className="text-sm text-slate-500">{admin.email}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-white">
                      Super Admin
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </main>

      {/* FULL PROFILE MODAL */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar rounded-[3rem] shadow-2xl relative premium-shadow border border-slate-100"
            >
              <div className="sticky top-0 right-0 z-50 flex justify-end p-6 pointer-events-none mb-[-5rem]">
                <div className="flex items-center space-x-3 pointer-events-auto">
                  <button 
                    onClick={() => downloadSpecificCard('modal-profile-card', selectedProfile.name)}
                    disabled={downloadingCardId === 'modal-profile-card'}
                    className="bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-2xl p-3 transition-all backdrop-blur-md border border-white/20 shadow-xl disabled:opacity-50 flex items-center justify-center"
                    title="Download Profile Card"
                  >
                    {downloadingCardId === 'modal-profile-card' ? <Loader2 size={24} className="animate-spin" /> : <Camera size={24} />}
                  </button>
                  <button 
                    onClick={() => setSelectedProfile(null)}
                    className="bg-slate-900/40 hover:bg-slate-900/60 text-white rounded-2xl p-3 transition-all backdrop-blur-md border border-white/20 shadow-xl flex items-center justify-center"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div id="modal-profile-card" ref={profileCardRef} className="flex flex-col bg-white rounded-[3rem] overflow-hidden">
                {/* Cover & Avatar */}
                <div className="h-48 sm:h-64 bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-800 relative shrink-0 overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <Hexagon className="absolute -right-10 -top-10 w-64 h-64 text-white opacity-5 rotate-12" />
                  <Atom className="absolute left-10 -bottom-10 w-48 h-48 text-indigo-300 opacity-10" />
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
                  </div>
                </div>
              
              <div className="px-8 sm:px-16 pb-16 relative z-10">
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none -z-10"></div>
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10">
                  <div className="flex flex-col">
                    <div className="-mt-24 sm:-mt-32 mb-6 relative inline-block">
                      {selectedProfile.avatar_url ? (
                        <img src={selectedProfile.avatar_url} alt={selectedProfile.name} className="h-40 w-40 sm:h-48 sm:w-48 rounded-[3rem] border-[6px] border-white bg-white object-cover shadow-2xl" />
                      ) : (
                        <div className="h-40 w-40 sm:h-48 sm:w-48 rounded-[3rem] border-[6px] border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-6xl font-black shadow-2xl">
                          {selectedProfile.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-2xl shadow-lg">
                        <UserBadges profile={selectedProfile} size={32} />
                      </div>
                    </div>
                    <div>
                      <h2 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        {selectedProfile.name}
                      </h2>
                      {selectedProfile.verification_status === 'pending' && (
                        <div className="inline-flex items-center mt-3 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-100">
                          <Clock size={14} className="mr-2" /> Verification Pending
                        </div>
                      )}
                      <div className="text-indigo-700 font-black mt-3 flex flex-wrap items-center gap-3 text-sm uppercase tracking-widest">
                        <span className="bg-indigo-50 px-3 py-1 rounded-lg">{selectedProfile.department}</span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg">{selectedProfile.university}</span>
                        {selectedProfile.hall_name && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg">{selectedProfile.hall_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-8 sm:mt-0">
                    <button 
                      onClick={() => toggleBookmark(selectedProfile.id)}
                      className={`flex items-center justify-center h-14 px-6 rounded-2xl transition-all text-xs font-black uppercase tracking-widest shadow-lg ${bookmarks.has(selectedProfile.id) ? 'bg-amber-500 text-white shadow-amber-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 shadow-slate-100'}`}
                    >
                      <Bookmark size={18} className={`mr-2 ${bookmarks.has(selectedProfile.id) ? 'fill-current' : ''}`} /> 
                      {bookmarks.has(selectedProfile.id) ? 'Saved' : 'Save'}
                    </button>
                    {selectedProfile.phone && (!selectedProfile.is_phone_private || currentUser?.id === selectedProfile.id || isAdmin) && (
                      <div className="flex gap-2">
                        <a href={`tel:${selectedProfile.phone}`} className="flex items-center justify-center h-14 px-8 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 premium-button">
                          <Phone size={18} className="mr-2" /> Call Now
                        </a>
                        <button 
                          onClick={() => handleCopy(selectedProfile.phone!, selectedProfile.id)}
                          className="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-lg shadow-slate-100"
                          title="Copy Number"
                        >
                          {copiedId === selectedProfile.id ? <Check size={18} className="text-indigo-600" /> : <Copy size={18} />}
                        </button>
                      </div>
                    )}
                    {selectedProfile.phone && selectedProfile.is_phone_private && currentUser?.id !== selectedProfile.id && !isAdmin && (
                      <div className="flex items-center justify-center h-14 px-6 rounded-2xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest border border-slate-200">
                        <EyeOff size={16} className="mr-2" /> Phone Private
                      </div>
                    )}
                    {selectedProfile.email && (
                      <a href={`mailto:${selectedProfile.email}`} className="flex items-center justify-center h-14 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-200">
                        <Mail size={18} className="mr-2" /> Send Email
                      </a>
                    )}
                    {currentUser?.id !== selectedProfile.id && (
                      <button 
                        onClick={() => {
                          setTargetProfileId(selectedProfile.id);
                          setSelectedProfile(null);
                          setActiveTab('messages');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex items-center justify-center h-14 px-8 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-100 premium-button"
                      >
                        <MessageSquare size={18} className="mr-2" /> Message
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column (Main Info) */}
                  <div className="lg:col-span-2 space-y-12">
                    {selectedProfile.bio && (
                      <section>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <UserIcon size={20} />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 tracking-tight">Professional Bio</h3>
                        </div>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 font-medium italic text-base sm:text-lg">
                          "{selectedProfile.bio}"
                        </div>
                      </section>
                    )}

                    <section>
                      <div className="flex items-center space-x-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Career & Status</h3>
                      </div>
                      <div className="glass-card border border-slate-100 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Status</div>
                          <div className="text-sm font-black">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                              selectedProfile.current_status === 'Student' ? 'bg-green-50 text-green-700 border border-green-100' : 
                              selectedProfile.current_status === 'Abroad' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {selectedProfile.current_status || 'Unknown'}
                            </span>
                          </div>
                        </div>
                        {(selectedProfile.job_title || selectedProfile.institute_name) && (
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pt-6 border-t border-slate-50">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Position</div>
                            <div className="text-right sm:text-right">
                              <div className="text-lg font-black text-slate-900 tracking-tight">{selectedProfile.job_title || 'Employee'}</div>
                              <div className="text-indigo-600 font-bold text-sm mt-1">{selectedProfile.institute_name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Right Column (Sidebar Info) */}
                  <div className="space-y-8">
                    <section className="glass-card bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-slate-100 relative overflow-hidden">
                      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                      <div className="relative z-10">
                        <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-widest">Academic & Location</h3>
                        <div className="space-y-8">
                        <div className="flex items-start space-x-4">
                          <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session & Batch</div>
                            <div className="text-sm font-black text-slate-900 tracking-tight">
                              {selectedProfile.chemistry_batch ? `${selectedProfile.chemistry_batch} Batch ` : ''}
                              {selectedProfile.batch ? `(${selectedProfile.batch})` : 'N/A'}
                              {selectedProfile.student_id && (
                                <div className="text-[10px] text-indigo-600 mt-1">ID: {selectedProfile.student_id}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedProfile.location && (
                          <div className="flex items-start space-x-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                              <MapPin size={20} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Location</div>
                              <div className="text-sm font-black text-slate-900 tracking-tight">{selectedProfile.location}</div>
                            </div>
                          </div>
                        )}
                        {selectedProfile.permanent_address && (
                          <div className="flex items-start space-x-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-indigo-600">
                              <Map size={20} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Permanent Address</div>
                              <div className="text-sm font-black text-slate-900 tracking-tight">{selectedProfile.permanent_address}</div>
                            </div>
                          </div>
                        )}
                        {selectedProfile.blood_group && (
                          <div className="flex items-start space-x-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-rose-600">
                              <Activity size={20} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Group</div>
                              <div className="text-sm font-black text-slate-900 tracking-tight">{selectedProfile.blood_group}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </section>

                    {(selectedProfile.social_links?.facebook || selectedProfile.social_links?.linkedin) && (
                      <section className="glass-card rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/hexellence.png')] pointer-events-none"></div>
                        <div className="relative z-10">
                          <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">Digital Presence</h3>
                          <div className="flex gap-4">
                          {selectedProfile.social_links.facebook && (
                            <a href={selectedProfile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-50 hover:bg-blue-100 p-4 rounded-2xl text-blue-600 transition-all flex items-center justify-center border border-blue-100 shadow-sm">
                              <Facebook size={24} />
                            </a>
                          )}
                          {selectedProfile.social_links.linkedin && (
                            <a href={selectedProfile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 bg-sky-50 hover:bg-sky-100 p-4 rounded-2xl text-sky-600 transition-all flex items-center justify-center border border-sky-100 shadow-sm">
                              <Linkedin size={24} />
                            </a>
                          )}
                        </div>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
                {/* Watermark for download */}
                <div className="download-watermark hidden absolute bottom-8 right-8 items-center space-x-3 opacity-20 pointer-events-none">
                  <Atom size={32} className="text-indigo-900" />
                  <span className="font-black text-indigo-900 tracking-widest uppercase text-xl">ChemConnect</span>
                </div>
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE USER CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={() => setUserToDelete(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl relative premium-shadow border border-slate-100 text-center"
            >
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Remove Member?</h3>
              <p className="text-slate-500 font-medium leading-relaxed mb-8">
                Are you sure you want to remove <span className="text-slate-900 font-bold">{userToDelete.name}</span> from the network? This action will permanently delete their data.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
