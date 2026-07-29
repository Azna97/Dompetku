@echo off
echo Installing backend dependencies...
cd backend
npm init -y
npm install express sqlite3 cors body-parser dotenv
cd ..

echo Installing frontend dependencies...
cd frontend
npm init -y
npm install vite @vitejs/plugin-react
npm install react react-dom react-router-dom axios recharts date-fns
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

echo Installing root dependencies...
npm install concurrently

echo Done! Run 'npm run dev' to start the application.
pause