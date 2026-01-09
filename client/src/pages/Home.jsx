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
            let url = 'http://localhost:5000/api/listings?';
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
        <div className="space-y-6">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search items..."
                        className="pl-10 w-full border border-gray-300 rounded-md py-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        className="border border-gray-300 rounded-md py-2 px-3"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Books">Books</option>
                        <option value="Furniture">Furniture</option>
                    </select>

                    <select
                        className="border border-gray-300 rounded-md py-2 px-3"
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
                <div className="text-center py-10">Loading...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredListings.map(item => (
                        <Link to={`/items/${item.id}`} key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                            <div className="aspect-w-16 aspect-h-9 w-full bg-gray-200">
                                <img
                                    src={item.images?.[0] || 'https://via.placeholder.com/400x300?text=No+Image'}
                                    alt={item.title}
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-indigo-600 font-medium">{item.category}</p>
                                        <h3 className="text-lg font-bold text-gray-900 mt-1">{item.title}</h3>
                                    </div>
                                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                        ₹{item.price}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                                    <span>{item.condition}</span>
                                    <span>{item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Just now'}</span>
                                </div>
                            </div>
                        </Link>
                    ))}
                    {filteredListings.length === 0 && (
                        <div className="col-span-full text-center py-10 text-gray-500">
                            No items found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
