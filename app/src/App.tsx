import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DoomScrollPage } from '@/pages/DoomScrollPage'
import { LifePage } from '@/pages/LifePage'
import { EventsPage } from '@/pages/EventsPage'
import { LeaderboardPage } from '@/pages/LeaderboardPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { ComposePage } from '@/pages/ComposePage'
import { EventDetailPage } from '@/pages/EventDetailPage'
import './index.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DoomScrollPage />} />
          <Route path="/life" element={<LifePage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
