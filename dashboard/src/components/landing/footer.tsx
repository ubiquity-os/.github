import { Hexagon } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-zinc-800/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-7 h-7 rounded-md bg-violet-600">
              <Hexagon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm text-zinc-500">
              UbiquityOS Sprint Manager
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-zinc-500">
            <a
              href="https://github.com/ubiquity-os"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              GitHub
            </a>
            <a
              href="https://github.com/ubiquity-os/.github/issues/14"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-300 transition-colors"
            >
              Bounty Spec
            </a>
            <span className="text-zinc-700">|</span>
            <span>Built with UbiquityOS</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
