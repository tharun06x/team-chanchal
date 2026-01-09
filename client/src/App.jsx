import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import CreateListing from './pages/CreateListing';
import ItemDetails from './pages/ItemDetails';
import Chat from './pages/Chat';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={
                        <Layout>
                            <Home />
                        </Layout>
                    } />
                    <Route path="/create-listing" element={
                        <Layout>
                            <CreateListing />
                        </Layout>
                    } />
                    <Route path="/items/:id" element={
                        <Layout>
                            <ItemDetails />
                        </Layout>
                    } />
                    <Route path="/chat" element={
                        <Layout>
                            <Chat />
                        </Layout>
                    } />
                    <Route path="/chat/:conversationId" element={
                        <Layout>
                            <Chat />
                        </Layout>
                    } />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    )
}

export default App
