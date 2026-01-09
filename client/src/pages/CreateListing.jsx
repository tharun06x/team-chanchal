import React, { useState } from 'react';
import { db, storage } from '../firebase-config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Image as ImageIcon, X } from 'lucide-react';

export default function CreateListing() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: 'Electronics',
        condition: 'Used - Good'
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            setFiles([...files, ...Array.from(e.target.files)]);
        }
    };

    const removeFile = (index) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.price) return;

        setLoading(true);
        try {
            const data = new FormData();
            data.append('title', formData.title);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('category', formData.category);
            data.append('condition', formData.condition);
            data.append('sellerId', currentUser.uid);
            data.append('sellerName', currentUser.displayName || 'Anonymous');
            data.append('sellerPhoto', currentUser.photoURL || '');

            // Append files
            files.forEach(file => {
                data.append('images', file);
            });

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            const response = await fetch(`${API_URL}/api/listings`, {
                method: 'POST',
                body: data // No Content-Type header needed for FormData
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create listing');
            }

            navigate('/');
        } catch (error) {
            console.error("Error listing item:", error);
            alert(`Failed to create listing: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-indigo-600 px-8 py-6">
                    <h1 className="text-3xl font-bold text-white">Sell an Item</h1>
                    <p className="text-indigo-100 mt-2">List your item for sale in current college marketplace</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                    {/* Image Upload Section */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Item Photos</label>
                        <div className="mt-1 flex justify-center px-6 pt-10 pb-10 border-2 border-indigo-100 border-dashed rounded-xl hover:bg-indigo-50 transition-colors group cursor-pointer relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={handleFileChange}
                            />
                            <div className="space-y-2 text-center">
                                <div className="mx-auto h-16 w-16 text-indigo-200 group-hover:text-indigo-500 transition-colors rounded-full bg-indigo-50 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8" />
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                                </div>
                                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                            </div>
                        </div>

                        {/* Preview */}
                        {files.length > 0 && (
                            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {files.map((file, idx) => (
                                    <div key={idx} className="relative group">
                                        <img src={URL.createObjectURL(file)} alt="preview" className="h-32 w-full object-cover rounded-lg shadow-sm border border-gray-100" />
                                        <button
                                            type="button"
                                            onClick={() => removeFile(idx)}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-6">
                            <label className="block text-sm font-bold text-gray-700">What are you selling?</label>
                            <input
                                type="text"
                                name="title"
                                required
                                placeholder="e.g., Engineering Mathematics Textbook"
                                className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-3 text-lg"
                                value={formData.title}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-bold text-gray-700">Price (₹)</label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">₹</span>
                                </div>
                                <input
                                    type="number"
                                    name="price"
                                    required
                                    min="0"
                                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-7 py-3 sm:text-sm border-gray-300 rounded-lg"
                                    placeholder="0"
                                    value={formData.price}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-bold text-gray-700">Category</label>
                            <select
                                name="category"
                                className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                                value={formData.category}
                                onChange={handleChange}
                            >
                                {['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>

                        <div className="sm:col-span-6">
                            <label className="block text-sm font-bold text-gray-700">Condition</label>
                            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                {['New', 'Used - Like New', 'Used - Good', 'Used - Fair'].map((opt) => (
                                    <div
                                        key={opt}
                                        onClick={() => setFormData({ ...formData, condition: opt })}
                                        className={`cursor-pointer rounded-lg border p-3 text-center text-sm font-medium transition-all ${formData.condition === opt
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-600 ring-offset-2'
                                            : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        {opt}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sm:col-span-6">
                            <label className="block text-sm font-bold text-gray-700">Description</label>
                            <textarea
                                name="description"
                                rows={4}
                                placeholder="Describe the condition, features, why you're selling..."
                                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-3 px-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-lg font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1 hover:shadow-xl'}`}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Publishing Listing...
                                </span>
                            ) : (
                                'Post Listing for Sale'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
