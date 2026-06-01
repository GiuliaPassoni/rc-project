import React from 'react';
import {Link, useNavigate} from 'react-router-dom';

interface ErrorPageProps {
    title?: string;
    code?: string;
    onRetry?: () => void;
}

export function ErrorPage({
                              title = 'Oopsie! An error has occured.',
                              code,
                              onRetry,
                          }: ErrorPageProps) {
    const navigate = useNavigate();

    const handleRetry = () => {
        if (onRetry) {
            onRetry();
        } else {
            window.location.reload();
        }
    };

    return (
        <div
            className="w-full min-h-[400px] flex items-center justify-center p-6 bg-slate-950 border border-slate-900 rounded-xl shadow-2xl">
            <div className="max-w-md w-full text-center space-y-6">

                {/* Messaging Hierarchy */}
                <div className="space-y-2">
          <span
              className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded bg-red-950/60 border border-red-900/40 text-red-400">
            System Fault: {code ?? "Unknown error"}
          </span>
                    <h3 className="text-lg font-bold text-slate-200 tracking-tight font-sans mt-2">
                        {title}
                    </h3>
                </div>

                {/* Operational Recovery Actions */}
                <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all active:scale-[0.98]"
                    >
                        Refresh
                    </button>

                    <button
                        onClick={() => navigate(-1)}
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                    >
                        Go Back
                    </button>

                    <Link
                        to="/"
                        className="px-4 py-2 text-xs font-semibold rounded-lg border border-transparent text-slate-500 hover:text-slate-400 transition-colors"
                    >
                        Go to Fleet Dashboard
                    </Link>
                </div>

            </div>
        </div>
    );
};