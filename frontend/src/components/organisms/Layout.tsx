import React from 'react';
import {Outlet, NavLink, Link, useLocation} from 'react-router-dom';

interface LayoutProps {
    title?: string
}

export function Layout({title}: LayoutProps) {
    const location = useLocation()
    const isFleetView = location.pathname === '/'

    const navigation = [
        {name: 'Fleet Overview', href: '/'}
    ];

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-900 text-slate-100 font-sans">

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
                {/* Brand Header */}
                <div className="h-16 flex items-center px-6 border-b border-slate-800">
                    <Link to="/"
                          className="flex items-center space-x-2 font-semibold text-lg tracking-wider text-indigo-400">
                        <span className="w-3 h-3 bg-indigo-500 rounded-sm animate-pulse"/>
                        <span>Project RC</span>
                    </Link>
                </div>

                {/* Navigation Links - for now, only necessary on cell view */}
                {!isFleetView && <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({isActive}) =>
                                `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                    isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                }`
                            }
                        >
                            Back to {item.name}
                        </NavLink>
                    ))}
                </nav>}
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Global Top Header */}
                <header
                    className="h-16 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between px-8 z-10">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-sm font-semibold text-slate-400 ">
                            {title ? title : "Project Dashboard"}
                        </h1>
                    </div>
                </header>

                {/* Dynamic Page Target Slot */}
                <main className="flex-1 overflow-y-auto bg-slate-900 p-8">
                    <div className="max-w-[1600px] mx-auto space-y-6">
                        <Outlet/>
                    </div>
                </main>
            </div>
        </div>
    );
};