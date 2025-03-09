import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import EditPurchaseOrder from './pages/EditPurchaseOrder';
import Vendors from './pages/Vendors';
import LineItems from './pages/LineItems';
import NotFound from './pages/NotFound';
import Layout from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="purchase-orders" element={<PurchaseOrders />} />
          <Route path="purchase-orders/create" element={<CreatePurchaseOrder />} />
          <Route path="purchase-orders/:id" element={<EditPurchaseOrder />} />
          <Route path="vendors" element={<Vendors />} />
          <Route path="line-items" element={<LineItems />} />
        </Route>
        
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App; 