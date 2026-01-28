/**
 * LandingPage
 *
 * Marketing landing page for Doomsday.
 * Communicates value proposition and drives user acquisition.
 */

import { useNavigate } from 'react-router-dom'
import { Skull, Heart, Flame, Trophy, TrendingUp, Users, ArrowRight, Zap, Shield, Clock } from 'lucide-react'

export function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff3040]/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00ba7c]/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff3040]/10 text-[#ff3040] text-sm mb-8">
            <Zap className="w-4 h-4" />
            <span>Now with $DOOM Token Economy</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Life's a Countdown.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff3040] to-[#00ba7c]">
              Make It Count.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-[#aaa] mb-12 max-w-2xl mx-auto">
            Track your doom scroll, celebrate life moments, and predict the future
            with $DOOM tokens. The social app that turns mortality into motivation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-[#ff3040] text-white font-semibold text-lg rounded-full hover:bg-[#e62a38] transition-colors"
            >
              Launch App
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="flex items-center justify-center gap-2 px-8 py-4 border border-[#333] text-white font-semibold text-lg rounded-full hover:bg-[#111] transition-colors"
            >
              Learn More
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-16">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#ff3040]">10K+</p>
              <p className="text-[#777]">Active Doomers</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-[#00ba7c]">50K+</p>
              <p className="text-[#777]">Predictions Made</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">1M+</p>
              <p className="text-[#777]">$DOOM Staked</p>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-[#333] rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-[#ff3040] rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Doomsday?</h2>
            <p className="text-xl text-[#777] max-w-2xl mx-auto">
              A prediction market meets social media. Stake your beliefs, follow the zeitgeist.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Prediction Markets */}
            <div className="p-6 bg-[#111] rounded-2xl border border-[#222] hover:border-[#ff3040]/50 transition-colors">
              <div className="w-12 h-12 bg-[#ff3040]/10 rounded-xl flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-[#ff3040]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prediction Markets</h3>
              <p className="text-[#aaa]">
                Stake $DOOM on world events. Bet on the pessimistic view, or stake $LIFE for optimism.
              </p>
            </div>

            {/* Feature 2: Social Feed */}
            <div className="p-6 bg-[#111] rounded-2xl border border-[#222] hover:border-[#00ba7c]/50 transition-colors">
              <div className="w-12 h-12 bg-[#00ba7c]/10 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#00ba7c]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Social Feed</h3>
              <p className="text-[#aaa]">
                Share thoughts, follow doomers, track trending topics. A social network with stakes.
              </p>
            </div>

            {/* Feature 3: Leaderboard */}
            <div className="p-6 bg-[#111] rounded-2xl border border-[#222] hover:border-[#ff6b35]/50 transition-colors">
              <div className="w-12 h-12 bg-[#ff6b35]/10 rounded-xl flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6 text-[#ff6b35]" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Leaderboard</h3>
              <p className="text-[#aaa]">
                Compete for the top spot. Earn badges for accurate predictions and engagement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-[#777] max-w-2xl mx-auto">
              Get started in minutes. No complicated setup required.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '01', icon: Users, title: 'Create Account', desc: 'Sign up with your wallet or browse anonymously' },
              { step: '02', icon: TrendingUp, title: 'Find Events', desc: 'Browse prediction markets on world events' },
              { step: '03', icon: Skull, title: 'Stake $DOOM', desc: 'Bet on pessimistic outcomes with $DOOM tokens' },
              { step: '04', icon: Trophy, title: 'Win Rewards', desc: 'Accurate predictions earn you rewards' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-[#ff3040] text-sm font-mono mb-4">{item.step}</div>
                <div className="w-16 h-16 mx-auto bg-[#111] rounded-2xl flex items-center justify-center mb-4 border border-[#222]">
                  <item.icon className="w-8 h-8 text-[#777]" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-[#777] text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Token Economics Section */}
      <section className="py-24 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Dual Token Economy</h2>
              <p className="text-xl text-[#aaa] mb-8">
                Doomsday features two tokens representing opposing worldviews.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#ff3040]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Skull className="w-5 h-5 text-[#ff3040]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#ff3040]">$DOOM Token</h3>
                    <p className="text-[#aaa]">Stake on pessimistic outcomes. For the realists who see what's coming.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-[#00ba7c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Heart className="w-5 h-5 text-[#00ba7c]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#00ba7c]">$LIFE Token</h3>
                    <p className="text-[#aaa]">Stake on optimistic outcomes. For those who believe in brighter days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square bg-gradient-to-br from-[#ff3040]/20 to-[#00ba7c]/20 rounded-3xl flex items-center justify-center">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#ff3040]/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Skull className="w-12 h-12 text-[#ff3040]" />
                    </div>
                    <p className="text-2xl font-bold text-[#ff3040]">$DOOM</p>
                  </div>
                  <div className="text-4xl text-[#333]">⚡</div>
                  <div className="text-center">
                    <div className="w-24 h-24 bg-[#00ba7c]/20 rounded-full flex items-center justify-center mb-4 mx-auto">
                      <Heart className="w-12 h-12 text-[#00ba7c]" />
                    </div>
                    <p className="text-2xl font-bold text-[#00ba7c]">$LIFE</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="w-12 h-12 mx-auto bg-[#111] rounded-xl flex items-center justify-center mb-4 border border-[#222]">
                <Shield className="w-6 h-6 text-[#00ba7c]" />
              </div>
              <h3 className="font-semibold mb-2">Secure</h3>
              <p className="text-[#777] text-sm">Built on blockchain technology with transparent transactions</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-[#111] rounded-xl flex items-center justify-center mb-4 border border-[#222]">
                <Clock className="w-6 h-6 text-[#ff6b35]" />
              </div>
              <h3 className="font-semibold mb-2">Real-time</h3>
              <p className="text-[#777] text-sm">Live updates on predictions, odds, and social activity</p>
            </div>
            <div>
              <div className="w-12 h-12 mx-auto bg-[#111] rounded-xl flex items-center justify-center mb-4 border border-[#222]">
                <Users className="w-6 h-6 text-[#ff3040]" />
              </div>
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-[#777] text-sm">Join thousands of doomers sharing predictions</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#0a0a0a] to-black">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to embrace the{' '}
            <span className="text-[#ff3040]">Doom</span>?
          </h2>
          <p className="text-xl text-[#aaa] mb-12">
            Join the prediction market where your worldview pays off.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-12 py-5 bg-[#ff3040] text-white font-semibold text-xl rounded-full hover:bg-[#e62a38] transition-all hover:scale-105"
          >
            Launch Doomsday
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-[#222]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Skull className="w-6 h-6 text-[#ff3040]" />
              <span className="text-lg font-bold">Doomsday</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#777]">
              <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
                Terms
              </button>
              <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
                Privacy
              </button>
              <a href="mailto:hello@doomsday.app" className="hover:text-white transition-colors">
                Contact
              </a>
            </div>
            <p className="text-sm text-[#555]">
              © 2026 Doomsday. The end is near.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
