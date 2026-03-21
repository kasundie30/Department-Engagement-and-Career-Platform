import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '../../lib/axios';
import { useAuth } from '../../contexts/AuthContext';
import { SERVICE_URLS } from '../../config/services';
import { Send, Users, MessageSquarePlus, User as UserIcon } from 'lucide-react';
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

export const Messaging: React.FC = () => {
    const { user, getAccessToken } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Record<string, Message[]>>({});
    const [inputText, setInputText] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initMessaging = async () => {
            try {
                // Fetch conversations
                const res = await api.get('/api/v1/messaging-service/conversations');
                setConversations(res.data);
                
                // Init Socket
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

    // Fetch messages when selecting a conversation
    useEffect(() => {
        if (!selectedConvId) return;
        if (!messages[selectedConvId]) {
            api.get(`/api/v1/messaging-service/conversations/${selectedConvId}/messages`)
                .then(res => {
                    setMessages(prev => ({
                        ...prev,
                        [selectedConvId]: res.data.items || []
                    }));
                })
                .catch(err => console.error('Failed to load messages', err));
        }
        
        // Join conversation room
        if (socket) {
            socket.emit('join-conversation', { conversationId: selectedConvId });
        }
    }, [selectedConvId, socket, messages]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, selectedConvId]);

    const handleSendMessage = () => {
        if (!inputText.trim() || !selectedConvId || !socket) return;
        
        socket.emit('send-message', {
            conversationId: selectedConvId,
            content: inputText.trim()
        });
        
        setInputText('');
    };

    const getOtherParticipant = (conv: Conversation) => {
        if (conv.isGroup) return conv.name || 'Group Chat';
        const other = conv.participants.find(p => p.auth0Id !== user?.sub);
        return other?.name || 'Unknown User';
    };

    return (
        <div className="messaging-container">
            <div className="messaging-sidebar card">
                <div className="sidebar-header">
                    <h2>Messages</h2>
                    <button className="new-message-btn" title="New Message">
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
                {selectedConvId ? (
                    <>
                        <div className="chat-header">
                            <h3>{getOtherParticipant(conversations.find(c => c._id === selectedConvId)!)}</h3>
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
        </div>
    );
};
