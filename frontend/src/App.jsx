import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import JoinMeeting from './pages/JoinMeeting';
import MeetingRoom from './pages/MeetingRoom';
import History from './pages/History';
import Profile from './pages/Profile';
import DownloadApp from './pages/DownloadApp';
import UpdatePrompt from './components/desktop/UpdatePrompt';

export default function App() {
  return (
    <>
      <UpdatePrompt />
      <Routes>
      <Route path="/download" element={<DownloadApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />
      <Route path="/join" element={<JoinMeeting />} />
      <Route path="/join/:code" element={<JoinMeeting />} />
      <Route path="/meeting/:code" element={<MeetingRoom />} />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <History />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
