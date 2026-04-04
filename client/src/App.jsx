import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Learn from './pages/Learn';
import Chapter from './pages/Chapter';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import About from './pages/About';
import Tutor from './pages/Tutor';
import HowItWorks from './pages/HowItWorks';

function RequireAuth({ children }) {
  const token = document.cookie.includes('connect.sid');
  // We rely on session cookie; redirect to login if API says not authenticated
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
        <Route path="about" element={<About />} />
        <Route path="how-it-works" element={<HowItWorks />} />
        <Route path="learn" element={<RequireAuth><Learn /></RequireAuth>} />
        <Route path="learn/chapter/:id" element={<RequireAuth><Chapter /></RequireAuth>} />
        <Route path="learn/:slug" element={<RequireAuth><Chapter /></RequireAuth>} />
        <Route path="quiz" element={<RequireAuth><Quiz /></RequireAuth>} />
        <Route path="profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="tutor" element={<RequireAuth><Tutor /></RequireAuth>} />
        <Route path="editor" element={<EditorRedirect />} />
        <Route path="playground" element={<PlaygroundRedirect />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function EditorRedirect() {
  window.location.href = '/editor.html';
  return <div style={{ padding: '2rem', textAlign: 'center' }}>Redirecting to Network Builder…</div>;
}

function PlaygroundRedirect() {
  window.location.href = '/playground.html';
  return <div style={{ padding: '2rem', textAlign: 'center' }}>Redirecting…</div>;
}
