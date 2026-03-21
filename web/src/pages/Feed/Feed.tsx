import React, { useState, useEffect, useRef } from 'react';
import { Image, Send, MessageSquare, MoreHorizontal, Share2, Trash2 } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { proxyMediaUrl } from '../../lib/mediaUrl';
import { resolveUser, getUserInitials, UserInfo } from '../../lib/userCache';
import './Feed.css';

interface Post {
    _id: string;
    userId: string;
    content: string;
    imageUrl?: string;
    likes: string[];
    comments: any[];
    shareCount?: number;
    createdAt: string;
}

const EMOJIS = ['👍', '❤️', '😂', '😮'] as const;
type Emoji = typeof EMOJIS[number];

// Per-post emoji reactions stored in local state (optimistic overlay on top of backend likes[])
type PostReactions = Record<string, Emoji | null>; // postId → emoji user picked, or null

function UserAvatar({ auth0Id, size = 36 }: { auth0Id: string; size?: number }) {
    const [info, setInfo] = useState<UserInfo | null>(null);
    useEffect(() => {
        resolveUser(auth0Id).then(setInfo);
    }, [auth0Id]);
    if (info?.avatar) {
        return <img src={info.avatar} alt={info.name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />;
    }
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * 0.4 }}>
            {info ? getUserInitials(info.name) : '?'}
        </div>
    );
}

function UserName({ auth0Id }: { auth0Id: string }) {
    const [name, setName] = useState<string>('');
    useEffect(() => {
        resolveUser(auth0Id).then(u => setName(u.name));
    }, [auth0Id]);
    return <>{name || auth0Id.substring(0, 8) + '…'}</>;
}

