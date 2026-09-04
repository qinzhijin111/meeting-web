
# Week 3 API Contract

## Join Room API

### Endpoint

```http
POST /api/rooms/:roomId/join
```

`roomId` is the public room ID used in the shareable room URL.

---

## Request

```json
{
  "displayName": "Alice",
  "password": "room-password"
}
```

### Fields

- `displayName`: participant display name
- `password`: room password entered by the user

The password is validated only on the server and is never stored in plain text.

---

## Server Validation

Before issuing a LiveKit token, the server checks:

1. The user is authenticated.
2. The room exists.
3. The room is active.
4. The password is correct.
5. Fewer than five distinct human participants are active.

A sixth human participant is rejected before a token is issued.

---

## Successful Response

```http
200 OK
```

```json
{
  "token": "<short-lived-livekit-token>",
  "serverUrl": "wss://example.livekit.cloud",
  "participantIdentity": "human:<room-id>:<user-id>"
}
```

The token:

- is generated only on the server;
- is short-lived;
- is scoped to one LiveKit room;
- is tied to one authenticated participant identity.

---

## Error Responses

### Invalid Input

```http
400 Bad Request
```

```json
{
  "error": "Display name and room password are required.",
  "code": "INVALID_INPUT"
}
```

### Unauthenticated

```http
401 Unauthorized
```

```json
{
  "error": "You must be signed in to join a room.",
  "code": "UNAUTHENTICATED"
}
```

### Join Denied

Used for invalid password, inactive room, or unavailable room access.

```http
403 Forbidden
```

```json
{
  "error": "Unable to join this room.",
  "code": "JOIN_DENIED"
}
```

### Room Full

```http
409 Conflict
```

```json
{
  "error": "This meeting already has the maximum of five human participants.",
  "code": "ROOM_FULL"
}
```

---

## Security Notes

- Room passwords are stored only as bcrypt hashes.
- The room password is never included in the shareable URL.
- Password hashes are never returned to the browser.
- LiveKit API secrets remain server-only.
- Supabase privileged credentials remain server-only.
- LiveKit tokens are generated only by server code.
- Tokens and password hashes are not written to logs.

---

## Known Limitation

The current human-capacity check uses active LiveKit participant state. Concurrent requests for the final available slot may still create a race condition.
