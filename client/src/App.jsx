import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PairsPage from './pages/PairsPage';
import CreatePairPage from './pages/CreatePairPage';
import DiaryListPage from './pages/DiaryListPage';
import DiaryDetailPage from './pages/DiaryDetailPage';
import DiaryFormPage from './pages/DiaryFormPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pairs" element={
            <ProtectedRoute>
              <PairsPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/create" element={
            <ProtectedRoute>
              <CreatePairPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/:pairId/diaries" element={
            <ProtectedRoute>
              <DiaryListPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/:pairId/calendar" element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/:pairId/diaries/new" element={
            <ProtectedRoute>
              <DiaryFormPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/:pairId/diaries/:diaryId" element={
            <ProtectedRoute>
              <DiaryDetailPage />
            </ProtectedRoute>
          } />
          <Route path="/pairs/:pairId/diaries/:diaryId/edit" element={
            <ProtectedRoute>
              <DiaryFormPage />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/pairs" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
