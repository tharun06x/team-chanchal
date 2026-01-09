import React, { useState } from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle, PlusCircle, Search, LogOut, Home, User } from 'lucide-react';

export default function Layout({ children }) {
    const { currentUser, logout } = useAuth();
    const location = useLocation();

    if (!currentUser) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
            {/* Navbar - Desktop */}
            <nav className="bg-white shadow-sm hidden md:block sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center">
                                <span className="text-xl font-bold text-indigo-600">CampusMarket</span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md font-medium">Browse</Link>
                            <Link to="/chat" className="text-gray-600 hover:text-gray-900 p-2 rounded-full relative">
                                <MessageCircle className="h-6 w-6" />
                                {/* Notification Badge could go here */}
                            </Link>
                            <Link to="/create-listing" className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 flex items-center">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Sell Item
                            </Link>
                            <div className="relative group">
                                <button className="flex items-center focus:outline-none">
                                    <img className="h-8 w-8 rounded-full" src={currentUser.photoURL} alt="" />
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block transition-all">
                                    <button onClick={logout} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left">
                                        <LogOut className="inline h-4 w-4 mr-2" />
                                        Sign out
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Bottom Nav - Mobile */}
            <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 md:hidden z-50">
                <div className="flex justify-around items-center h-16">
                    <Link to="/" className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
                        <Home className="h-6 w-6" />
                        <span className="text-xs">Home</span>
                    </Link>
                    <Link to="/create-listing" className="flex flex-col items-center text-indigo-600">
                        <div className="bg-indigo-600 rounded-full p-3 -mt-6 shadow-lg">
                            <PlusCircle className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-xs font-bold mt-1">Sell</span>
                    </Link>
                    <Link to="/chat" className="flex flex-col items-center text-gray-600 hover:text-indigo-600">
                        <MessageCircle className="h-6 w-6" />
                        <span className="text-xs">Chat</span>
                    </Link>
                    <button onClick={logout} className="flex flex-col items-center text-gray-600 hover:text-red-600">
                        <LogOut className="h-6 w-6" />
                        <span className="text-xs">Exit</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
