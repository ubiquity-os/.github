"use client";

import { useState } from "react";

/* ------------------------------------------------------------------ */
/* Task Import — Import tasks from GitHub org repos                   */
/* ------------------------------------------------------------------ */

interface TaskImportProps {
  onImport: (org: string, token: string) => Promise<void>;
  syncing: boolean;
  taskCount: number;
}

export default function TaskImport({ onImport, syncing, taskCount }: TaskImportProps) {
  const [org, setOrg] = useState("");
  const [token, setToken] = useState("");
  const [source, setSource] = useState<"github" | "asana">("github");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org.trim() || !token.trim()) return;
    await onImport(org.trim(), token.trim());
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Import Tasks</h2>

      {/* Source toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-700">
        <button
          onClick={() => setSource("github")}
          className={`flex-1 py-2 text-xs font-medium transition ${
            source === "github" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          GitHub Org
        </button>
        <button
          onClick={() => setSource("asana")}
          className={`flex-1 py-2 text-xs font-medium transition ${
            source === "asana" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Asana
        </button>
      </div>

      {source === "github" ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Organization</label>
            <input
              type="text"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="e.g. ubiquity-os"
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">GitHub Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder:text-gray-600"
            />
          </div>
          <button
            type="submit"
            disabled={syncing || !org.trim() || !token.trim()}
            className="w-full py-2.5 text-sm font-medium rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 transition"
          >
            {syncing ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Syncing...
              </span>
            ) : (
              "Sync Repos & Issues"
            )}
          </button>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-700 p-6 text-center">
          <span className="text-2xl">📋</span>
          <p className="text-sm text-gray-500 mt-2">Asana integration coming soon</p>
          <p className="text-xs text-gray-600 mt-1">
            Import tasks from Asana projects via API
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="rounded-xl bg-gray-900/50 border border-gray-800 p-3 text-center">
        <div className="text-2xl font-bold text-brand-400">{taskCount}</div>
        <div className="text-xs text-gray-500">tasks imported</div>
      </div>

      {/* Help text */}
      <p className="text-[11px] text-gray-600 leading-relaxed">
        Enter a GitHub organization name and a personal access token with repo read access.
        We&apos;ll scan all repos and import open issues as sprint tasks.
      </p>
    </div>
  );
}
