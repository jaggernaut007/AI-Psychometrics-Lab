# Security Policy

## Reporting a vulnerability
If you believe you’ve found a security issue, please avoid opening a public issue with exploit details.

Preferred reporting:
- Use GitHub’s private vulnerability reporting (Security Advisories) if enabled for this repository.
- Otherwise, contact the maintainer via their GitHub profile.

## Notes
- Any environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser and should be treated as public.
- Do not embed private API keys in client-side environment variables for production deployments.
