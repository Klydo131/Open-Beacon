# Security

Open Beacon is designed as a single-device educational application with
fictional sample data.

## Security model

- No backend, account service, analytics, or remote data store is included.
- Role selection is a demonstration interface, not identity verification.
- Browser-stored data is bounded and validated before use.
- Imported local backups pass through the same validation boundary.
- Notes, messages, and support requests remain on the current device.
- Community sharing is optional and removes the sample person's name.
- Mini Orbit synthesizes audio locally without network or microphone access.
- The offline worker handles only same-origin navigation and public assets.
- Production output is static and does not require server-side secrets.
- The included development command binds to the current device only.

Do not place confidential, personal, pastoral, financial, health, or credential
data in this application.

## Reporting a vulnerability

Please use the repository host's private vulnerability reporting feature or
contact the maintainers through an established private channel. Do not publish
unresolved vulnerability details in a public issue.

Include the affected version, reproduction steps, impact, and any suggested
mitigation. Avoid including real personal data or secrets in the report.

## Deployment responsibility

Static hosting configuration, transport security, browser security headers, and
domain controls belong to the deployer. A multi-user adaptation requires
server-side authentication and authorization before it can protect real data.
