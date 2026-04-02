import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Phone, Mail, Facebook, Linkedin, Users, GraduationCap, 
  Briefcase, Building, FlaskConical, LogOut, Database, User as UserIcon, 
  MapPin, Camera, Eye, EyeOff, Loader2, Home, MessageSquare, Lightbulb, 
  Target, X, Clock, Map, Bookmark, Calendar, CheckCircle, CalendarDays,
  BadgeCheck, FileText, ExternalLink, MoreVertical, Edit, Trash2, Crown,
  ShieldCheck, ArrowRight, Building2, Copy, Check, BookOpen, Hash
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type CurrentStatus = 'Student' | 'Govt Job' | 'Private Job' | 'Business' | 'Abroad' | '';
type PostType = 'Job Update' | 'Advice' | 'Opportunity' | 'General';
type EventType = 'Reunion' | 'Seminar' | 'Webinar' | 'Football Tournament' | 'Cricket Tournament' | 'Other';

interface Profile {
  id: string;
  name: string;
  avatar_url?: string;
  batch: string;
  chemistry_batch?: string;
  student_id?: string;
  department: string;
  university: string;
  current_status: CurrentStatus;
  job_title?: string;
  institute_name?: string;
  location?: string;
  permanent_address?: string;
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

interface Post {
  id: string;
  author_id: string;
  content: string;
  post_type: PostType;
  job_link?: string;
  job_pdf_url?: string;
  job_deadline?: string;
  created_at: string;
  profiles?: Profile; // Joined data
}

interface AppEvent {
  id: string;
  title: string;
  description: string;
  event_type: EventType;
  event_date: string;
  location: string;
  created_by: string;
  created_at: string;
  profiles?: Profile;
  rsvps?: { count: number }[];
  user_rsvp?: { status: string }[];
}

interface Bookmark {
  profile_id: string;
}

const STATUS_OPTIONS: CurrentStatus[] = ['Student', 'Govt Job', 'Private Job', 'Business', 'Abroad'];
const POST_TYPES: PostType[] = ['General', 'Job Update', 'Advice', 'Opportunity'];

const INITIAL_FORM_DATA: Partial<Profile> = {
  department: '',
  university: '',
  current_status: '',
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

  const elementCount = isMobile ? 6 : 12;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-20">
      {[...Array(elementCount)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            scale: Math.random() * 0.5 + 0.5,
            rotate: 0
          }}
          animate={{ 
            x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
            y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
            rotate: 360
          }}
          transition={{ 
            duration: 30 + Math.random() * 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="absolute"
        >
          {i % 3 === 0 ? (
            // Benzene Ring
            <svg width={isMobile ? "60" : "100"} height={isMobile ? "60" : "100"} viewBox="0 0 100 100" className="text-teal-500/30 fill-none stroke-current stroke-2">
              <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" />
              <circle cx="50" cy="50" r="25" className="stroke-1 opacity-50" />
            </svg>
          ) : (
            // Molecule
            <div className={`flex items-center ${isMobile ? 'space-x-[-6px]' : 'space-x-[-10px]'}`}>
              <div className={`${isMobile ? 'w-4 h-4' : 'w-6 h-6'} rounded-full bg-teal-400/20 border border-teal-500/30`} />
              <div className={`${isMobile ? 'w-8 h-0.5' : 'w-12 h-1'} bg-teal-500/20 rotate-45`} />
              <div className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} rounded-full bg-emerald-400/20 border border-emerald-500/30`} />
            </div>
          )}
        </motion.div>
      ))}
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
  const isAdmin = profile?.role === 'admin' || profile?.email === 'fllimonm1212@gmail.com';
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());

  const [activeTab, setActiveTab] = useState<'feed' | 'directory' | 'profile' | 'events' | 'saved' | 'admin'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterUniversity, setFilterUniversity] = useState<string>('All');
  const [filterBatch, setFilterBatch] = useState<string>('All');
  const [adminEmailToAdd, setAdminEmailToAdd] = useState('');
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);
  const [exportBatch, setExportBatch] = useState<string>('');
  const [exportChemistryBatch, setExportChemistryBatch] = useState<string>('');
  const [userToDelete, setUserToDelete] = useState<{id: string, name: string} | null>(null);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Post Form State
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<PostType>('General');
  const [postFilter, setPostFilter] = useState<'All' | PostType>('All');
  const [jobLink, setJobLink] = useState('');
  const [jobDeadline, setJobDeadline] = useState('');
  const [jobPdfFile, setJobPdfFile] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const jobPdfInputRef = useRef<HTMLInputElement>(null);

  // Event Form State
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    event_type: 'Reunion' as EventType,
    event_date: '',
    location: ''
  });
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [showEventForm, setShowEventForm] = useState(false);

  // Profile Form State
  const [formData, setFormData] = useState<Partial<Profile>>(INITIAL_FORM_DATA);

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

  useEffect(() => {
    if (currentUser) {
      fetchProfiles();
      fetchMyProfile();
      fetchPosts();
      fetchEvents();
      fetchBookmarks();
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
          student_id: data.student_id,
          department: data.department || '',
          university: data.university || '',
          current_status: (data.current_status as CurrentStatus) || '',
          job_title: data.job_title,
          institute_name: data.institute_name,
          location: data.location,
          permanent_address: data.permanent_address,
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

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (data) {
      localStorage.setItem(`chem_my_profile_${currentUser.id}`, JSON.stringify(data));
      setFormData({
        name: data.name,
        avatar_url: data.avatar_url,
        batch: data.batch,
        chemistry_batch: data.chemistry_batch,
        student_id: data.student_id,
        department: data.department || '',
        university: data.university || '',
        current_status: (data.current_status as CurrentStatus) || '',
        job_title: data.job_title,
        institute_name: data.institute_name,
        location: data.location,
        permanent_address: data.permanent_address,
        bio: data.bio,
        phone: data.phone,
        is_phone_private: data.is_phone_private ?? false,
        email: data.email,
        social_links: data.social_links || {},
        is_public: data.is_public ?? true,
        verification_status: data.verification_status || 'none'
      });
    } else {
      // New user - no profile in DB yet
      setFormData({
        ...INITIAL_FORM_DATA,
        name: currentUser.user_metadata?.full_name || '',
        email: currentUser.email || ''
      });
      // Redirect new users to profile edit immediately
      setActiveTab('profile');
      setIsEditingProfile(true);
    }
  };

  const fetchProfiles = async () => {
    const cachedProfiles = localStorage.getItem('chem_profiles');
    if (cachedProfiles) {
      try {
        setProfiles(JSON.parse(cachedProfiles));
      } catch (e) {
        console.error('Failed to parse cached profiles', e);
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      if (error.code === '42P01') {
        setDbError('Database tables are missing. Please run the SQL setup script below in your Supabase SQL Editor.');
      }
    } else if (data) {
      setDbError('');
      setProfiles(data as Profile[]);
      localStorage.setItem('chem_profiles', JSON.stringify(data));
    }
  };

  const fetchEvents = async () => {
    const cachedEvents = localStorage.getItem('chem_events');
    if (cachedEvents) {
      try {
        setEvents(JSON.parse(cachedEvents));
      } catch (e) {
        console.error('Failed to parse cached events', e);
      }
    }

    const { data, error } = await supabase
      .from('events')
      .select('*, profiles(*), rsvps:event_rsvps(count), user_rsvp:event_rsvps(status)')
      .order('event_date', { ascending: true });

    if (!error && data) {
      setEvents(data as AppEvent[]);
      localStorage.setItem('chem_events', JSON.stringify(data));
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

    const { data, error } = await supabase
      .from('bookmarks')
      .select('profile_id')
      .eq('user_id', currentUser.id);

    if (!error && data) {
      const bookmarkIds = data.map(b => b.profile_id);
      setBookmarks(new Set(bookmarkIds));
      localStorage.setItem(`chem_bookmarks_${currentUser.id}`, JSON.stringify(bookmarkIds));
    }
  };

  const fetchPosts = async () => {
    const cachedPosts = localStorage.getItem('chem_posts');
    if (cachedPosts) {
      try {
        setPosts(JSON.parse(cachedPosts));
      } catch (e) {
        console.error('Failed to parse cached posts', e);
      }
    }

    // Lazy delete expired job posts
    const now = new Date().toISOString();
    await supabase
      .from('posts')
      .delete()
      .eq('post_type', 'Job Update')
      .not('job_deadline', 'is', null)
      .lt('job_deadline', now);

    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPosts(data as Post[]);
      localStorage.setItem('chem_posts', JSON.stringify(data));
    }
  };

  // Scroll to top when tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !postContent.trim()) return;

    setIsPosting(true);
    
    let pdfUrl = null;
    if (postType === 'Job Update' && jobPdfFile) {
      const fileExt = jobPdfFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${currentUser.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, jobPdfFile);
        
      if (!uploadError) {
        const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
        pdfUrl = data.publicUrl;
      }
    }

    const postData: any = {
      author_id: currentUser.id,
      content: postContent.trim(),
      post_type: postType
    };

    if (postType === 'Job Update') {
      if (jobLink) postData.job_link = jobLink;
      if (pdfUrl) postData.job_pdf_url = pdfUrl;
      if (jobDeadline) postData.job_deadline = new Date(jobDeadline).toISOString();
    }

    const { error } = await supabase
      .from('posts')
      .insert([postData]);

    setIsPosting(false);
    if (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Make sure the posts table has the new job columns (job_link, job_pdf_url, job_deadline).');
    } else {
      setPostContent('');
      setPostType('General');
      setJobLink('');
      setJobDeadline('');
      setJobPdfFile(null);
      if (jobPdfInputRef.current) jobPdfInputRef.current.value = '';
      fetchPosts();
    }
  };

  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;
    
    const { error } = await supabase
      .from('posts')
      .update({ content: editingPost.content })
      .eq('id', editingPost.id);
    
    if (error) {
      console.error('Error updating post:', error);
      alert('Failed to update post.');
    } else {
      setEditingPost(null);
      fetchPosts();
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const { error } = await supabase.from('posts').delete().eq('id', postToDelete);
    if (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post.');
    } else {
      fetchPosts();
    }
    setPostToDelete(null);
  };

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

      const matchesUniversity = filterUniversity === 'All' || profile.university === filterUniversity;
      const matchesBatch = filterBatch === 'All' || profile.chemistry_batch === filterBatch;

      return matchesSearch && matchesStatus && matchesUniversity && matchesBatch;
    }).sort((a, b) => {
      const batchA = parseInt(a.chemistry_batch || '999');
      const batchB = parseInt(b.chemistry_batch || '999');
      return batchA - batchB;
    });
  }, [profiles, searchQuery, filterStatus, filterUniversity, filterBatch, formData.chemistry_batch, currentUser?.id]);

  const groupedProfiles = useMemo(() => {
    const groups: { [key: string]: Profile[] } = {};
    filteredProfiles.forEach(profile => {
      const batch = profile.chemistry_batch || 'N/A';
      if (!groups[batch]) groups[batch] = [];
      groups[batch].push(profile);
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
      student_id: formData.student_id,
      department: formData.department || '',
      university: formData.university || '',
      current_status: formData.current_status || '',
      job_title: formData.job_title,
      institute_name: formData.institute_name,
      location: formData.location,
      permanent_address: formData.permanent_address,
      bio: formData.bio,
      phone: formData.phone,
      is_phone_private: formData.is_phone_private ?? false,
      email: formData.email,
      social_links: formData.social_links || {},
      is_public: formData.is_public ?? true
    };

    const { error } = await supabase
      .from('profiles')
      .upsert([profileData]);

    if (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save profile. Make sure the table schema is updated.');
    } else {
      fetchProfiles();
      setIsEditingProfile(false);
      setActiveTab('directory');
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
      fetchProfiles();
      if (profileId === currentUser?.id) {
        fetchMyProfile();
      }
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !eventForm.title || !eventForm.event_date) return;
    setIsCreatingEvent(true);
    const { error } = await supabase.from('events').insert([{
      title: eventForm.title,
      description: eventForm.description,
      event_type: eventForm.event_type,
      event_date: eventForm.event_date,
      location: eventForm.location,
      created_by: currentUser.id
    }]);
    setIsCreatingEvent(false);
    if (!error) {
      setEventForm({ title: '', description: '', event_type: 'Reunion', event_date: '', location: '' });
      setShowEventForm(false);
      fetchEvents();
    } else {
      alert('Failed to create event.');
    }
  };

  const handleRSVP = async (eventId: string, status: 'Going' | 'Maybe') => {
    if (!currentUser) return;
    const { error } = await supabase.from('event_rsvps').upsert([{
      event_id: eventId,
      user_id: currentUser.id,
      status
    }], { onConflict: 'event_id,user_id' });
    if (!error) {
      fetchEvents();
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
    doc.text('Bondhon Directory', 14, 22);
    
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
        `Page ${i} of ${pageCount} - Bondhon Directory`,
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
    const { error } = await supabase.from('profiles').delete().eq('id', userToDelete.id);
    if (error) {
      console.error("Error deleting user:", error);
    } else {
      fetchProfiles();
    }
    setUserToDelete(null);
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmailToAdd) return;
    setIsAddingAdmin(true);
    const { error } = await supabase.from('profiles').update({ role: 'admin' }).eq('email', adminEmailToAdd);
    setIsAddingAdmin(false);
    if (error) {
      alert('Failed to add admin. Make sure the user has registered and their email matches.');
    } else {
      alert('Admin added successfully!');
      setAdminEmailToAdd('');
      fetchProfiles();
    }
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
  const uniqueUniversities = Array.from(new Set(profiles.map(p => p.university).filter(Boolean))).sort();

  const getPostTypeIcon = (type: PostType) => {
    switch (type) {
      case 'Job Update': return <Briefcase size={16} className="text-blue-600" />;
      case 'Advice': return <Lightbulb size={16} className="text-amber-600" />;
      case 'Opportunity': return <Target size={16} className="text-green-600" />;
      default: return <MessageSquare size={16} className="text-slate-600" />;
    }
  };

  const isAdmin = currentUser?.email === 'fllimonm1212@gmail.com' || profiles.find(p => p.id === currentUser?.id)?.role === 'admin';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-700"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-50 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-50 rounded-full blur-[120px] opacity-60 animate-pulse"></div>
        
        {/* Floating Elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%",
                opacity: 0.1
              }}
              animate={{ 
                x: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                y: [Math.random() * 100 + "%", Math.random() * 100 + "%"],
                rotate: [0, 360]
              }}
              transition={{ 
                duration: 20 + Math.random() * 20, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute w-64 h-64 bg-gradient-to-br from-teal-100/20 to-emerald-100/20 rounded-[3rem] blur-3xl"
            />
          ))}
        </div>
        
        <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center text-teal-700"
          >
            <div className="bg-white p-5 rounded-3xl shadow-2xl shadow-teal-100/50 border border-teal-50/50">
               <FlaskConical size={56} className="text-teal-600" />
            </div>
          </motion.div>
          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 text-center text-4xl font-extrabold text-slate-900 tracking-tight font-display"
          >
            Bondhon
          </motion.h2>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-center text-sm text-slate-500 font-medium"
          >
            Chemistry Dept, University of Rajshahi
          </motion.p>
        </div>

        <motion.div 
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-10 sm:mx-auto sm:w-full sm:max-w-md relative z-10"
        >
          <div className="bg-white/70 backdrop-blur-xl py-10 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-white/50">
            <h3 className="text-2xl font-bold text-slate-900 mb-8 text-center font-display">
              {authMode === 'login' ? 'Welcome Back' : 'Join the Bondhon'}
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
                    className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900"
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
                  className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900"
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
                  className="appearance-none block w-full px-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none text-slate-900"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  placeholder="••••••••"
                />
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-teal-200/50 text-base font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 premium-button"
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
                className="text-slate-500 hover:text-teal-600 font-bold text-sm transition-colors"
              >
                {authMode === 'login' ? (
                  <>Don't have an account? <span className="text-teal-600 underline underline-offset-4">Register here</span></>
                ) : (
                  <>Already have an account? <span className="text-teal-600 underline underline-offset-4">Sign in here</span></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20 sm:pb-8 pt-20 relative">
      <MoleculeBackground />
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-slate-200/50 fixed top-0 left-0 right-0 z-50">
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
                className="bg-gradient-to-br from-teal-600 to-emerald-600 p-2.5 rounded-2xl text-white shadow-lg shadow-teal-200/50 relative overflow-hidden"
              >
                <FlaskConical size={28} className="relative z-10" />
                <motion.div 
                  animate={{ y: [20, -20] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 right-0 h-1/2 bg-white/20 blur-xl"
                />
              </motion.div>
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-teal-700 to-emerald-700">Bondhon</h1>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] hidden sm:block">Chemistry Dept • RU</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-1 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 relative">
              {[
                { id: 'feed', icon: Home, label: 'Home' },
                { id: 'directory', icon: Users, label: 'Directory' },
                { id: 'events', icon: Calendar, label: 'Events' },
                { id: 'saved', icon: Bookmark, label: 'Saved' },
                { id: 'profile', icon: UserIcon, label: 'Profile' },
                ...(isAdmin ? [{ id: 'admin', icon: Database, label: 'Admin' }] : [])
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === 'profile') setIsEditingProfile(false);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center space-x-2 relative z-10 ${
                    activeTab === tab.id 
                      ? 'text-teal-700' 
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <tab.icon size={18} className={`transition-colors duration-300 ${activeTab === tab.id ? 'text-teal-600' : ''}`} />
                  <span>{tab.label}</span>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="desktop-nav-active"
                      className="absolute inset-0 bg-white rounded-xl shadow-lg shadow-slate-200/50 border border-slate-100 -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Logged in as</span>
                <span className="text-sm font-bold text-slate-900">{currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-3 rounded-2xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 border border-slate-200/50"
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
            <div>
              <h3 className="text-sm font-bold text-amber-800">Supabase Setup Required</h3>
              <p className="text-sm text-amber-700 mt-1">{dbError}</p>
              <div className="mt-3 bg-white p-3 rounded border border-amber-200 overflow-x-auto text-xs font-mono text-slate-800">
                <pre>{`-- Run this in Supabase SQL Editor:
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  avatar_url text,
  batch text,
  chemistry_batch text,
  student_id text,
  department text default 'Chemistry',
  university text default 'University of Rajshahi',
  current_status text,
  job_title text,
  institute_name text,
  location text,
  permanent_address text,
  bio text,
  phone text,
  is_phone_private boolean default false,
  email text,
  social_links jsonb default '{}'::jsonb,
  is_public boolean default true,
  role text default 'user',
  verification_status text default 'none',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Run this to add new columns if profile table exists:
-- alter table profiles add column if not exists student_id text;
-- alter table profiles add column if not exists is_phone_private boolean default false;
-- alter table profiles add column if not exists verification_status text default 'none';

create table if not exists posts (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references profiles(id) on delete cascade not null,
  content text not null,
  post_type text not null,
  job_link text,
  job_pdf_url text,
  job_deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Run these if the posts table already exists to add the new columns:
-- alter table posts add column if not exists job_link text;
-- alter table posts add column if not exists job_pdf_url text;
-- alter table posts add column if not exists job_deadline timestamp with time zone;

-- Storage bucket for avatars (if not exists)
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;
create policy "Avatar images are publicly accessible." on storage.objects for select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar." on storage.objects for insert with check (bucket_id = 'avatars');
create policy "Anyone can update their avatar." on storage.objects for update with check (bucket_id = 'avatars');

-- Storage bucket for documents (if not exists)
insert into storage.buckets (id, name, public) values ('documents', 'documents', true) on conflict do nothing;
create policy "Document files are publicly accessible." on storage.objects for select using (bucket_id = 'documents');
create policy "Anyone can upload a document." on storage.objects for insert with check (bucket_id = 'documents');
create policy "Anyone can update their document." on storage.objects for update with check (bucket_id = 'documents');`}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex z-40 pb-safe px-2 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)]">
        {[
          { id: 'feed', icon: Home, label: 'Feed' },
          { id: 'directory', icon: Users, label: 'Directory' },
          { id: 'events', icon: Calendar, label: 'Events' },
          { id: 'saved', icon: Bookmark, label: 'Saved' },
          { id: 'profile', icon: UserIcon, label: 'Profile' },
          ...(isAdmin ? [{ id: 'admin', icon: ShieldCheck, label: 'Admin' }] : [])
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id as any);
              if (item.id === 'profile') setIsEditingProfile(false);
            }}
            className="flex-1 py-4 flex flex-col items-center justify-center relative group"
          >
            <div className={`relative z-10 transition-all duration-300 ${activeTab === item.id ? 'text-teal-600 -translate-y-1' : 'text-slate-400'}`}>
              <item.icon size={22} className={activeTab === item.id ? 'drop-shadow-[0_0_8px_rgba(20,184,166,0.4)]' : ''} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-widest mt-1 transition-all duration-300 ${activeTab === item.id ? 'text-teal-700 opacity-100 scale-100' : 'text-slate-400 opacity-60 scale-90'}`}>
              {item.label}
            </span>
            {activeTab === item.id && (
              <motion.div 
                layoutId="mobile-nav-active"
                className="absolute inset-x-2 inset-y-2 bg-teal-50 rounded-2xl -z-0 border border-teal-100/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <AnimatePresence mode="wait">
          {/* FEED TAB */}
          {activeTab === 'feed' && (
            <motion.div 
              key="feed"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
              className="max-w-3xl mx-auto space-y-6"
            >
            
            {/* Create Post Box */}
            <div className="glass-card rounded-2xl sm:rounded-3xl p-4 sm:p-6 premium-shadow">
              <form onSubmit={handleCreatePost}>
                <div className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-teal-100 shrink-0">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <UserIcon size={24} />
                    )}
                  </div>
                  <textarea
                    className="w-full border-none focus:ring-0 resize-none text-slate-800 placeholder-slate-400 text-lg bg-transparent outline-none py-2"
                    rows={3}
                    placeholder="What's on your mind, Chemist?"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
                </div>
                
                {postType === 'Job Update' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 space-y-4 bg-slate-50/50 backdrop-blur-sm p-5 rounded-2xl border border-slate-100"
                  >
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Job Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Application Link</label>
                        <input
                          type="url"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                          placeholder="https://..."
                          value={jobLink}
                          onChange={(e) => setJobLink(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 ml-1">Deadline</label>
                        <input
                          type="date"
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                          value={jobDeadline}
                          onChange={(e) => setJobDeadline(e.target.value)}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Post as</span>
                    <div className="flex p-1 bg-slate-100/50 rounded-xl border border-slate-200/50">
                      {POST_TYPES.map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPostType(type)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            postType === type 
                              ? 'bg-white text-teal-700 shadow-sm border border-slate-100' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!postContent.trim() || isPosting}
                    className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-teal-100 premium-button"
                  >
                    {isPosting ? 'Publishing...' : 'Publish Post'}
                  </button>
                </div>
              </form>
            </div>

            {/* Post Filters */}
            <div className="flex overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2">
              <button
                onClick={() => setPostFilter('All')}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                  postFilter === 'All' 
                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' 
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                All Posts
              </button>
              {POST_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => setPostFilter(type)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border ${
                    postFilter === type 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              {posts.filter(post => postFilter === 'All' || post.post_type === postFilter).map(post => {
                const author = post.profiles || profiles.find(p => p.id === post.author_id);
                return (
                  <div key={post.id} className="glass-card rounded-2xl sm:rounded-3xl premium-shadow overflow-hidden group hover:border-teal-100/50 transition-all duration-500">
                    <div className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => author && setSelectedProfile(author)}>
                          {author?.avatar_url ? (
                            <div className="relative">
                              <img src={author.avatar_url} alt={author.name} className="h-14 w-14 rounded-2xl object-cover border-2 border-white shadow-md" />
                              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 flex items-center justify-center font-bold text-xl border-2 border-white shadow-md">
                              {author?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                          <div>
                            <h4 className="font-bold text-slate-900 hover:text-teal-700 transition-colors flex items-center text-base">
                              {author?.name || 'Unknown User'}
                              <UserBadges profile={author} size={18} />
                            </h4>
                            <div className="flex items-center text-xs font-medium text-slate-400 space-x-2 mt-0.5">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">{author?.chemistry_batch ? `Batch ${author.chemistry_batch}` : 'N/A'}</span>
                              <span>•</span>
                              <span className="flex items-center">
                                <Clock size={12} className="mr-1" />
                                {formatDate(post.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-50/80 backdrop-blur-sm border border-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-500">
                            {getPostTypeIcon(post.post_type)}
                            <span>{post.post_type}</span>
                          </div>
                          {(currentUser?.id === post.author_id || isAdmin) && (
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {currentUser?.id === post.author_id && (
                                <button 
                                  onClick={() => setEditingPost(post)}
                                  className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                                  title="Edit Post"
                                >
                                  <Edit size={16} />
                                </button>
                              )}
                              <button 
                                onClick={() => setPostToDelete(post.id)}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Post"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[17px] font-medium">
                        {post.content}
                      </p>
                      
                      {post.post_type === 'Job Update' && (post.job_link || post.job_pdf_url || post.job_deadline) && (
                        <div className="mt-6 p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 shadow-inner">
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Opportunity Details</h5>
                          <div className="flex flex-wrap gap-3">
                            {post.job_link && (
                              <a href={post.job_link} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-white font-bold bg-teal-600 hover:bg-teal-700 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-teal-100 premium-button">
                                <ExternalLink size={16} className="mr-2" />
                                Apply Now
                              </a>
                            )}
                            {post.job_pdf_url && (
                              <a href={post.job_pdf_url} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-rose-600 font-bold bg-rose-50 hover:bg-rose-100 px-5 py-2.5 rounded-xl transition-all border border-rose-100">
                                <FileText size={16} className="mr-2" />
                                Circular PDF
                              </a>
                            )}
                            {post.job_deadline && (
                              <div className="flex items-center text-sm text-amber-700 font-bold bg-amber-50 px-5 py-2.5 rounded-xl border border-amber-100">
                                <Calendar size={16} className="mr-2" />
                                Deadline: {new Date(post.job_deadline).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {posts.length === 0 && (
                <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                  <MessageSquare size={40} className="mx-auto mb-3 text-slate-300" />
                  <p>No posts yet. Be the first to share something!</p>
                </div>
              )}
            </div>
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
                    placeholder="Search by name, batch, location, company..."
                    className="block w-full pl-12 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all text-sm font-medium"
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
                          ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-100' 
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
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by University</label>
                  <select
                    value={filterUniversity}
                    onChange={(e) => setFilterUniversity(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700 font-medium"
                  >
                    <option value="All">All Universities</option>
                    {uniqueUniversities.map(uni => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Filter by Batch</label>
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all text-slate-700 font-medium"
                  >
                    <option value="All">All Batches</option>
                    {uniqueChemistryBatches.map(batch => (
                      <option key={batch} value={batch}>Batch {batch}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-16">
              {groupedProfiles.map(([batch, profilesInBatch]) => (
                <div key={batch} className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">
                      {batch === 'N/A' ? 'Batch Not Specified' : `Chemistry Batch ${batch}`}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    <AnimatePresence>
                      {profilesInBatch.map((profile, idx) => (
                        <motion.div
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4, delay: idx * 0.05 }}
                          key={profile.id}
                          className="glass-card rounded-2xl sm:rounded-[2rem] premium-shadow overflow-hidden group hover:border-teal-200/50 transition-all duration-500 flex flex-col cursor-pointer"
                          onClick={() => setSelectedProfile(profile)}
                        >
                          <div className="h-28 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleBookmark(profile.id); }}
                              className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/20 transition-all"
                            >
                              <Bookmark size={18} className={bookmarks.has(profile.id) ? "fill-current text-yellow-400" : ""} />
                            </button>
                          </div>
                          <div className="px-6 pb-6 flex-1 flex flex-col relative">
                            <div className="-mt-14 mb-4 relative">
                              {profile.avatar_url ? (
                                <img src={profile.avatar_url} alt={profile.name} className="h-24 w-24 rounded-3xl border-4 border-white bg-white object-cover shadow-xl group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="h-24 w-24 rounded-3xl border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-3xl font-bold shadow-xl group-hover:scale-105 transition-transform duration-500">
                                  {profile.name?.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div className="absolute bottom-1 left-20">
                                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                              </div>
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-slate-900 leading-tight flex items-center group-hover:text-teal-700 transition-colors">
                                {profile.name}
                                <UserBadges profile={profile} size={20} />
                              </h3>
                              <div className="mt-1.5 text-sm text-slate-600 font-semibold line-clamp-2 min-h-[2.5rem]">
                                {profile.job_title} {profile.job_title && profile.institute_name && ' at '} {profile.institute_name}
                              </div>
                              
                              <div className="mt-4 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  {profile.location && (
                                    <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                      <MapPin size={10} className="mr-1 text-teal-500"/> {profile.location}
                                    </span>
                                  )}
                                  <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                    <GraduationCap size={10} className="mr-1 text-teal-500"/> {profile.chemistry_batch ? `Batch ${profile.chemistry_batch}` : 'N/A'}
                                  </span>
                                  {profile.student_id && (
                                    <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                      <Hash size={10} className="mr-1 text-teal-500"/> ID: {profile.student_id}
                                    </span>
                                  )}
                                </div>
                                
                                <div className="text-xs text-slate-500 space-y-1 mt-3">
                                  {profile.department && profile.university && (
                                    <div className="flex items-start gap-2">
                                      <BookOpen size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                      <span>{profile.department}, {profile.university}</span>
                                    </div>
                                  )}
                                  {profile.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail size={14} className="text-slate-400 shrink-0" />
                                      <span className="truncate">{profile.email}</span>
                                    </div>
                                  )}
                                  {profile.phone && (!profile.is_phone_private || isAdmin || currentUser?.id === profile.id) && (
                                    <div className="flex items-center gap-2">
                                      <Phone size={14} className="text-slate-400 shrink-0" />
                                      <span>{profile.phone}</span>
                                    </div>
                                  )}
                                  {profile.phone && profile.is_phone_private && !isAdmin && currentUser?.id !== profile.id && (
                                    <div className="flex items-center gap-2">
                                      <Phone size={14} className="text-slate-400 shrink-0" />
                                      <span className="italic text-slate-400">Private</span>
                                    </div>
                                  )}
                                </div>
                                
                                {profile.bio && (
                                  <div className="mt-3 text-xs text-slate-600 italic line-clamp-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    "{profile.bio}"
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-teal-600 font-bold text-sm group-hover:translate-x-1 transition-transform">View Full Profile</span>
                              <div className="h-8 w-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all">
                                <ArrowRight size={16} />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))}
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
              <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-900 relative">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <div className="absolute -bottom-16 left-10 group">
                    {formData.avatar_url ? (
                      <img src={formData.avatar_url} alt={formData.name} className="h-32 w-32 rounded-[2.5rem] border-4 border-white bg-white object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="h-32 w-32 rounded-[2.5rem] border-4 border-white bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-4xl font-bold shadow-2xl group-hover:scale-105 transition-transform duration-500">
                        {formData.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="pt-20 px-10 pb-10">
                  {/* Verification Status Banner (View Mode) */}
                  <div className="mb-10 bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-inner">
                    <div className="flex items-center space-x-5">
                      <div className={`p-4 rounded-2xl shadow-sm ${
                        (formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com') ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        formData.verification_status === 'verified' ? 'bg-green-50 text-green-600 border border-green-100' :
                        formData.verification_status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                        formData.verification_status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                        'bg-slate-50 text-slate-400 border border-slate-200'
                      }`}>
                        {(formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com') ? (
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
                        className="bg-teal-600 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 premium-button"
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
                        <span className="text-teal-700 font-bold bg-teal-50 px-3 py-1 rounded-lg text-sm border border-teal-100">
                          {formData.department}
                        </span>
                        <span className="text-slate-400 font-bold text-sm">•</span>
                        <span className="text-slate-600 font-bold text-sm">
                          {formData.university}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all shadow-sm flex items-center premium-button"
                    >
                      <Edit size={18} className="mr-2 text-teal-600" /> Edit Profile Settings
                    </button>
                  </div>

                  <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-8">
                      <div className="glass-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border-slate-100 shadow-sm">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Academic Background</h3>
                        <div className="space-y-5">
                          <div className="flex items-center group">
                            <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mr-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
                              <GraduationCap size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">University Session</p>
                              <p className="text-slate-900 font-bold">{formData.batch}</p>
                            </div>
                          </div>
                          {formData.chemistry_batch && (
                            <div className="flex items-center group">
                              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mr-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
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
                              <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mr-4 group-hover:bg-teal-600 group-hover:text-white transition-all">
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
                            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                              <Briefcase size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Role</p>
                              <p className="text-slate-900 font-bold">{formData.job_title || formData.current_status}</p>
                            </div>
                          </div>
                          {formData.institute_name && (
                            <div className="flex items-center group">
                              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mr-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
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
                              <Mail size={16} className="text-teal-600 mr-3" />
                              <span className="text-xs font-bold text-slate-700 truncate">{formData.email}</span>
                            </div>
                          )}
                          {formData.phone && (
                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center truncate">
                                <Phone size={16} className="text-teal-600 mr-3" />
                                <span className="text-xs font-bold text-slate-700 truncate">{formData.phone}</span>
                                {formData.is_phone_private && (
                                  <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[8px] font-black uppercase rounded-md flex items-center">
                                    <EyeOff size={8} className="mr-1" /> Private
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => handleCopy(formData.phone!, 'profile-phone')}
                                className="p-1.5 hover:bg-slate-200 rounded-lg transition-all text-slate-400 hover:text-teal-600"
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Edit Profile</h2>
                    <p className="text-slate-500 mt-1">Update your information in the Bondhon directory.</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.is_public ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {formData.is_public ? <Eye size={16} /> : <EyeOff size={16} />}
                      <span className="hidden sm:inline">{formData.is_public ? 'Public Profile' : 'Private Profile'}</span>
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 space-y-8">
                  {/* Verification Status */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        (formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com') ? 'bg-amber-100 text-amber-600' :
                        formData.verification_status === 'verified' ? 'bg-green-100 text-green-600' :
                        formData.verification_status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        formData.verification_status === 'rejected' ? 'bg-red-100 text-red-600' :
                        'bg-slate-100 text-slate-400'
                      }`}>
                        {(formData.role === 'admin' || formData.email === 'fllimonm1212@gmail.com') ? (
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
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm"
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
                      className="absolute bottom-0 right-0 bg-teal-600 text-white p-2 rounded-full shadow-md hover:bg-teal-700 transition-colors"
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
                      <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Session (e.g. 2019-20) *</label>
                      <input required type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={formData.batch || ''} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chemistry Batch No. (e.g. 50th)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. 50th" value={formData.chemistry_batch || ''} onChange={(e) => setFormData({ ...formData, chemistry_batch: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Student ID (Optional)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. 1910123456" value={formData.student_id || ''} onChange={(e) => setFormData({ ...formData, student_id: e.target.value })} />
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
                      <select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white" value={formData.current_status || ''} onChange={(e) => setFormData({ ...formData, current_status: e.target.value as CurrentStatus })}>
                        <option value="" disabled>Select Status</option>
                        {STATUS_OPTIONS.map(status => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Job Title / Position</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Software Engineer" value={formData.job_title || ''} onChange={(e) => setFormData({ ...formData, job_title: e.target.value })} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Institute / Company Name</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Google" value={formData.institute_name || ''} onChange={(e) => setFormData({ ...formData, institute_name: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Location & Address</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Location (City/Country)</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Dhaka, Bangladesh" value={formData.location || ''} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Permanent Address</label>
                      <input type="text" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="e.g. Rajshahi, Bangladesh" value={formData.permanent_address || ''} onChange={(e) => setFormData({ ...formData, permanent_address: e.target.value })} />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <h3 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">About</h3>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bio / About Me</label>
                    <textarea rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none resize-none" placeholder="Write a short bio about yourself..." value={formData.bio || ''} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} />
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
                      <input type="tel" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="01XXXXXXXXX" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">Use the toggle above to hide your number from others.</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                      <input type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="email@example.com" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Facebook URL</label>
                      <input type="url" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://facebook.com/..." value={formData.social_links?.facebook || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, facebook: e.target.value } })} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">LinkedIn URL</label>
                      <input type="url" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" placeholder="https://linkedin.com/in/..." value={formData.social_links?.linkedin || ''} onChange={(e) => setFormData({ ...formData, social_links: { ...formData.social_links, linkedin: e.target.value } })} />
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors flex justify-center items-center space-x-2">
                    <UserIcon size={20} />
                    <span>Save My Profile</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>
      )}
          {activeTab === 'events' && (
            <motion.div 
              key="events"
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: 20 }} 
              transition={{ duration: 0.3 }}
              className="max-w-4xl mx-auto"
            >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6">
              <div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Community Events</h2>
                <p className="text-slate-500 mt-2 font-medium">Connect and celebrate with your chemistry family.</p>
              </div>
              <button
                onClick={() => setShowEventForm(!showEventForm)}
                className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-sm hover:bg-teal-700 transition-all shadow-lg shadow-teal-100 flex items-center premium-button"
              >
                {showEventForm ? <X size={18} className="mr-2" /> : <Calendar size={18} className="mr-2" />}
                {showEventForm ? 'Close Form' : 'Host New Event'}
              </button>
            </div>

            {showEventForm && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-12 overflow-hidden">
                <div className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] border-slate-100 premium-shadow">
                  <h3 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Event Details</h3>
                  <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Name</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g., Annual Alumni Gala 2024"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                        <textarea
                          placeholder="What's the plan? Share the excitement..."
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium h-32 resize-none"
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                        ></textarea>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Event Type</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium bg-white"
                            value={eventForm.event_type}
                            onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value as EventType })}
                          >
                            <option value="Reunion">Reunion</option>
                            <option value="Seminar">Seminar</option>
                            <option value="Webinar">Webinar</option>
                            <option value="Football Tournament">Football Tournament</option>
                            <option value="Cricket Tournament">Cricket Tournament</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date & Time</label>
                          <input
                            required
                            type="datetime-local"
                            className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                            value={eventForm.event_date}
                            onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Location / Link</label>
                        <div className="relative">
                          <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="text"
                            placeholder="Where is it happening?"
                            className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all font-medium"
                            value={eventForm.location}
                            onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={isCreatingEvent}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white py-4 rounded-2xl font-black text-sm hover:from-teal-700 hover:to-emerald-700 transition-all shadow-lg shadow-teal-100 disabled:opacity-50 premium-button mt-2"
                      >
                        {isCreatingEvent ? 'Creating Event...' : 'Launch Event'}
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {events.map(event => {
                const isGoing = event.user_rsvp?.some(r => r.status === 'Going');
                const isMaybe = event.user_rsvp?.some(r => r.status === 'Maybe');
                const rsvpCount = event.rsvps?.[0]?.count || 0;
                
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -5 }}
                    className="glass-card rounded-2xl sm:rounded-[2rem] premium-shadow overflow-hidden flex flex-col border-slate-100 group"
                  >
                    <div className="p-5 sm:p-8 flex-grow">
                      <div className="flex justify-between items-start mb-6">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-teal-50 text-teal-700 border border-teal-100">
                          {event.event_type}
                        </span>
                        <div className="flex items-center space-x-1 text-slate-400 font-bold text-xs">
                          <Users size={14} className="text-teal-500" />
                          <span>{rsvpCount} attending</span>
                        </div>
                      </div>
                      
                      <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight group-hover:text-teal-700 transition-colors">
                        {event.title}
                      </h3>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                          <CalendarDays size={18} className="mr-3 text-teal-600" />
                          {new Date(event.event_date).toLocaleString('en-US', { 
                            weekday: 'short', 
                            month: 'short', 
                            day: 'numeric', 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-sm font-bold text-slate-600 bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
                            <MapPin size={18} className="mr-3 text-teal-600" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {event.description && (
                        <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-3 mb-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gradient-to-br from-slate-50/80 to-white p-4 sm:p-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          {event.profiles?.avatar_url ? (
                            <img src={event.profiles.avatar_url} alt="" className="w-10 h-10 rounded-2xl object-cover shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-sm font-black text-slate-400 shadow-sm">
                              {event.profiles?.name?.charAt(0)}
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1">
                            <UserBadges profile={event.profiles} size={14} />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Organizer</span>
                          <span className="text-xs font-bold text-slate-700">{event.profiles?.name}</span>
                        </div>
                      </div>
                      
                      <div className="flex space-x-2 w-full sm:w-auto">
                        <button 
                          onClick={() => handleRSVP(event.id, 'Maybe')} 
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            isMaybe 
                              ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          Maybe
                        </button>
                        <button 
                          onClick={() => handleRSVP(event.id, 'Going')} 
                          className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center ${
                            isGoing 
                              ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' 
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {isGoing && <CheckCircle size={14} className="mr-2" />} 
                          {isGoing ? 'Going' : 'I\'m Going'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {events.length === 0 && (
                <div className="col-span-full text-center py-12 bg-white rounded-xl border border-slate-200">
                  <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-lg font-medium text-slate-900">No upcoming events</h3>
                  <p className="text-slate-500">Be the first to create an event!</p>
                </div>
              )}
            </div>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {profiles.filter(p => bookmarks.has(p.id)).map(profile => (
                <motion.div
                  key={profile.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ y: -8 }}
                  className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden group cursor-pointer border-slate-100"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <div className="p-5 sm:p-8 flex flex-col items-center text-center relative">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(profile.id); }}
                      className="absolute top-6 right-6 p-2 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                    >
                      <Bookmark size={18} className="fill-current" />
                    </button>
                    
                    <div className="relative mb-6">
                      {profile.avatar_url ? (
                        <img src={profile.avatar_url} alt={profile.name} className="h-24 w-24 rounded-[2rem] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="h-24 w-24 rounded-[2rem] bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 flex items-center justify-center text-3xl font-black border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
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
                    <p className="text-sm text-teal-700 font-bold mb-1 line-clamp-1 bg-teal-50 px-3 py-1 rounded-lg">
                      {profile.job_title || profile.current_status}
                    </p>
                    <p className="text-xs text-slate-400 font-bold line-clamp-1 uppercase tracking-widest mb-4">
                      {profile.institute_name || profile.university}
                    </p>
                    
                    <div className="w-full text-left space-y-2 text-xs text-slate-500">
                      <div className="flex flex-wrap justify-center gap-2 mb-3">
                        {profile.location && (
                          <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                            <MapPin size={10} className="mr-1 text-teal-500"/> {profile.location}
                          </span>
                        )}
                        <span className="flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                          <GraduationCap size={10} className="mr-1 text-teal-500"/> {profile.chemistry_batch ? `Batch ${profile.chemistry_batch}` : 'N/A'}
                        </span>
                      </div>
                      
                      {profile.department && profile.university && (
                        <div className="flex items-start gap-2">
                          <BookOpen size={14} className="text-slate-400 shrink-0 mt-0.5" />
                          <span>{profile.department}, {profile.university}</span>
                        </div>
                      )}
                      {profile.email && (
                        <div className="flex items-center gap-2">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{profile.email}</span>
                        </div>
                      )}
                      {profile.phone && (!profile.is_phone_private || isAdmin || currentUser?.id === profile.id) && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{profile.phone}</span>
                        </div>
                      )}
                      {profile.phone && profile.is_phone_private && !isAdmin && currentUser?.id !== profile.id && (
                        <div className="flex items-center gap-2">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span className="italic text-slate-400">Private</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-8 pb-8">
                    <button className="w-full py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-teal-600 transition-all premium-button">
                      View Full Profile
                    </button>
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
                    className="mt-8 bg-teal-600 text-white px-8 py-3 rounded-2xl font-bold text-sm hover:bg-teal-700 transition-all premium-button"
                  >
                    Explore Directory
                  </button>
                </div>
              )}
            </div>
          </motion.div>
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
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Admin Dashboard</h2>
                <p className="text-slate-500 mt-1">Manage users, view analytics, and export data.</p>
              </div>
              <div className="flex items-center space-x-3">
                <select
                  value={exportBatch}
                  onChange={(e) => setExportBatch(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">All Univ. Batches</option>
                  {uniqueBatches.map(batch => (
                    <option key={batch} value={batch}>Univ. Batch {batch}</option>
                  ))}
                </select>
                <select
                  value={exportChemistryBatch}
                  onChange={(e) => setExportChemistryBatch(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="">All Chem. Batches</option>
                  {uniqueChemistryBatches.map(batch => (
                    <option key={batch} value={batch}>Chem. Batch {batch}</option>
                  ))}
                </select>
                <button onClick={handleExportPDF} className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors flex items-center shadow-sm">
                  <FileText size={16} className="mr-2" /> Export PDF
                </button>
                <button onClick={handleExportCSV} className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors flex items-center shadow-sm">
                  <Database size={16} className="mr-2" /> Export CSV
                </button>
              </div>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <motion.div whileHover={{ y: -5 }} className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow border-slate-100 flex items-center space-x-4 sm:space-x-6">
                <div className="p-4 bg-teal-50 text-teal-600 rounded-2xl shadow-sm">
                  <Users size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Members</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{profiles.length}</h3>
                </div>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow border-slate-100 flex items-center space-x-4 sm:space-x-6">
                <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-sm">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Posts</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{posts.length}</h3>
                </div>
              </motion.div>
              <motion.div whileHover={{ y: -5 }} className="glass-card p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] premium-shadow border-slate-100 flex items-center space-x-4 sm:space-x-6">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-sm">
                  <Calendar size={32} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Events</p>
                  <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{events.length}</h3>
                </div>
              </motion.div>
            </div>

            {/* Verification Requests */}
            <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden mt-8 sm:mt-12 border-slate-100">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-100">
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
                            className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
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
            <div className="glass-card rounded-2xl sm:rounded-[2.5rem] premium-shadow overflow-hidden mt-8 sm:mt-12 border-slate-100">
              <div className="px-8 py-6 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Community Directory Management</h3>
              </div>
              <div className="overflow-x-auto">
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
                        <td className="px-8 py-5 text-sm font-black text-slate-900 tracking-tight">{p.name}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{p.email}</td>
                        <td className="px-8 py-5 text-sm font-bold text-slate-500">{p.batch || '-'}</td>
                        <td className="px-8 py-5 text-sm">
                          {p.role === 'admin' || p.email === 'fllimonm1212@gmail.com' ? (
                            <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-100">Admin</span>
                          ) : (
                            <span className="bg-slate-50 text-slate-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">Member</span>
                          )}
                        </td>
                        <td className="px-8 py-5 text-sm text-right space-x-4">
                          <button onClick={() => setSelectedProfile(p)} className="text-teal-600 hover:text-teal-800 font-black text-[10px] uppercase tracking-widest">View</button>
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
              <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100">
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
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none transition-all font-bold text-slate-700" 
                      placeholder="Enter registered email..."
                      value={adminEmailToAdd} 
                      onChange={e => setAdminEmailToAdd(e.target.value)} 
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-3 ml-1 uppercase tracking-tight">Note: User must already have an account.</p>
                  </div>
                  <button type="submit" disabled={isAddingAdmin} className="w-full bg-slate-900 text-white font-black py-4 px-6 rounded-2xl hover:bg-teal-600 transition-all disabled:opacity-50 uppercase text-xs tracking-widest premium-button">
                    {isAddingAdmin ? 'Processing...' : 'Grant Admin Privileges'}
                  </button>
                </form>
              </div>

              {/* Bulk Upload Info */}
              <div className="glass-card p-6 sm:p-10 rounded-2xl sm:rounded-[3rem] premium-shadow border-slate-100 flex flex-col">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                    <Database size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Bulk Operations</h3>
                </div>
                <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-100 text-sm text-slate-600 space-y-4 flex-grow">
                  <p className="font-bold">To bulk upload members, use the Supabase Infrastructure:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">1</div>
                      <span className="font-medium">Access Supabase Dashboard</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">2</div>
                      <span className="font-medium">Authentication &gt; Users &gt; Import</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 rounded-full bg-teal-600 text-white text-[10px] font-black flex items-center justify-center mt-0.5 mr-3 shrink-0">3</div>
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
            
            {/* Admin User List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Current Admins</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {profiles.filter(p => p.role === 'admin' || p.email === 'fllimonm1212@gmail.com').map(admin => (
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
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3rem] shadow-2xl relative flex flex-col premium-shadow border border-slate-100"
            >
              <button 
                onClick={() => setSelectedProfile(null)}
                className="absolute top-6 right-6 z-20 bg-white/20 hover:bg-white/40 text-white rounded-2xl p-3 transition-all backdrop-blur-md border border-white/30 shadow-xl"
              >
                <X size={24} />
              </button>

              {/* Cover & Avatar */}
              <div className="h-48 sm:h-64 bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 relative shrink-0 overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
                </div>
              </div>
              
              <div className="px-8 sm:px-16 pb-16 relative z-10">
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
                      <div className="text-teal-700 font-black mt-3 flex flex-wrap items-center gap-3 text-sm uppercase tracking-widest">
                        <span className="bg-teal-50 px-3 py-1 rounded-lg">{selectedProfile.department}</span>
                        <span className="text-slate-300">•</span>
                        <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg">{selectedProfile.university}</span>
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
                        <a href={`tel:${selectedProfile.phone}`} className="flex items-center justify-center h-14 px-8 rounded-2xl bg-teal-600 text-white hover:bg-teal-700 transition-all text-xs font-black uppercase tracking-widest shadow-lg shadow-teal-100 premium-button">
                          <Phone size={18} className="mr-2" /> Call Now
                        </a>
                        <button 
                          onClick={() => handleCopy(selectedProfile.phone!, selectedProfile.id)}
                          className="flex items-center justify-center h-14 w-14 rounded-2xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all shadow-lg shadow-slate-100"
                          title="Copy Number"
                        >
                          {copiedId === selectedProfile.id ? <Check size={18} className="text-teal-600" /> : <Copy size={18} />}
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
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  {/* Left Column (Main Info) */}
                  <div className="lg:col-span-2 space-y-12">
                    {selectedProfile.bio && (
                      <section>
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
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
                        <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                          <Briefcase size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Career & Status</h3>
                      </div>
                      <div className="glass-card border border-slate-100 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 space-y-4 sm:space-y-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                              <div className="text-teal-600 font-bold text-sm mt-1">{selectedProfile.institute_name}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>

                  {/* Right Column (Sidebar Info) */}
                  <div className="space-y-8">
                    <section className="bg-slate-50/50 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 border border-slate-100">
                      <h3 className="text-[10px] font-black text-slate-400 mb-8 uppercase tracking-widest">Academic & Location</h3>
                      <div className="space-y-8">
                        <div className="flex items-start space-x-4">
                          <div className="p-2.5 bg-white rounded-xl shadow-sm text-teal-600">
                            <GraduationCap size={20} />
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session & Batch</div>
                            <div className="text-sm font-black text-slate-900 tracking-tight">
                              {selectedProfile.chemistry_batch ? `${selectedProfile.chemistry_batch} Batch ` : ''}
                              {selectedProfile.batch ? `(${selectedProfile.batch})` : 'N/A'}
                              {selectedProfile.student_id && (
                                <div className="text-[10px] text-teal-600 mt-1">ID: {selectedProfile.student_id}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedProfile.location && (
                          <div className="flex items-start space-x-4">
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-teal-600">
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
                            <div className="p-2.5 bg-white rounded-xl shadow-sm text-teal-600">
                              <Map size={20} />
                            </div>
                            <div>
                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Permanent Address</div>
                              <div className="text-sm font-black text-slate-900 tracking-tight">{selectedProfile.permanent_address}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </section>

                    {(selectedProfile.social_links?.facebook || selectedProfile.social_links?.linkedin) && (
                      <section className="bg-slate-900 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-xl shadow-slate-200">
                        <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-widest">Digital Presence</h3>
                        <div className="flex gap-4">
                          {selectedProfile.social_links.facebook && (
                            <a href={selectedProfile.social_links.facebook} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-white transition-all flex items-center justify-center border border-white/10">
                              <Facebook size={24} />
                            </a>
                          )}
                          {selectedProfile.social_links.linkedin && (
                            <a href={selectedProfile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="flex-1 bg-white/10 hover:bg-white/20 p-4 rounded-2xl text-white transition-all flex items-center justify-center border border-white/10">
                              <Linkedin size={24} />
                            </a>
                          )}
                        </div>
                      </section>
                    )}
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
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete User</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete <strong>{userToDelete.name}</strong>? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button onClick={confirmDeleteUser} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">Delete User</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* DELETE POST CONFIRMATION MODAL */}
        {postToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full shadow-2xl"
            >
              <h3 className="text-xl font-bold text-slate-900 mb-2">Delete Post</h3>
              <p className="text-slate-600 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setPostToDelete(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button onClick={confirmDeletePost} className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors">Delete Post</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* EDIT POST MODAL */}
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-slate-900">Edit Post</h3>
                <button onClick={() => setEditingPost(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleUpdatePost}>
                <textarea
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none text-slate-800"
                  rows={6}
                  value={editingPost.content}
                  onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                  placeholder="What's on your mind?"
                  required
                />
                <div className="flex justify-end space-x-3 mt-6">
                  <button type="button" onClick={() => setEditingPost(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors shadow-md">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
