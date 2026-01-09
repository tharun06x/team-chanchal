import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageCircle, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Chat() {
    const { conversationId } = useParams();
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const bottomRef = useRef(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // 1. Fetch Conversations List

    useEffect(() => {
        if (!currentUser) return;

        async function fetchConversations() {
            try {
                const response = await fetch(`${API_URL}/api/conversations/${currentUser.uid}`);
                if (!response.ok) return;
                const data = await response.json();

                // Map _id to id
                setConversations(data.map(d => ({ ...d, id: d._id })));
            } catch (error) {
                console.error("Error fetching conversations:", error);
            }
        }

        fetchConversations();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchConversations, 5000);
        return () => clearInterval(interval);
    }, [currentUser]);

    // 2. Fetch Messages for Active Chat
    useEffect(() => {
        if (!conversationId) return;

        async function fetchMessages() {
            try {
                const response = await fetch(`${API_URL}/api/messages/${conversationId}`);
                if (!response.ok) return;
                const data = await response.json();
                const formattedData = data.map(d => ({ ...d, id: d._id }));

                // Smart Update: Only update state if data actually changed
                setMessages(prev => {
                    if (prev.length !== formattedData.length) {
                        return formattedData;
                    }
                    // Deep check if needed, but length check solves 90% of flicker
                    // For now, let's trust length for new message arrival
                    // If user edits message, this won't catch it, but that's fine for MVP
                    return prev;
                });

                // Update active chat title from conversations list
                const chat = conversations.find(c => c.id === conversationId);
                if (chat) setActiveChat(chat);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }

        fetchMessages();
        // Poll for message updates every 3 seconds
        const interval = setInterval(fetchMessages, 3000);

        return () => clearInterval(interval);
    }, [conversationId, conversations]); // Added conversations to dep array

    // 3. Smart Scroll Logic
    const messagesEndRef = useRef(null);
    const scrollContainerRef = useRef(null);

    useEffect(() => {
        if (!messagesEndRef.current || messages.length === 0) return;

        const isLastMessageByMe = messages[messages.length - 1].senderId === currentUser.uid;

        // Always scroll if I sent the message
        if (isLastMessageByMe) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Otherwise, check if user is near the bottom
        // This relies on the container ref which we need to attach
        const container = scrollContainerRef.current;
        if (container) {
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
            if (isNearBottom) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            // Fallback for first load if ref isn't attached yet
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, currentUser.uid]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        const text = newMessage;
        setNewMessage(''); // Optimistic clear

        try {
            const response = await fetch(`${API_URL}/api/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversationId,
                    senderId: currentUser.uid,
                    text
                })
            });

            if (response.ok) {
                // Fetch immediately to show new message
                const msgsResponse = await fetch(`${API_URL}/api/messages/${conversationId}`);
                const data = await msgsResponse.json();
                setMessages(data.map(d => ({ ...d, id: d._id })));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
    };

    // Helper to find the "other" participant
    const getOtherParticipant = (chat) => {
        // Handle new schema (Array of Objects)
        if (chat.participants && typeof chat.participants[0] === 'object') {
            return chat.participants.find(p => p.uid !== currentUser.uid) || {};
        }
        // Fallback for old schema (Array of Strings) - can't get name/photo easily
        return { displayName: 'User', photoURL: null };
    };

    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden h-[calc(100vh-8rem)] flex">
            {/* Sidebar List */}
            <div className={`w-full md:w-1/3 border-r border-gray-200 flex flex-col ${conversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-gray-50 font-bold text-gray-700">Messages</div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-4 text-gray-500 text-center text-sm">No conversations yet</div>
                    ) : (
                        conversations.map(chat => {
                            const otherUser = getOtherParticipant(chat);
                            return (
                                <Link to={`/chat/${chat.id}`} key={chat.id} className={`block p-4 border-b hover:bg-gray-50 ${chat.id === conversationId ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                                    <div className="flex items-center mb-2">
                                        {otherUser.photoURL ? (
                                            <img src={otherUser.photoURL} className="h-10 w-10 rounded-full mr-3 object-cover" alt="" />
                                        ) : (
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-bold">
                                                {otherUser.displayName ? otherUser.displayName[0] : 'U'}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between">
                                                <span className="font-bold text-gray-900 truncate">{otherUser.displayName || 'Unknown User'}</span>
                                                <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                                                    {chat.lastMessageTimestamp ? formatDistanceToNow(new Date(chat.lastMessageTimestamp)) : ''}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500 truncate">{chat.listingTitle}</p>
                                        </div>
                                    </div>
                                    <p className={`text-sm truncate ${chat.lastMessageBy !== currentUser.uid ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                        {chat.lastMessageBy === currentUser.uid ? 'You: ' : ''}{chat.lastMessage}
                                    </p>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
                {conversationId ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
                            <div className="flex items-center">
                                <Link to="/chat" className="md:hidden mr-3 text-gray-500">
                                    <div className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100">←</div>
                                </Link>

                                {(() => {
                                    const otherUser = getOtherParticipant(activeChat || conversations.find(c => c.id === conversationId) || {});
                                    return (
                                        <div className="flex items-center">
                                            {otherUser.photoURL ? (
                                                <img src={otherUser.photoURL} className="h-10 w-10 rounded-full mr-3 object-cover" alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3 text-indigo-600 font-bold">
                                                    {otherUser.displayName ? otherUser.displayName[0] : 'U'}
                                                </div>
                                            )}
                                            <div>
                                                <h2 className="font-bold text-gray-800">{otherUser.displayName || 'Chat'}</h2>
                                                <p className="text-xs text-gray-500">{activeChat?.listingTitle || 'Item'}</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <div className="flex items-center space-x-2">
                                <a
                                    href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=Meetup for ${activeChat?.listingTitle || 'Item'}&details=Discussing purchase of ${activeChat?.listingTitle}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:flex text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full items-center hover:bg-green-200"
                                >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Schedule
                                </a>
                            </div>
                        </div>

                        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.map(msg => {
                                const isMe = msg.senderId === currentUser.uid;
                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg text-sm ${isMe ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border text-gray-800 rounded-bl-none'}`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 border-t bg-white flex gap-2">
                            <input
                                type="text"
                                className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:border-indigo-500"
                                placeholder="Type a message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700">
                                <Send className="h-5 w-5" />
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <MessageCircle className="h-16 w-16 mb-4" />
                        <p>Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
