import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Chat() {
    const { conversationId } = useParams();
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [activeChat, setActiveChat] = useState(null);
    const bottomRef = useRef(null);

    // 1. Fetch Conversations List
    useEffect(() => {
        if (!currentUser) return;

        async function fetchConversations() {
            try {
                const response = await fetch(`http://localhost:5000/api/conversations/${currentUser.uid}`);
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
                const response = await fetch(`http://localhost:5000/api/messages/${conversationId}`);
                if (!response.ok) return;
                const data = await response.json();

                setMessages(data.map(d => ({ ...d, id: d._id })));

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
    }, [conversationId, conversations]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversationId) return;

        const text = newMessage;
        setNewMessage(''); // Optimistic clear

        try {
            const response = await fetch('http://localhost:5000/api/messages', {
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
                const msgsResponse = await fetch(`http://localhost:5000/api/messages/${conversationId}`);
                const data = await msgsResponse.json();
                setMessages(data.map(d => ({ ...d, id: d._id })));
            }
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message");
        }
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
                        conversations.map(chat => (
                            <Link to={`/chat/${chat.id}`} key={chat.id} className={`block p-4 border-b hover:bg-gray-50 ${chat.id === conversationId ? 'bg-indigo-50 border-indigo-200' : ''}`}>
                                <div className="flex justify-between mb-1">
                                    <span className="font-medium text-gray-900 truncate w-2/3">{chat.listingTitle || 'Item'}</span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {chat.lastMessageTimestamp ? formatDistanceToNow(new Date(chat.lastMessageTimestamp)) : ''}
                                    </span>
                                </div>
                                <p className={`text-sm truncate ${chat.lastMessageBy !== currentUser.uid ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                                    {chat.lastMessageBy === currentUser.uid ? 'You: ' : ''}{chat.lastMessage}
                                </p>
                            </Link>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`w-full md:w-2/3 flex flex-col ${!conversationId ? 'hidden md:flex' : 'flex'}`}>
                {conversationId ? (
                    <>
                        <div className="p-4 border-b flex items-center justify-between">
                            <h2 className="font-bold text-gray-800">{activeChat?.listingTitle || 'Chat'}</h2>
                            <Link to="/chat" className="md:hidden text-sm text-indigo-600">Back</Link>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
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
                            <div ref={bottomRef} />
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
