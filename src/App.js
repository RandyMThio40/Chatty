import './App.css';
import {Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './utility/useContextAuth.js';
import ProtectedRoute from './utility/protectedRoute';
import Home from './pages/home/home.js';
import SignUp ,{AuthLayout} from "./pages/sign-up/SignUp.js";
import { NotFound } from './pages/notFound/NotFound';
import Login from './pages/login/Login';
import { Nav } from './navigation/nav';
import { Profile } from './pages/profile/profile';
import { Users, Search, FriendRequests, Friends } from './pages/searchUsers/searchUsers';
import {ChatLayout,Chat} from './components/Chat/Chat';

function App() {

  return (
    <div className="App">
      <AuthProvider>
      <Router>
        <Routes>
            <Route path="/" element={<AuthLayout/>}>
              <Route index element={<SignUp/>} />
              <Route path="Login" element={<Login/>}/>
            </Route>
            <Route path="/:id" element={<ProtectedRoute><Nav/></ProtectedRoute>}>
                <Route index path="Home" element={ <Home/> }/>
                <Route path="Profile" element={ <Profile/> }/>
                <Route path="Users" element={ <Users/> }>
                  <Route index element={<Search/>}/>
                  <Route path="FriendRequests" element={<FriendRequests/>}/>
                  <Route path="Friends" element={<Friends/>}/>
                </Route>
                <Route path="Chats" element={<ChatLayout/>}>
                  <Route path=":chatID" element={<Chat/>} />
                </Route>
            </Route>
            <Route path="*"element={<NotFound/>} />
        </Routes>
      </Router>
      </AuthProvider>
    </div>
     

  );
}

export default App;
