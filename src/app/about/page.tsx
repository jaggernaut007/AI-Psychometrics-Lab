import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h1 className="text-4xl font-extrabold text-gray-900 mb-6">About the Lab</h1>

                <div className="prose prose-lg text-gray-600">
                    <p className="lead text-xl text-indigo-900 font-medium mb-8">
                        The AI Psychometrics Lab is dedicated to mapping the psychological landscape of Large Language Models.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Our Mission</h2>
                    <p>
                        As Artificial Intelligence becomes increasingly integrated into our digital lives, understanding the inherent "personality" of these models is no longer just an academic curiosity—it is a necessity for safety, alignment, and utility.
                    </p>
                    <p className="mt-4">
                        Our goal is to treat AI models not just as calculators, but as subjects. By administering standard human psychometric inventories, we aim to uncover the biases, tendencies, and alignment patterns that emerge from their training data.
                    </p>

                    <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Methodology: SICWA</h2>
                    <p>
                        We utilize the <strong>Stateless Independent Context Window Approach (SICWA)</strong>.
                        Unlike traditional human testing where memory plays a role, our tests are administered to the models in a stateless environment.
                    </p>
                    <ul className="list-disc pl-5 space-y-2 mt-4">
                        <li><strong>Isolation:</strong> Each question is presented in a fresh context window to prevent previous answers from influencing current ones.</li>
                        <li><strong>Repetition:</strong> We run multiple iterations (typically 5-10 runs) to account for the model's non-deterministic nature (temperature &gt; 0).</li>
                        <li><strong>Standardization:</strong> We use widely recognized inventories including the Big Five (IPIP), MBTI (Jungian Type), and DISC.</li>
                    </ul>

                    <h2 className="text-2xl font-bold text-gray-800 mb-4 mt-8">Why it Matters</h2>
                    <p>
                        Knowing whether a model leans towards high <em>Neuroticism</em> or low <em>Agreeableness</em> can determine its suitability for customer service. Understanding its <em>Political Compass</em> helps in strict neutrality applications. Our lab provides the transparency needed to make these decisions.
                    </p>

                    <div className="mt-12 pt-8 border-t border-gray-100 flex gap-4">
                        <Link href="/" className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition">
                            Run a Test
                        </Link>
                        <Link href="/explorer" className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-50 transition">
                            View Leaderboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
