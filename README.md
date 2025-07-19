# NFT TON Miniapp

A modern Next.js application for interacting with NFT collections on the TON blockchain. This project features wallet connection, NFT management, and seamless integration with TON Connect UI.

## 🚀 Features

- Connect to TON wallets using @tonconnect/ui-react
- Download NFT data as ZIP files (jszip, file-saver)
- Modern React/Next.js 15+ architecture
- Ready for deployment on Vercel

## 🛠️ Tech Stack

- [Next.js](https://nextjs.org/) 15+
- [React](https://react.dev/)
- [@tonconnect/ui-react](https://github.com/ton-connect/ui)
- [jszip](https://stuk.github.io/jszip/)
- [file-saver](https://github.com/eligrey/FileSaver.js)

## 📦 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nft-ton-miniapp.git
cd nft-ton-miniapp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the app.

### 4. Build for production

```bash
npm run build
npm start
```

## 🌐 Deployment (Vercel)

1. Push your code to GitHub, GitLab, or Bitbucket.
2. Go to [Vercel](https://vercel.com/) and import your repository.
3. Vercel auto-detects Next.js. Click **Deploy**.
4. Add any required environment variables in the Vercel dashboard.
5. Your app will be live at `https://your-app-name.vercel.app`.

## ⚙️ Environment Variables

If your app requires secrets or API keys, add them in Vercel’s dashboard under Project Settings → Environment Variables.

## 📁 Project Structure

```
NFT_TON_miniapp/
├── public/                # Static assets
├── src/app/               # Main app code (pages, providers, contracts)
├── package.json           # Project metadata and dependencies
├── README.md              # This file
└── ...
```

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

MIT
