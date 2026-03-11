import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL('https://aipsychometricslab.com'),
    title: "AI Psychometrics Lab",
    description: "Stateless Independent Context Window Approach",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className} min-h-screen flex flex-col`}>
                {/* Global Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                    <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:h-16 flex flex-wrap items-center justify-between gap-y-2">
                        <Link href="/" className="min-h-[44px] inline-flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group min-w-0 pr-2">
                            <Image
                                src="/logo.png"
                                alt="AI Psychometrics"
                                width={160}
                                height={40}
                                className="h-8 sm:h-10 w-auto"
                                priority
                            />
                            <span className="font-bold text-gray-900 text-base sm:text-lg hidden md:block group-hover:text-indigo-600 transition-colors truncate">
                                AI Psychometrics Lab
                            </span>
                        </Link>
                        <div className="flex items-center gap-1 sm:gap-4">
                            <Link href="/about" className="inline-flex items-center min-h-[44px] text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors py-2 px-2">
                                About
                            </Link>
                            <Link href="/explorer" className="inline-flex items-center min-h-[44px] text-xs sm:text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors py-2 px-2">
                                Explorer
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="flex-1">
                    {children}
                </main>
            </body>
        </html>
    );
}
