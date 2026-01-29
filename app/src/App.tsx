import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AppLayout } from '@/components/layout/AppLayout'
import { WalletProvider } from '@/providers/WalletProvider'
import { RouteErrorBoundary } from '@/components/error'
import { PWAInstallPrompt, PWAUpdatePrompt } from '@/components/pwa'
import { Loader2 } from 'lucide-react'
import { useThemeStore } from '@/store'
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
const TrendingPage = lazy(() => import('@/pages/TrendingPage').then(m => ({ default: m.TrendingPage })))
const DiscoverPage = lazy(() => import('@/pages/DiscoverPage').then(m => ({ default: m.DiscoverPage })))
const NotFoundPage = lazy(() => import('@/components/error/NotFound').then(m => ({ default: m.NotFoundPage })))
const SearchPage = lazy(() => import('@/pages/SearchPage').then(m => ({ default: m.SearchPage })))
const TermsPage = lazy(() => import('@/pages/TermsPage').then(m => ({ default: m.TermsPage })))
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })))
const LandingPage = lazy(() => import('@/pages/LandingPage').then(m => ({ default: m.LandingPage })))
const HelpPage = lazy(() => import('@/pages/HelpPage').then(m => ({ default: m.HelpPage })))
const NotificationSettingsPage = lazy(() => import('@/pages/NotificationSettingsPage').then(m => ({ default: m.NotificationSettingsPage })))
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))
const ResponsibleGamblingPage = lazy(() => import('@/pages/ResponsibleGamblingPage').then(m => ({ default: m.ResponsibleGamblingPage })))
const StatusPage = lazy(() => import('@/pages/StatusPage').then(m => ({ default: m.StatusPage })))
const BettingLimitsPage = lazy(() => import('@/pages/BettingLimitsPage').then(m => ({ default: m.BettingLimitsPage })))
const MyBetsPage = lazy(() => import('@/pages/MyBetsPage').then(m => ({ default: m.MyBetsPage })))
const CreatorDashboardPage = lazy(() => import('@/pages/CreatorDashboardPage').then(m => ({ default: m.CreatorDashboardPage })))
const HashtagPage = lazy(() => import('@/pages/HashtagPage').then(m => ({ default: m.HashtagPage })))
const SubscriptionPage = lazy(() => import('@/pages/SubscriptionPage').then(m => ({ default: m.SubscriptionPage })))
const ActivityPage = lazy(() => import('@/pages/ActivityPage').then(m => ({ default: m.ActivityPage })))
const EmbedPostPage = lazy(() => import('@/pages/EmbedPostPage').then(m => ({ default: m.EmbedPostPage })))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const InboxPage = lazy(() => import('@/pages/InboxPage').then(m => ({ default: m.InboxPage })))
const ConversationPage = lazy(() => import('@/pages/ConversationPage').then(m => ({ default: m.ConversationPage })))
const NewMessagePage = lazy(() => import('@/pages/NewMessagePage').then(m => ({ default: m.NewMessagePage })))
const EmailVerificationPage = lazy(() => import('@/pages/EmailVerificationPage').then(m => ({ default: m.EmailVerificationPage })))

// Admin routes (separate bundle)
const AdminRoutes = lazy(() => import('@/admin/AdminRoutes'))

/** Loading spinner shown during lazy load */
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="w-8 h-8 text-[#ff3040] animate-spin" />
    </div>
  )
}

