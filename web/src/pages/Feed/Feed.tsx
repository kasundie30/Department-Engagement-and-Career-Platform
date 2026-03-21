import React, { useState, useEffect, useRef } from 'react';
import { Image, Send, ThumbsUp, MessageSquare, MoreHorizontal, Share2 } from 'lucide-react';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { useSearch } from '../../contexts/SearchContext';
import { proxyMediaUrl } from '../../lib/mediaUrl';
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

export const Feed: React.FC = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // all, alumni, student, staff

    // Composer state
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    // Track posts whose image failed to load so we can show the placeholder instead
    const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());
    const handleImgError = (postId: string) =>
        setImgErrors(prev => new Set(prev).add(postId));

    const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
    const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

    const toggleComments = (postId: string) => {
        setExpandedComments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) newSet.delete(postId);
            else newSet.add(postId);
            return newSet;
        });
    };

    const fetchPosts = async (pageNum: number, currentFilter: string, append = false) => {
        try {
            setLoading(true);
            const res = await api.get('/api/v1/feed-service/feed', {
                params: {
                    page: pageNum,
                    limit: 10,
                    role: currentFilter !== 'all' ? currentFilter : undefined
                }
            });

            const data = res.data;
            // Handle both {items, meta} and plain array responses
            const newPosts = (Array.isArray(data) ? data : data.items ?? data.posts ?? [])
                .map((p: any) => ({ ...p, likes: p.likes ?? [], comments: p.comments ?? [] }));
            if (append) {
                setPosts(prev => [...prev, ...newPosts]);
            } else {
                setPosts(newPosts);
            }

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
            const nextPage = page + 1;
            setPage(nextPage);
            fetchPosts(nextPage, filter, true);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() && !imageFile) return;

        try {
            setIsSubmitting(true);

            // Step 1: upload image first (if any) to get an imageUrl
            let imageUrl: string | undefined;
            if (imageFile) {
                const formData = new FormData();
                formData.append('file', imageFile);          // backend expects field name 'file'
                const uploadRes = await api.post('/api/v1/feed-service/feed/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = uploadRes.data.imageUrl;
            }

            // Step 2: create post with JSON body
            const res = await api.post('/api/v1/feed-service/feed', {
                content: content.trim() || ' ',   // MinLength(1) — space satisfies it when image-only
                ...(imageUrl ? { imageUrl } : {}),
            });

            // Optimistic insert at top
            setPosts(prev => [{ ...res.data, likes: res.data.likes ?? [], comments: res.data.comments ?? [] }, ...prev]);
            setContent('');
            setImageFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error('Failed to create post', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLike = async (postId: string) => {
        try {
            // Optimistically update
            const currentUserId = user?.sub || 'me';
            setPosts(prev => prev.map(p => {
                if (p._id === postId) {
                    const likes = p.likes ?? [];
                    const hasLiked = likes.includes(currentUserId);
                    return {
                        ...p,
                        likes: hasLiked ? likes.filter(id => id !== currentUserId) : [...likes, currentUserId]
                    };
                }
                return p;
            }));

            await api.post(`/api/v1/feed-service/feed/${postId}/like`);
        } catch (err) {
            console.error('Failed to like post', err);
            // Revert in real app
        }
    };

    const handleShare = async (postId: string) => {
        try {
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, shareCount: (p.shareCount || 0) + 1 } : p));
            await api.post(`/api/v1/feed-service/feed/${postId}/share`);
        } catch (err) {
            console.error('Failed to share post', err);
        }
    };

    const handleAddComment = async (postId: string) => {
        const text = commentTexts[postId];
        if (!text || !text.trim()) return;

        try {
            const res = await api.post(`/api/v1/feed-service/feed/${postId}/comments`, { content: text.trim() });
            setPosts(prev => prev.map(p => {
                if (p._id === postId) {
                    return { ...p, comments: [...(p.comments || []), res.data] };
                }
                return p;
            }));
            setCommentTexts(prev => ({ ...prev, [postId]: '' }));
        } catch (err) {
            console.error('Failed to add comment', err);
        }
    };

    const { query } = useSearch();
    const filteredPosts = query
        ? posts.filter(p => (p.content ?? '').toLowerCase().includes(query.toLowerCase()))
        : posts;

    return (
        <div className="feed-page">
            <div className="feed-header">
                <h1>Activity Feed</h1>
                <div className="filter-tabs">
                    {['all', 'alumni', 'student', 'staff'].map(tab => (
                        <button
                            key={tab}
                            className={`filter-tab ${filter === tab ? 'active' : ''}`}
                            onClick={() => setFilter(tab)}
                        >
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
                            <div className="composer-avatar">{user?.firstName?.charAt(0) || 'U'}</div>
                            <form onSubmit={handlePostSubmit} className="composer-form">
                                <textarea
                                    placeholder="Share a project, ask a question, or post an update..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
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
                                            <Image size={20} />
                                            <span>Photo</span>
                                        </button>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        className="submit-btn"
                                        disabled={isSubmitting || (!content.trim() && !imageFile)}
                                    >
                                        {isSubmitting ? 'Posting...' : <><Send size={16} /> Post</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Feed Stream */}
                    <div className="feed-stream">
                        {filteredPosts.map(post => (
                            <div key={post._id} className="post-card card">
                                <div className="post-header">
                                    <div className="post-author-info">
                                        <div className="post-avatar">{post.userId?.charAt(0) || 'U'}</div>
                                        <div>
                                            <h4 className="post-author-name">User {post.userId.substring(0, 6)}</h4>
                                            <p className="post-time">{new Date(post.createdAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <button className="icon-btn"><MoreHorizontal size={20} /></button>
                                </div>

                                <div className="post-body">
                                    <p>{post.content}</p>
                                    <div className="post-image-container">
                                        {post.imageUrl && !imgErrors.has(post._id) ? (
                                            <img
                                                src={proxyMediaUrl(post.imageUrl)}
                                                alt="Post attachment"
                                                className="post-image"
                                                onError={() => handleImgError(post._id)}
                                            />
                                        ) : (
                                            <div className="post-image-placeholder">
                                                <Image size={32} strokeWidth={1.2} />
                                                <span>{post.imageUrl ? 'Image unavailable' : 'No image attached'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="post-actions">
                                    <button
                                        className={`action-btn ${(post.likes ?? []).includes(user?.sub || 'me') ? 'active' : ''}`}
                                        onClick={() => handleLike(post._id)}
                                    >
                                        <ThumbsUp size={18} />
                                        <span>{(post.likes ?? []).length} Likes</span>
                                    </button>
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
                                        <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '15px' }}>
                                            {(post.comments || []).map((c: any) => (
                                                <div key={c._id} className="comment-item" style={{ background: 'var(--card-bg)', padding: '10px 15px', borderRadius: '8px' }}>
                                                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>{c.userId.substring(0, 8)}...</div>
                                                    <div style={{ fontSize: '0.95rem' }}>{c.content}</div>
                                                </div>
                                            ))}
                                            {(post.comments || []).length === 0 && (
                                                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No comments yet.</div>
                                            )}
                                        </div>
                                        <div className="comment-input-area" style={{ display: 'flex', gap: '10px' }}>
                                            <input
                                                type="text"
                                                placeholder="Write a comment..."
                                                value={commentTexts[post._id] || ''}
                                                onChange={e => setCommentTexts(prev => ({ ...prev, [post._id]: e.target.value }))}
                                                style={{ flex: 1, padding: '8px 12px', borderRadius: '20px', border: '1px solid var(--border-color)', background: 'var(--card-bg)' }}
                                                onKeyDown={e => e.key === 'Enter' && handleAddComment(post._id)}
                                            />
                                            <button 
                                                onClick={() => handleAddComment(post._id)}
                                                disabled={!commentTexts[post._id]?.trim()}
                                                style={{ background: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {loading && <div className="loading-spinner">Loading posts...</div>}
                        {!loading && hasMore && (
                            <button className="load-more-btn" onClick={handleLoadMore}>
                                Load More
                            </button>
                        )}
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
