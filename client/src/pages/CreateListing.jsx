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

            const response = await fetch('http://localhost:5000/api/listings', {
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
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Sell an Item</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                        type="text"
                        name="title"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.title}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Price (₹)</label>
                    <input
                        type="number"
                        name="price"
                        required
                        min="0"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.price}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Category</label>
                    <select
                        name="category"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.category}
                        onChange={handleChange}
                    >
                        {['Electronics', 'Books', 'Furniture', 'Clothing', 'Sports', 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Condition</label>
                    <select
                        name="condition"
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.condition}
                        onChange={handleChange}
                    >
                        <option>New</option>
                        <option>Used - Like New</option>
                        <option>Used - Good</option>
                        <option>Used - Fair</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                        name="description"
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        value={formData.description}
                        onChange={handleChange}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Photos</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                                <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                                    <span>Upload files</span>
                                    <input type="file" multiple accept="image/*" className="sr-only" onChange={handleFileChange} />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 grid grid-cols-3 gap-4">
                        {files.map((file, idx) => (
                            <div key={idx} className="relative">
                                <img src={URL.createObjectURL(file)} alt="preview" className="h-24 w-full object-cover rounded-md" />
                                <button type="button" onClick={() => removeFile(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50"
                >
                    {loading ? 'Posting...' : 'Post Listing'}
                </button>
            </form>
        </div>
    );
}
