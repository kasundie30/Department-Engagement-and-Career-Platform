import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICE_URLS } from '../../config/services';
import { Send, Users, MessageSquarePlus, User as UserIcon, X, Search } from 'lucide-react';
import { searchUsers } from '../../lib/userCache';
import './Messaging.css';

interface Message {
    _id: string;
    conversationId: string;
    senderId: string;
    content: string;
    createdAt: string;
}

interface Conversation {
    _id: string;
    participants: { auth0Id: string; name: string; avatar?: string }[];
    isGroup: boolean;
    name?: string;
    lastMessage?: Message;
}

interface UserResult {
    auth0Id: string;
    name: string;
    email: string;
    avatar: string;
}

export const Messaging: React.FC = () => {
    const { user, getAccessToken } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // New DM modal state
    const [showNewDmModal, setShowNewDmModal] = useState(false);
    const [dmQuery, setDmQuery] = useState('');
    const [dmResults, setDmResults] = useState<UserResult[]>([]);
    const [dmSearching, setDmSearching] = useState(false);
    const [dmCreating, setDmCreating] = useState(false);

    useEffect(() => {
        const initMessaging = async () => {
            try {
                const res = await api.get('/api/v1/messaging-service/conversations');
                setConversations(res.data);

                const token = await getAccessToken();
                const newSocket = io(SERVICE_URLS['messaging-service'] + '/messaging', {
                    auth: { token },
                    transports: ['websocket', 'polling']
                });

                newSocket.on('connect', () => console.log('WebSocket connected'));

                newSocket.on('message-received', (msg: Message) => {
                    setMessages(prev => ({
                        ...prev,
                        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg]
                    }));
                });

                setSocket(newSocket);

                return () => {
                    newSocket.disconnect();
                };
            } catch (err) {
                console.error('Failed to init messaging', err);
            }
        };

        initMessaging();
    }, [getAccessToken]);

    useEffect(() => {
        if (!selectedConvId) return;
        if (!messages[selectedConvId]) {
            api.get(`/api/v1/messaging-service/conversations/${selectedConvId}/messages`)
                .then(res => {
                    setMessages(prev => ({
                        ...prev,
                        [selectedConvId]: res.data.items || res.data || []
                    }));
                })
                .catch(err => console.error('Failed to load messages', err));
        }

        if (socket) {
            socket.emit('join-conversation', { conversationId: selectedConvId });
        }
    }, [selectedConvId, socket, messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedConvId]);

    // Search users for new DM
    useEffect(() => {
        if (dmQuery.trim().length < 2) {
            setDmResults([]);
            return;
        }
        setDmSearching(true);
        const timer = setTimeout(() => {
            searchUsers(dmQuery.trim())
                .then(results => setDmResults(results.filter(r => r.auth0Id !== user?.sub)))
                .finally(() => setDmSearching(false));
        }, 300);
        return () => clearTimeout(timer);
    }, [dmQuery, user?.sub]);

    const handleStartDm = async (targetUser: UserResult) => {
        setDmCreating(true);
        try {
            const res = await api.post('/api/v1/messaging-service/conversations/dm', {
                targetUserId: targetUser.auth0Id
            });
            const newConv: Conversation = res.data;
            setConversations(prev => {
                const exists = prev.find(c => c._id === newConv._id);
                return exists ? prev : [newConv, ...prev];
            });
            setSelectedConvId(newConv._id);
            setShowNewDmModal(false);
            setDmQuery('');
            setDmResults([]);
        } catch (err) {
            console.error('Failed to create conversation', err);
            alert('Failed to start conversation.');
        } finally {
            setDmCreating(false);
        }
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !selectedConvId) return;
        const content = inputText.trim();
        setInputText('');

        if (socket?.connected) {
            socket.emit('send-message', { conversationId: selectedConvId, content });
        } else {
            // REST fallback when socket is unavailable
            try {
                const res = await api.post(
                    `/api/v1/messaging-service/conversations/${selectedConvId}/messages`,
                    { content }
                );
                const msg: Message = res.data;
                setMessages(prev => ({
                    ...prev,
                    [selectedConvId]: [...(prev[selectedConvId] || []), msg]
                }));
            } catch (err) {
                console.error('Failed to send message', err);
                alert('Failed to send message.');
                setInputText(content); // restore
            }
        }
    };

    const getOtherParticipant = (conv: Conversation) => {
        if (conv.isGroup) return conv.name || 'Group Chat';
        const other = conv.participants.find(p => p.auth0Id !== user?.sub);
        return other?.name || 'Unknown User';
    };

    const selectedConv = conversations.find(c => c._id === selectedConvId);

    return (
        <div className="messaging-container">
            <div className="messaging-sidebar card">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button
                        className="new-message-btn"
                        title="New Message"
                        onClick={() => setShowNewDmModal(true)}
                    >
                        <MessageSquarePlus size={20} />
                    </button>
                </div>
                <div className="conversation-list">
                    {conversations.length === 0 ? (
                        <div className="empty-conversations">No conversations yet</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv._id}
                                className={`conversation-item ${selectedConvId === conv._id ? 'selected' : ''}`}
                                onClick={() => setSelectedConvId(conv._id)}
                            >
                                <div className="conversation-avatar">
                                    {conv.isGroup ? <Users size={20} /> : <UserIcon size={20} />}
                                </div>
                                <div className="conversation-info">
                                    <div className="conversation-name">{getOtherParticipant(conv)}</div>
                                    <div className="conversation-last-msg">
                                        {conv.lastMessage?.content || 'Say hi!'}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="messaging-main card">
                {selectedConvId && selectedConv ? (
                    <>
                        <div className="chat-header">
                            <h3>{getOtherParticipant(selectedConv)}</h3>
                        </div>
                        <div className="chat-messages">
                            {(messages[selectedConvId] || []).map((msg, idx) => {
                                const isMe = msg.senderId === user?.sub;
                                return (
                                    <div key={msg._id || idx} className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                                        <div className="message-content">{msg.content}</div>
                                        <div className="message-time">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="chat-input-area">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            />
                            <button className="send-btn" onClick={handleSendMessage} disabled={!inputText.trim()}>
                                <Send size={20} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="no-chat-selected">
                        <MessageSquarePlus size={48} className="empty-icon" />
                        <h2>Your Messages</h2>
                        <p>Select a conversation or start a new one.</p>
                    </div>
                )}
            </div>

            {/* New DM Modal */}
            {showNewDmModal && (
                <div className="modal-overlay" onClick={() => setShowNewDmModal(false)}>
                    <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
                        <div className="modal-header">
                            <h2>New Message</h2>
                            <button className="icon-btn" onClick={() => setShowNewDmModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '0 0 16px' }}>
                            <div style={{ position: 'relative', marginBottom: 12 }}>
                                <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Search by name or email..."
                                    value={dmQuery}
                                    onChange={e => setDmQuery(e.target.value)}
                                    style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 8, paddingBottom: 8, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
                                />
                            </div>
                            {dmSearching && <div style={{ color: '#888', fontSize: 13, padding: '4px 0' }}>Searching...</div>}
                            {!dmSearching && dmQuery.trim().length >= 2 && dmResults.length === 0 && (
                                <div style={{ color: '#888', fontSize: 13, padding: '4px 0' }}>No users found.</div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
                                {dmResults.map(u => (
                                    <button
                                        key={u.auth0Id}
                                        disabled={dmCreating}
                                        onClick={() => handleStartDm(u)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', border: 'none', background: 'none', borderRadius: 8, cursor: 'pointer', textAlign: 'left', width: '100%' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafc')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                                    >
                                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#667eea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14, flexShrink: 0 }}>
                                            {u.avatar
                                                ? <img src={u.avatar} alt={u.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                                                : (u.name?.[0] || '?').toUpperCase()
                                            }
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                                            <div style={{ color: '#888', fontSize: 12 }}>{u.email}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
