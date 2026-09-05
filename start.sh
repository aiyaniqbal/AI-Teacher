#!/bin/bash
echo ""
echo "  ╔══════════════════════════════════════════╗"
echo "  ║           🧠 EduMind Server               ║"
echo "  ║   AI Teacher, Not Just a Chatbot          ║"
echo "  ╚══════════════════════════════════════════╝"
echo ""
echo "  Starting server on http://localhost:3001"
echo "  Starting client on http://localhost:5173"
echo ""

cd "$(dirname "$0")"
npx concurrently "node server/index.js" "cd client && npm run dev"
