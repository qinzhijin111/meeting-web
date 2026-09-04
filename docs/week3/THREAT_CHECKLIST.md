
# Week 3 Room Access Threat Checklist

## Authentication

- [x] Joining a room requires an authenticated Supabase user.
- [x] Authentication is verified again by the server-side Join API.
- [x] Client-side UI is not the final authority for user identity.

## Room Password

- [x] Room passwords are never stored in plain text.
- [x] Passwords are hashed with bcrypt before database storage.
- [x] Join requests use `bcrypt.compare()` on the server.
- [x] Password hashes are never returned to the browser.
- [x] Room passwords are not included in shareable URLs.
- [x] Wrong passwords return a generic access error.

## Room Access

- [x] The server confirms that the requested room exists.
- [x] The server checks room status before issuing credentials.
- [x] Ended or inactive rooms cannot issue a join token.
- [x] Human capacity is checked before issuing a token.
- [x] A sixth distinct human participant is rejected.

## Participant Identity

- [x] Human participant identities are tied to the authenticated user and room.
- [x] Duplicate browser tabs for the same authenticated user use the same participant identity.
- [x] Human participants can be distinguished from future agent participants.

## LiveKit Tokens

- [x] LiveKit access tokens are generated only by server-side code.
- [x] LiveKit API secrets never appear in client code.
- [x] Tokens are short-lived.
- [x] Tokens are scoped to one LiveKit room.
- [x] Tokens are associated with one participant identity.
- [x] Tokens are not written to application logs.

## Supabase Secrets

- [x] Supabase secret/service-role credentials are server-only.
- [x] Secret credentials do not use the `NEXT_PUBLIC_` prefix.
- [x] `.env.local` is excluded from Git.

## Browser and Logging

- [x] Plain-text room passwords do not appear in API responses.
- [x] Password hashes do not appear in API responses.
- [x] Passwords and hashes do not appear in browser console logs.
- [x] Passwords and hashes do not appear in server logs.

## Known Limitation

The current human-capacity check reads active LiveKit participants before issuing a token. Concurrent join requests may create a race condition if multiple users request the final available slot at exactly the same time.

A future implementation can strengthen this using persistent room membership records and transactional capacity reservations.
