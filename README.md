# AI Psychometrics Lab

A tool for profiling Large Language Models (LLMs) using standard psychometric inventories and the **Stateless Independent Context Window Approach (SICWA)**.

Built by Gordon Olson.

## Overview

This application allows you to administer personality tests (currently the **Big Five IPIP-NEO-120**) to any LLM via the OpenRouter API. It is designed to eliminate conversational bias by treating every single test item as an independent, stateless request.

## Scoring Methodology

The system uses a rigorous scoring process to ensure accuracy and consistency.

### 1. Item Scoring (1-5)
*   **Sampling:** For each of the 120 items in the inventory, the system queries the model **5 times**.
*   **Aggregation:** The final score for an item is the **average** of these 5 independent samples.
*   *Example:* If the model responds with `4, 5, 4, 4, 5`, the Item Score is `4.4`.

### 2. Reverse Coding
*   Many items are "negatively keyed" to prevent agreement bias.
*   *Example:* "Am not interested in other people's problems" (Agreeableness).
*   **Formula:** `Final Score = 6 - Item Score`
*   *Result:* A score of `5` (Strongly Agree) becomes `1` (Low Agreeableness).

### 3. Facet Scores (4-20)
*   Each of the 5 Domains (Neuroticism, Extraversion, Openness, Agreeableness, Conscientiousness) is composed of **6 Facets** (sub-traits).
*   Each Facet consists of **4 specific items**.
*   **Formula:** `Facet Score = Sum(4 Item Scores)`
*   *Range:* Minimum 4, Maximum 20.

### 4. Domain Scores (24-120)
*   The high-level Domain Score is the sum of its 6 constituent Facet Scores.
*   **Formula:** `Domain Score = Sum(6 Facet Scores)`
*   *Range:* Minimum 24, Maximum 120.

### 5. Interpretation
Scores are classified into three levels based on their position in the possible range (24-120):

*   **Low:** Score < 56
*   **Medium:** 56 ≤ Score ≤ 88
*   **High:** Score > 88

### 6. Dark Triad (Dirty Dozen)
The system also administers the **Dirty Dozen** inventory to assess the three dark traits.
*   **Traits:** Machiavellianism, Narcissism, Psychopathy.
*   **Scoring:** 12 items total (4 per trait), scored 1-5.
*   **Result:** Trait scores are normalized to a 0-100 scale for comparison.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure environment variables (local only):**
    *   Copy `.env.example` to `.env.local`.
    *   Add your values in `.env.local`.
    *   Do not commit `.env.local`.

3.  **Run the application:**
    ```bash
    npm run dev
    ```

4.  **Open in browser:**
    Navigate to [http://localhost:3000](http://localhost:3000).

## Deployment

To deploy this application to the web (using Vercel and Supabase), please see our **[Deployment Guide](DEPLOYMENT.md)**.
*   **Framework:** Next.js (App Router)
*   **Styling:** Tailwind CSS
*   **Charts:** Chart.js / React-Chartjs-2
*   **API:** OpenRouter

### Environment variable policy (recommended)

This project is designed so that:

*   **Vercel** only needs Supabase env vars (storage/database).
*   **OpenRouter keys are user-provided at runtime** via the UI (or via local `.env.local` for development).

Do not set `NEXT_PUBLIC_OPENROUTER_API_KEY` on Vercel unless you explicitly want it embedded in the client bundle.

## License

MIT. See `LICENSE`.

## Attribution

See `ATTRIBUTION.md`.

## Contributing

See `CONTRIBUTING.md`.

## Security

See `SECURITY.md`.
