import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "AI Psychometrics Lab",
    description: "Stateless Independent Context Window Approach",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.className} min-h-screen flex flex-col`}>
                {/* Global Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
                            <img
                                src="/globe.svg"
                                alt="AI Psychometrics"
                                className="h-10 w-auto"
                            />
                            <span className="font-bold text-gray-900 text-lg hidden sm:block group-hover:text-indigo-600 transition-colors">
                                AI Psychometrics Lab
                            </span>
                        </a>
                        <div className="flex items-center gap-6">
                            <a href="/about" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                                About
                            </a>
                            <a href="/explorer" className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors">
                                Explorer
                            </a>
                        </div>
                        {/* Optional Global Nav Links could go here */}
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </body>
        </html>
    );
}
