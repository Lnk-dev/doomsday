import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WalletProvider } from '@/providers/WalletProvider'
import { useThemeStore } from '@/store'
import {
  FeedSkeleton,
  ProfileSkeleton,
  EventsListSkeleton,
  EventDetailSkeleton,
  LeaderboardSkeleton,
  PageLoader,
} from '@/components/ui/Skeleton'
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

function App() {
  const initTheme = useThemeStore((state) => state.initTheme)

  // Initialize theme on app load
  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
        <Route element={<AppLayout />}>
          {/* Feed pages - show feed skeleton */}
          <Route path="/" element={
            <Suspense fallback={<FeedSkeleton />}>
              <DoomScrollPage />
            </Suspense>
          } />
          <Route path="/life" element={
            <Suspense fallback={<FeedSkeleton />}>
              <LifePage />
            </Suspense>
          } />

          {/* Events pages - show events skeleton */}
          <Route path="/events" element={
            <Suspense fallback={<EventsListSkeleton />}>
              <EventsPage />
            </Suspense>
          } />
          <Route path="/events/:eventId" element={
            <Suspense fallback={<EventDetailSkeleton />}>
              <EventDetailPage />
            </Suspense>
          } />
          <Route path="/events/create" element={
            <Suspense fallback={<PageLoader />}>
              <CreateEventPage />
            </Suspense>
          } />

          {/* Leaderboard - show leaderboard skeleton */}
          <Route path="/leaderboard" element={
            <Suspense fallback={<LeaderboardSkeleton />}>
              <LeaderboardPage />
            </Suspense>
          } />

          {/* Profile pages - show profile skeleton */}
          <Route path="/profile" element={
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfilePage />
            </Suspense>
          } />
          <Route path="/timeline" element={
            <Suspense fallback={<FeedSkeleton count={3} />}>
              <LifeTimelinePage />
            </Suspense>
          } />
          <Route path="/timeline/:username" element={
            <Suspense fallback={<FeedSkeleton count={3} />}>
              <LifeTimelinePage />
            </Suspense>
          } />

          {/* Other pages - generic loader */}
          <Route path="/compose" element={
            <Suspense fallback={<PageLoader />}>
              <ComposePage />
            </Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          } />
          <Route path="/post/:postId" element={
            <Suspense fallback={<FeedSkeleton count={1} />}>
              <PostDetailPage />
            </Suspense>
          } />
        </Route>
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
