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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-20 md:pb-0 font-sans text-gray-900">
            {/* Navbar - Desktop */}
            <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-white/20 shadow-sm transition-all duration-300 hidden md:block">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 flex items-center group">
                                <div className="bg-indigo-600 text-white p-1.5 rounded-lg mr-2 group-hover:bg-indigo-700 transition-colors">
                                    <Home className="h-5 w-5" />
                                </div>
                                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                                    CampusMarket
                                </span>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-6">
                            <Link to="/" className="text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-md font-medium transition-colors">Browse</Link>
                            <Link to="/chat" className="text-gray-600 hover:text-indigo-600 p-2 rounded-full relative transition-colors">
                                <MessageCircle className="h-6 w-6" />
                            </Link>
                            <Link to="/create-listing" className="bg-gray-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-black hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center">
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Sell Item
                            </Link>
                            <div className="relative group pl-2 border-l border-gray-200">
                                <button className="flex items-center focus:outline-none ring-2 ring-transparent group-hover:ring-indigo-200 rounded-full transition-all">
                                    <img className="h-9 w-9 rounded-full object-cover border-2 border-white shadow-sm" src={currentUser.photoURL} alt="" />
                                </button>
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 hidden group-hover:block transition-all border border-gray-100 animation-fade-in-up">
                                    <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                        <p className="text-xs text-gray-500 font-medium">Signed in as</p>
                                        <p className="text-sm font-bold text-gray-900 truncate">{currentUser.displayName}</p>
                                    </div>
                                    <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-28">
                {children}
            </main>

            {/* Bottom Nav - Mobile */}
            <nav className="fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl md:hidden z-50 p-2">
                <div className="flex justify-around items-center h-12">
                    <Link to="/" className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${location.pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
                        <Home className="h-6 w-6" />
                    </Link>
                    <Link to="/create-listing" className="flex flex-col items-center justify-center">
                        <div className="bg-gray-900 rounded-full p-4 -mt-10 shadow-xl border-4 border-gray-100 hover:scale-110 transition-transform">
                            <PlusCircle className="h-6 w-6 text-white" />
                        </div>
                    </Link>
                    <Link to="/chat" className={`flex flex-col items-center justify-center w-full h-full rounded-xl transition-all ${location.pathname.startsWith('/chat') ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400'}`}>
                        <MessageCircle className="h-6 w-6" />
                    </Link>
                </div>
            </nav>
        </div>
    );
}
