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
import PublicDiaryListPage from './pages/PublicDiaryListPage';
import PublicDiaryFormPage from './pages/PublicDiaryFormPage';
import PublicDiaryDetailPage from './pages/PublicDiaryDetailPage';
import FriendsManagePage from './pages/FriendsManagePage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* 公開日記（認証不要） */}
          <Route path="/user/:accountId" element={<PublicDiaryListPage />} />
          <Route path="/user/:accountId/:diaryId" element={<PublicDiaryDetailPage />} />

          {/* ペア機能 */}
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

          {/* 公開日記管理（認証必要） */}
          <Route path="/my-public-diaries" element={
            <ProtectedRoute>
              <PublicDiaryListPage />
            </ProtectedRoute>
          } />
          <Route path="/my-public-diaries/new" element={
            <ProtectedRoute>
              <PublicDiaryFormPage />
            </ProtectedRoute>
          } />
          <Route path="/my-public-diaries/:diaryId/edit" element={
            <ProtectedRoute>
              <PublicDiaryFormPage />
            </ProtectedRoute>
          } />

          {/* フレンド管理 */}
          <Route path="/friends" element={
            <ProtectedRoute>
              <FriendsManagePage />
            </ProtectedRoute>
          } />

          <Route path="/" element={<Navigate to="/pairs" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