function App() {
  const initTheme = useThemeStore((state) => state.initTheme)

  // Initialize theme on app load
  useEffect(() => {
    initTheme()
  }, [initTheme])

  return (
    <WalletProvider>
      <BrowserRouter>
        <RouteErrorBoundary>
        <Routes>
          {/* Landing page outside AppLayout */}
          <Route path="/welcome" element={
            <Suspense fallback={<PageLoader />}>
              <LandingPage />
            </Suspense>
          } />
          {/* Onboarding flow outside AppLayout */}
          <Route path="/onboarding" element={
            <Suspense fallback={<PageLoader />}>
              <OnboardingPage />
            </Suspense>
          } />
          {/* Embed pages outside AppLayout */}
          <Route path="/embed/post/:postId" element={
            <Suspense fallback={<PageLoader />}>
              <EmbedPostPage />
            </Suspense>
          } />
          {/* Email verification (outside AppLayout) */}
          <Route path="/verify-email" element={
            <Suspense fallback={<PageLoader />}>
              <EmailVerificationPage />
            </Suspense>
          } />
          {/* Admin dashboard (separate bundle, outside main AppLayout) */}
          <Route path="/admin/*" element={
            <Suspense fallback={<PageLoader />}>
              <AdminRoutes />
            </Suspense>
          } />
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
          <Route path="/trending" element={
            <Suspense fallback={<PageLoader />}>
              <TrendingPage />
            </Suspense>
          } />
          <Route path="/discover" element={
            <Suspense fallback={<PageLoader />}>
              <DiscoverPage />
            </Suspense>
          } />
          <Route path="/search" element={
            <Suspense fallback={<PageLoader />}>
              <SearchPage />
            </Suspense>
          } />
          <Route path="/terms" element={
            <Suspense fallback={<PageLoader />}>
              <TermsPage />
            </Suspense>
          } />
          <Route path="/privacy" element={
            <Suspense fallback={<PageLoader />}>
              <PrivacyPage />
            </Suspense>
          } />
          <Route path="/help" element={
            <Suspense fallback={<PageLoader />}>
              <HelpPage />
            </Suspense>
          } />
          <Route path="/settings/notifications" element={
            <Suspense fallback={<PageLoader />}>
              <NotificationSettingsPage />
            </Suspense>
          } />
          <Route path="/settings/gambling" element={
            <Suspense fallback={<PageLoader />}>
              <ResponsibleGamblingPage />
            </Suspense>
          } />
          <Route path="/hashtag/:tag" element={
            <Suspense fallback={<PageLoader />}>
              <HashtagPage />
            </Suspense>
          } />
          <Route path="/status" element={
            <Suspense fallback={<PageLoader />}>
              <StatusPage />
            </Suspense>
          } />
          <Route path="/subscription" element={
            <Suspense fallback={<PageLoader />}>
              <SubscriptionPage />
            </Suspense>
          } />
          <Route path="/settings/betting-limits" element={
            <Suspense fallback={<PageLoader />}>
              <BettingLimitsPage />
            </Suspense>
          } />
          <Route path="/my-bets" element={
            <Suspense fallback={<PageLoader />}>
              <MyBetsPage />
            </Suspense>
          } />
          <Route path="/creator" element={
            <Suspense fallback={<PageLoader />}>
              <CreatorDashboardPage />
            </Suspense>
          } />
          <Route path="/activity" element={
            <Suspense fallback={<PageLoader />}>
              <ActivityPage />
            </Suspense>
          } />
          <Route path="/analytics" element={
            <Suspense fallback={<PageLoader />}>
              <AnalyticsPage />
            </Suspense>
          } />
          <Route path="/messages" element={
            <Suspense fallback={<PageLoader />}>
              <InboxPage />
            </Suspense>
          } />
          <Route path="/messages/new" element={
            <Suspense fallback={<PageLoader />}>
              <NewMessagePage />
            </Suspense>
          } />
          <Route path="/messages/:conversationId" element={
            <Suspense fallback={<PageLoader />}>
              <ConversationPage />
            </Suspense>
          } />
          <Route path="*" element={
            <Suspense fallback={<PageLoader />}>
              <NotFoundPage />
            </Suspense>
          } />
        </Route>
        </Routes>
        </RouteErrorBoundary>
        {/* PWA Components */}
        <PWAInstallPrompt />
        <PWAUpdatePrompt />
      </BrowserRouter>
    </WalletProvider>
  )
}

export default App
