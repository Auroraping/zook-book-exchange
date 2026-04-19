import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

// 引入所有真实业务体系下的页面组件
import Home from './pages/Home';
import Login from './pages/Login';
import SearchBooks from './pages/SearchBooks';
import BookDetail from './pages/BookDetail';
import Publish from './pages/Publish';
import Messages from './pages/Messages';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import Schedule from './pages/Schedule';
import AIAnalysis from './pages/AIAnalysis';
import Community from './pages/Community';
import Achievements from './pages/Achievements';
import Evaluate from './pages/Evaluate';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* React Router 页面挂载主线 */}
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
        <Route path="books" element={<SearchBooks />} />
        <Route path="book/:id" element={<BookDetail />} />
        <Route path="publish" element={<Publish />} />
        <Route path="messages" element={<Messages />} />
        <Route path="orders" element={<Orders />} />
        <Route path="evaluate/:id" element={<Evaluate />} />
        <Route path="profile" element={<Profile />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="ai-analysis" element={<AIAnalysis />} />
        <Route path="community" element={<Community />} />
        <Route path="achievements" element={<Achievements />} />
      </Route>
    </Routes>
  );
}

export default App;
