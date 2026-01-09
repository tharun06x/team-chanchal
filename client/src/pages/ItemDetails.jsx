import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import { doc, getDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, Trash2, ArrowLeft } from 'lucide-react';

export default function ItemDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchItem() {
            try {
                const response = await fetch(`http://localhost:5000/api/listings/${id}`);
                if (!response.ok) throw new Error('Item not found');
                const data = await response.json();
                // Ensure id field exists
                setItem({ ...data, id: data._id });
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }
        fetchItem();
    }, [id]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this listing?')) {
            try {
                await fetch(`http://localhost:5000/api/listings/${id}`, { method: 'DELETE' });
                navigate('/');
            } catch (error) {
                console.error("Failed to delete", error);
                alert("Failed to delete item");
            }
        }
    };

    const handleChat = async () => {
        if (!currentUser) return;

        try {
            const response = await fetch('http://localhost:5000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    senderId: currentUser.uid,
                    receiverId: item.sellerId,
                    listingId: item.id,
                    listingTitle: item.title
                })
            });

            if (!response.ok) throw new Error('Failed to start chat');

            const conversation = await response.json();
            navigate(`/chat/${conversation._id}`);
        } catch (error) {
            console.error("Error starting chat:", error);
            alert("Failed to start chat");
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!item) return <div>Item not found</div>;

    const isOwner = currentUser?.uid === item.sellerId;

    return (
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="md:flex">
                {/* Images */}
                <div className="md:w-1/2 bg-gray-200">
                    {item.images?.length > 0 ? (
                        <img src={item.images[0]} alt={item.title} className="w-full h-96 object-cover" />
                    ) : (
                        <div className="w-full h-96 flex items-center justify-center text-gray-500">No Image</div>
                    )}
                    {item.images?.length > 1 && (
                        <div className="flex overflow-x-auto p-2 space-x-2">
                            {item.images.map((img, i) => (
                                <img key={i} src={img} className="h-20 w-20 object-cover rounded cursor-pointer" />
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="p-8 md:w-1/2 flex flex-col">
                    <div className="flex-1">
                        <button onClick={() => navigate(-1)} className="mb-4 text-gray-500 hover:text-gray-700 flex items-center">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </button>
                        <div className="flex justify-between items-start">
                            <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                            <span className="text-2xl font-bold text-green-600">₹{item.price}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500 flex items-center space-x-4">
                            <span>{item.category}</span>
                            <span>•</span>
                            <span>{item.condition}</span>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-900">Description</h3>
                            <p className="mt-2 text-gray-600 leading-relaxed">{item.description}</p>
                        </div>

                        <div className="mt-8 border-t pt-6">
                            <div className="flex items-center">
                                <img src={item.sellerPhoto} className="h-10 w-10 rounded-full" alt="" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{item.sellerName}</p>
                                    <p className="text-xs text-gray-500">Seller</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        {isOwner ? (
                            <button
                                onClick={handleDelete}
                                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                            >
                                <Trash2 className="mr-2 h-5 w-5" />
                                Delete Listing
                            </button>
                        ) : (
                            <button
                                onClick={handleChat}
                                className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                            >
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Chat with Seller
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
