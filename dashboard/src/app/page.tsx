import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { ROICalculator } from "@/components/landing/roi-calculator";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main>
        <Hero />
        <div id="features">
          <Features />
        </div>
        <div id="roi">
          <ROICalculator />
        </div>

        {/* Final CTA */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to automate your sprint planning?
            </h2>
            <p className="text-zinc-400 text-lg mb-8">
              Connect your GitHub organization and see results in under 60
              seconds. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/dashboard"
                className="inline-flex items-center justify-center h-14 px-10 text-lg font-medium rounded-xl bg-violet-600 text-white hover:bg-violet-500 shadow-lg shadow-violet-600/20 transition-all duration-200"
              >
                Get Started Free
              </a>
              <a
                href="/dashboard?demo=true"
                className="inline-flex items-center justify-center h-14 px-10 text-lg font-medium rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all duration-200"
              >
                Try the Demo
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
