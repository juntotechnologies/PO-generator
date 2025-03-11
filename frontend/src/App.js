import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import './index.css';

// Components
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Vendors from './pages/Vendors';
import LineItems from './pages/LineItems';
import PurchaseOrders from './pages/PurchaseOrders';
import CreatePurchaseOrder from './pages/CreatePurchaseOrder';
import EditPurchaseOrder from './pages/EditPurchaseOrder';
import UserProfile from './pages/UserProfile';

// Context
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navigation />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/vendors" element={<PrivateRoute><Vendors /></PrivateRoute>} />
          <Route path="/line-items" element={<PrivateRoute><LineItems /></PrivateRoute>} />
          <Route path="/purchase-orders" element={<PrivateRoute><PurchaseOrders /></PrivateRoute>} />
          <Route path="/purchase-orders/create" element={<PrivateRoute><CreatePurchaseOrder /></PrivateRoute>} />
          <Route path="/purchase-orders/edit/:id" element={<PrivateRoute><EditPurchaseOrder /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App; 