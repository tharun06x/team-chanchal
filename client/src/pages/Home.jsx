import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Home() {
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('');
    const [sort, setSort] = useState('newest');

    useEffect(() => {
        fetchListings();
    }, [category, sort]);

    const fetchListings = async () => {
        setLoading(true);
        try {
            // Fetch from Backend API
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
            let url = `${API_URL}/api/listings?`;
            if (category) url += `&category=${category}`;
            if (sort) url += `&sort=${sort}`;

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch listings');

            const data = await response.json();

            // Safety check: ensure data is an array
            if (!Array.isArray(data)) {
                console.error("API did not return an array:", data);
                setListings([]);
                return;
            }

            // Map _id to id for frontend compatibility if needed, though we can use _id directly
            const mappedData = data.map(item => ({ ...item, id: item._id }));

            setListings(mappedData);
        } catch (error) {
            console.error("Error fetching listings:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredListings = listings.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* Hero / Search Section */}
            <div className="relative -mt-8 mb-12 py-16 px-4 sm:px-6 lg:px-8 bg-indigo-700 rounded-3xl overflow-hidden shadow-2xl">
                <div className="absolute inset-0">
                    <img
                        className="w-full h-full object-cover opacity-20"
                        src="https://img.freepik.com/free-vector/gradient-technological-background_23-2148884155.jpg"
                        alt="Background"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 mix-blend-multiply" />
                </div>
                <div className="relative max-w-3xl mx-auto text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
                        Find what you need.
                    </h1>
                    <p className="mt-4 text-xl text-indigo-100">
                        Buy and sell everything from books to furniture within your campus.
                    </p>

                    {/* Floating Search Bar */}
                    <div className="mt-8 sm:mx-auto sm:max-w-xl sm:flex relative">
                        <div className="min-w-0 flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="block w-full border-0 rounded-full py-4 pl-10 pr-4 text-gray-900 placeholder-gray-500 shadow-lg focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg transition-shadow"
                                placeholder="Search for books, electronics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-between items-center px-2">
                <h2 className="text-2xl font-bold text-gray-800">Latest Listings</h2>
                <div className="flex gap-3">
                    <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white shadow-sm"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Books">Books</option>
                        <option value="Furniture">Furniture</option>
                    </select>

                    <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white shadow-sm"
                        value={sort}
                        onChange={(e) => setSort(e.target.value)}
                    >
                        <option value="newest">Newest</option>
                        <option value="price_low">Price: Low to High</option>
                        <option value="price_high">Price: High to Low</option>
                    </select>
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredListings.map(item => (
                        <Link to={`/items/${item.id}`} key={item.id} className="group flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1 ring-1 ring-gray-100">
                            <div className="relative aspect-w-4 aspect-h-3 overflow-hidden bg-gray-200">
                                <img
                                    src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={item.title}
                                    className="w-full h-56 object-cover transform group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                                    <span className="text-xs font-bold text-indigo-800">{item.condition}</span>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col relative">
                                <div className="flex-1">
                                    <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">{item.category}</p>
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{item.description}</p>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xl font-extrabold text-gray-900">₹{item.price}</span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredListings.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                            <div className="bg-gray-100 rounded-full p-6 mb-4">
                                <Search className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No items found</h3>
                            <p className="mt-1 text-gray-500">Try adjusting your search or category filter.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