export const Feed: React.FC = () => {
    const { user, hasRole } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');

    // Composer state
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
    const handleImgError = (postId: string) =>
        setImgErrors(prev => new Set(prev).add(postId));

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

    // Emoji reactions overlay (postId → chosen emoji for current user)
    const [reactions, setReactions] = useState<PostReactions>({});
    const [openReactionPicker, setOpenReactionPicker] = useState<string | null>(null);

    // Toast state
    const [toast, setToast] = useState<string | null>(null);
    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 2500);
    };

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const s = new Set(prev);
            s.has(postId) ? s.delete(postId) : s.add(postId);
            return s;
        });
    };

    const fetchPosts = async (pageNum: number, currentFilter: string, append = false) => {
        try {
            setLoading(true);
            const res = await api.get('/api/v1/feed-service/feed', {
                params: { page: pageNum, limit: 10, role: currentFilter !== 'all' ? currentFilter : undefined }
            });
            const data = res.data;
            const newPosts = (Array.isArray(data) ? data : data.items ?? data.posts ?? [])
                .map((p: any) => ({ ...p, likes: p.likes ?? [], comments: p.comments ?? [] }));
            setPosts(prev => append ? [...prev, ...newPosts] : newPosts);
            const totalPages = data.meta?.totalPages ?? data.totalPages ?? 1;
            setHasMore(pageNum < totalPages);
        } catch (err) {
            console.error('Failed to fetch posts', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
        fetchPosts(1, filter, false);
    }, [filter]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            const next = page + 1;
            setPage(next);
            fetchPosts(next, filter, true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) setImageFile(e.target.files[0]);
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;
        try {
            setIsSubmitting(true);
            let imageUrl: string | undefined;
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);
                const uploadRes = await api.post('/api/v1/feed-service/feed/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.imageUrl;
            }
            const res = await api.post('/api/v1/feed-service/feed', {
                content: content.trim() || ' ',
                ...(imageUrl ? { imageUrl } : {}),
            });
            // Re-fetch the post to get the confirmed imageUrl
            const confirmed = await api.get(`/api/v1/feed-service/feed/${res.data._id}`).catch(() => res);
            const newPost = { ...confirmed.data, likes: confirmed.data.likes ?? [], comments: confirmed.data.comments ?? [] };
            setPosts(prev => [newPost, ...prev]);
            setContent('');
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Failed to create post', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReaction = async (postId: string, emoji: Emoji) => {
        const currentUserId = user?.sub || 'me';
        const currentReaction = reactions[postId];
        const isToggleOff = currentReaction === emoji;

        setReactions(prev => ({ ...prev, [postId]: isToggleOff ? null : emoji }));
        setOpenReactionPicker(null);

        // Map to backend like/unlike
        setPosts(prev => prev.map(p => {
            if (p._id !== postId) return p;
            const likes = p.likes ?? [];
            const hasLiked = likes.includes(currentUserId);
            if (isToggleOff) {
                return { ...p, likes: likes.filter(id => id !== currentUserId) };
            }
            return { ...p, likes: hasLiked ? likes : [...likes, currentUserId] };
        }));

        try {
            if (isToggleOff) {
                await api.post(`/api/v1/feed-service/feed/${postId}/unlike`);
            } else {
                await api.post(`/api/v1/feed-service/feed/${postId}/like`);
            }
        } catch (err) {
            console.error('Failed to update reaction', err);
        }
    };

    const handleShare = async (postId: string) => {
        const url = `${window.location.origin}/feed#${postId}`;
        try {
            await navigator.clipboard.writeText(url);
            showToast('Link copied to clipboard!');
        } catch {
            showToast('Could not copy — share link: ' + url);
        }
        setPosts(prev => prev.map(p => p._id === postId ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p));
        try {
            await api.post(`/api/v1/feed-service/feed/${postId}/share`);
        } catch (err) {
            console.error('Failed to share post', err);
        }
    };

    const handleAddComment = async (postId: string) => {
        const text = commentTexts[postId];
        if (!text?.trim()) return;
        try {
            // Backend route is /comment (singular)
            const res = await api.post(`/api/v1/feed-service/feed/${postId}/comment`, { content: text.trim() });
            setPosts(prev => prev.map(p =>
                p._id === postId ? { ...p, comments: [...(p.comments || []), res.data] } : p
            ));
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    const handleDeletePost = async (postId: string) => {
        if (!window.confirm('Delete this post? This cannot be undone.')) return;
        try {
            await api.delete(`/api/v1/feed-service/feed/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (err) {
            console.error('Failed to delete post', err);
        }
    };

    const { query } = useSearch();
    const filteredPosts = query
        ? posts.filter(p => (p.content ?? '').toLowerCase().includes(query.toLowerCase()))
        : posts;

    return (
        <div className="feed-page">
            {toast && (
                <div style={{ position: 'fixed', top: 20, right: 20, background: 'var(--primary-color)', color: '#fff', padding: '10px 18px', borderRadius: 8, zIndex: 9999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                    {toast}
                </div>
            )}
            <div className="feed-header">
                <h1>Activity Feed</h1>
                <div className="filter-tabs">
                    {['all', 'alumni', 'student', 'staff'].map(tab => (
                        <button key={tab} className={`filter-tab ${filter === tab ? 'active' : ''}`} onClick={() => setFilter(tab)}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="feed-layout">
                <div className="feed-main">
                    {/* Post Composer */}
                    <div className="post-composer card">
                        <div className="composer-top">
                            <div className="composer-avatar">
                                {user?.picture
                                    ? <img src={user.picture} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                                    : (user?.firstName?.charAt(0) || 'U')}
                            </div>
                            <form onSubmit={handlePostSubmit} className="composer-form">
                                <textarea
                                    placeholder="Share a project, ask a question, or post an update..."
                                    value={content}
                                    onChange={e => setContent(e.target.value)}
                                    className="composer-input"
                                    rows={content.split('\n').length > 2 ? 3 : 2}
                                />
                                {imageFile && (
                                    <div className="composer-image-preview">
                                        <span>{imageFile.name} attached</span>
                                        <button type="button" onClick={() => setImageFile(null)}>✕</button>
                                    </div>
                                )}
                                <div className="composer-actions">
                                    <div className="composer-tools">
                                        <button type="button" className="tool-btn" onClick={() => fileInputRef.current?.click()}>
                                            <Image size={20} /><span>Photo</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
                                    </div>
                                    <button type="submit" className="submit-btn" disabled={isSubmitting || (!content.trim() && !imageFile)}>
                                        {isSubmitting ? 'Posting...' : <><Send size={16} /> Post</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Feed Stream */}
                    <div className="feed-stream">
                        {filteredPosts.map(post => {
                            const isOwner = post.userId === user?.sub;
                            const canDelete = isOwner || hasRole('admin');
                            const myReaction = reactions[post._id] ?? null;
                            const likeCount = (post.likes ?? []).length;

                            // Reaction counts (from likeCount, distributed to chosen emoji or default 👍)
                            const emojiCounts: Record<Emoji, number> = { '👍': 0, '❤️': 0, '😂': 0, '😮': 0 };
                            if (myReaction) {
                                emojiCounts[myReaction] = likeCount > 0 ? likeCount : 1;
                            } else if (likeCount > 0) {
                                emojiCounts['👍'] = likeCount;
                            }

                            return (
                                <div key={post._id} className="post-card card" id={post._id}>
                                    <div className="post-header">
                                        <div className="post-author-info">
                                            <UserAvatar auth0Id={post.userId} size={40} />
                                            <div style={{ marginLeft: 10 }}>
                                                <h4 className="post-author-name"><UserName auth0Id={post.userId} /></h4>
                                                <p className="post-time">{new Date(post.createdAt).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {canDelete && (
                                                <button className="icon-btn" title="Delete post" onClick={() => handleDeletePost(post._id)}>
                                                    <Trash2 size={18} style={{ color: 'var(--danger-color, #e53e3e)' }} />
                                                </button>
                                            )}
                                            <button className="icon-btn"><MoreHorizontal size={20} /></button>
                                        </div>
                                    </div>

                                    <div className="post-body">
                                        <p>{post.content}</p>
                                        {post.imageUrl && (
                                            <div className="post-image-container">
                                                {!imgErrors.has(post._id) ? (
                                                    <img
                                                        src={proxyMediaUrl(post.imageUrl)}
                                                        alt="Post attachment"
                                                        className="post-image"
                                                        onError={() => handleImgError(post._id)}
                                                    />
                                                ) : (
                                                    <div className="post-image-placeholder">
                                                        <Image size={32} strokeWidth={1.2} />
                                                        <span>Image unavailable</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div className="post-actions">
                                        {/* Emoji reactions */}
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <button
                                                className={`action-btn ${myReaction ? 'active' : ''}`}
                                                onClick={() => setOpenReactionPicker(p => p === post._id ? null : post._id)}
                                                title="React"
                                            >
                                                <span style={{ fontSize: 18 }}>{myReaction || '👍'}</span>
                                                <span>{likeCount > 0 ? likeCount : ''}</span>
                                            </button>
                                            {openReactionPicker === post._id && (
                                                <div style={{ position: 'absolute', bottom: '110%', left: 0, background: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '6px 10px', display: 'flex', gap: 8, zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
                                                    {EMOJIS.map(emoji => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => handleReaction(post._id, emoji)}
                                                            style={{ background: myReaction === emoji ? 'var(--bg-secondary)' : 'none', border: 'none', fontSize: 22, cursor: 'pointer', borderRadius: 8, padding: '2px 4px', transition: 'transform 0.1s', transform: myReaction === emoji ? 'scale(1.3)' : 'scale(1)' }}
                                                            title={emoji}
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Reaction summary row */}
                                        {likeCount > 0 && (
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', alignSelf: 'center' }}>
                                                {EMOJIS.filter(e => emojiCounts[e] > 0).map(e => `${e} ${emojiCounts[e]}`).join('  ')}
                                            </span>
                                        )}

                                        <button
                                            className={`action-btn ${expandedComments.has(post._id) ? 'active' : ''}`}
                                            onClick={() => toggleComments(post._id)}
                                        >
                                            <MessageSquare size={18} />
                                            <span>{(post.comments ?? []).length} Comments</span>
                                        </button>

                                        <button className="action-btn" onClick={() => handleShare(post._id)}>
                                            <Share2 size={18} />
                                            <span>{post.shareCount || 0} Shares</span>
                                        </button>
                                    </div>

                                    {expandedComments.has(post._id) && (
                                        <div className="post-comments-section" style={{ padding: '15px 20px', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                                            <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 15 }}>
                                                {(post.comments || []).map((c: any) => (
                                                    <div key={c._id} className="comment-item" style={{ background: 'var(--card-bg)', padding: '10px 15px', borderRadius: 8, display: 'flex', gap: 10 }}>
                                                        <UserAvatar auth0Id={c.userId} size={28} />
                                                        <div>
                                                            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: 2 }}><UserName auth0Id={c.userId} /></div>
                                                            <div style={{ fontSize: '0.95rem' }}>{c.content}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(post.comments || []).length === 0 && (
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No comments yet.</div>
                                                )}
                                            </div>
                                            <div className="comment-input-area" style={{ display: 'flex', gap: 10 }}>
                                                <input
                                                    type="text"
                                                    placeholder="Write a comment..."
                                                    value={commentTexts[post._id] || ''}
                                                    onChange={e => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                    style={{ flex: 1, padding: '8px 12px', borderRadius: 20, border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                                                    onKeyDown={e => e.key === 'Enter' && handleAddComment(post._id)}
                                                />
                                                <button
                                                    onClick={() => handleAddComment(post._id)}
                                                    disabled={!commentTexts[post._id]?.trim()}
                                                    style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {loading && <div className="loading-spinner">Loading posts...</div>}
                        {!loading && hasMore && <button className="load-more-btn" onClick={handleLoadMore}>Load More</button>}
                        {!hasMore && posts.length > 0 && <div className="end-of-feed">You've reached the end of the line!</div>}
                        {!loading && posts.length === 0 && <div className="empty-feed">No posts to show. Start the conversation!</div>}
                    </div>
                </div>

                <div className="feed-sidebar">
                    <div className="card trending-card">
                        <h3>Trending Now</h3>
                        <p className="placeholder-text">Trending topics will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
