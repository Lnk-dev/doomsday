import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Loader2 } from 'lucide-react'
import './index.css'

// Lazy load page components for code splitting
const DoomScrollPage = lazy(() => import('@/pages/DoomScrollPage').then(m => ({ default: m.DoomScrollPage })))
const LifePage = lazy(() => import('@/pages/LifePage').then(m => ({ default: m.LifePage })))
const EventsPage = lazy(() => import('@/pages/EventsPage').then(m => ({ default: m.EventsPage })))
const LeaderboardPage = lazy(() => import('@/pages/LeaderboardPage').then(m => ({ default: m.LeaderboardPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const ComposePage = lazy(() => import('@/pages/ComposePage').then(m => ({ default: m.ComposePage })))
const EventDetailPage = lazy(() => import('@/pages/EventDetailPage').then(m => ({ default: m.EventDetailPage })))
const CreateEventPage = lazy(() => import('@/pages/CreateEventPage').then(m => ({ default: m.CreateEventPage })))
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const PostDetailPage = lazy(() => import('@/pages/PostDetailPage').then(m => ({ default: m.PostDetailPage })))
const LifeTimelinePage = lazy(() => import('@/pages/LifeTimelinePage').then(m => ({ default: m.LifeTimelinePage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })))

/** Loading spinner shown during lazy load */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[#ff3040] animate-spin" />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <Suspense fallback={<PageLoader />}>
              <DoomScrollPage />
            </Suspense>
          } />
          <Route path="/life" element={
            <Suspense fallback={<PageLoader />}>
              <LifePage />
            </Suspense>
          } />
          <Route path="/events" element={
            <Suspense fallback={<PageLoader />}>
              <EventsPage />
            </Suspense>
          } />
          <Route path="/leaderboard" element={
            <Suspense fallback={<PageLoader />}>
              <LeaderboardPage />
            </Suspense>
          } />
          <Route path="/profile" element={
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          } />
          <Route path="/compose" element={
            <Suspense fallback={<PageLoader />}>
              <ComposePage />
            </Suspense>
          } />
          <Route path="/events/:eventId" element={
            <Suspense fallback={<PageLoader />}>
              <EventDetailPage />
            </Suspense>
          } />
          <Route path="/events/create" element={
            <Suspense fallback={<PageLoader />}>
              <CreateEventPage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          } />
          <Route path="/post/:postId" element={
            <Suspense fallback={<PageLoader />}>
              <PostDetailPage />
            </Suspense>
          } />
          <Route path="/timeline" element={
            <Suspense fallback={<PageLoader />}>
              <LifeTimelinePage />
            </Suspense>
          } />
          <Route path="/timeline/:username" element={
            <Suspense fallback={<PageLoader />}>
              <LifeTimelinePage />
            </Suspense>
          } />
          <Route path="/search" element={
            <Suspense fallback={<PageLoader />}>
              <SearchPage />
            </Suspense>
          } />
          <Route path="/profile/:username" element={
            <Suspense fallback={<PageLoader />}>
              <ProfilePage />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
