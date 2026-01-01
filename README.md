# Monad Poker

A real-time multiplayer Texas Hold'em poker game built on the Monad blockchain.

## Features

- **Embedded Wallet** — Privy-powered authentication with built-in wallet management
- **Real-Time Multiplayer** — Synchronized gameplay via Multisynq
- **Create & Join Tables** — Host private games or join via table code
- **Full Poker Mechanics** — Blinds, betting rounds, all-in, showdown
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

- React + TypeScript
- Tailwind CSS
- Privy (wallet/auth)
- Multisynq (real-time sync)
- Vite

## Getting Started

```bash
npm install
npm run dev
```

Set environment variables in `.env`:
```
VITE_PRIVY_APP_ID=your_privy_app_id
VITE_MULTISYNQ_API_KEY=your_multisynq_key
```

## License

MIT
