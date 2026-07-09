import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';

// Pages
import Dashboard from './pages/Dashboard';
import HabitLogger from './pages/HabitLogger';
import History from './pages/History';
import Suggestions from './pages/Suggestions';
import Login from './pages/Login';
import Signup from './pages/Signup';

const App = () => {
  const { currentUser } = useAuth();

  return (
    <div className="app-container">
      {/* Navigation Layout: Visible only if logged in */}
      {currentUser && (
        <>
          <Sidebar />
          <BottomNav />
        </>
      )}

      {/* Main Viewport */}
      <main className={currentUser ? 'main-content' : ''} style={{ width: '100%' }}>
        <Routes>
          {/* Public Auth Routes */}
          <Route 
            path="/login" 
            element={!currentUser ? <Login /> : <Navigate to="/" replace />} 
          />
          <Route 
            path="/signup" 
            element={!currentUser ? <Signup /> : <Navigate to="/" replace />} 
          />

          {/* Protected Main Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute>
                <HabitLogger />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/suggestions"
            element={
              <ProtectedRoute>
                <Suggestions />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
