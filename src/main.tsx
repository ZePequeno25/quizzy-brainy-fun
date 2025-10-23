import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './firebase.ts'; // Import to initialize Firebase

createRoot(document.getElementById("root")!).render(<App />);
