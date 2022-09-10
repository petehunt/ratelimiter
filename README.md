# ratelimiter.io

<a href='https://ko-fi.com/T6T5EYYCS' target='_blank'><img height='36' style='border:0px;height:36px;' src='https://cdn.ko-fi.com/cdn/kofi5.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

[ratelimiter.io](https://ratelimiter.io) is the easiest way to add basic ratelimiting to your app.

It's offered as both an MIT-licensed open-source project and a free hosted service that does not require any registration. It costs me money to run the hosted service, so if you find it valuable, I encourage you to [throw me a few bucks](https://ko-fi.com/T6T5EYYCS).

## Getting started

### Node.js

First, install the client library.

```sh
npm install ratelimiter.io
```

Next, call it.

```typescript
import { throwIfRateLimited } from "ratelimiter.io";

// use callRatelimit() if you want access to the API response
await throwIfRateLimited({
  // string corresponding to your app. ideally, this would be a long, unique string, like a uuid
  appId: "my_cool_app",
  // name of the event you want to limit
  eventName: "account_created",
  // how many events are allowed
  quota: 60,
  // in what time window
  timeWindowSeconds: 60,
  // strings identifying the entities (user id, email, phone etc) associated with the user
  // the client library computes a salt based on the appId and hashes these entities
  entities: ["uid=1234", "email=foo@bar.com", "ip=1.2.3.4"],
});
```

### Other platforms

Just do a simple HTTP request:

```sh
curl -XPOST https://ratelimiter.io/api/ratelimit \
  -H 'Content-type: application/json' \
  -d '{"quota": 60, "time_window_seconds": 60, "app_id": "my_cool_app", "event_name": "message_sent", "entities": ["email_hash", "ip_hash", "user123"]}'

{
  "ok": true,
  "entities": {
    "email_hash": {"remaining": 59, "total": 1, "reset": 124123515},
    "ip_hash": {"remaining": 59, "total": 1, "reset": 124123515},
    "user123": {"remaining": 59, "total": 1, "reset": 124123515},
  }
}
```

The endpoint takes the following parameters:

- **quota**: the number of events in the time window you want to allow
- **time_window_ms**: the size of the time window in seconds
- **app_id**: a string that's unique to your app. This is effectively a namespace and ensures that your rate limits don't collide with those of other apps. Generate one by running `node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))'` or `openssl rand 32 -hex`
- **event_name**: the event you want to rate limit. For example, `logged_in`, `account_created`, `message_sent` etc.
- **entities**: a list of strings representing the user doing the action. This is usually email addresses, IP addreses, phone numbers, ISP names, etc. Ideally you would salt and hash these before sending them to use because we don't want your personal data.

## What do we do with the data?

We salt and hash the `entities` you send us (in case you forgot to - thought it's still better if you do it). And we delete them when it's no longer needed.

## Where is the data stored?

On a Redis box in Digital Ocean NYC.

## Are there any SLAs?

No. If you would like one, [reach out on Twitter for a commercial license](https://twitter.com/floydophone) or run your own instance.

## Acknowledgements

This is basically a very API wrapper around [async-ratelimiter](https://github.com/microlinkhq/async-ratelimiter) that I'm hosting for others.
