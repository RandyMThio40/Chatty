import './App.css';
import {Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AuthProvider } from './utility/useContextAuth.js';
import ProtectedRoute from './utility/protectedRoute';
import Home from './pages/home/home.js';
import SignUp from "./pages/sign-up/SignUp.js";
import { NotFound } from './pages/notFound/NotFound';
import Login from './pages/login/Login';
import { Nav } from './navigation/nav';
import { Profile } from './pages/profile/profile';

function App() {

  return (
    <div className="App">
      
      <AuthProvider>
      <Router>
        <Routes>
            <Route exact path="/" element={<SignUp/>}/>
            <Route path="Login" element={<Login/>}/>
            <Route path="/:id/Home" element={
              <ProtectedRoute>
                <Nav/>
                <Home/>
              </ProtectedRoute>
            }/>
            <Route path="/:id/Profile" element={
              <ProtectedRoute>
                <Profile/>
              </ProtectedRoute>
            }/>
            <Route path="*"element={<NotFound/>} />
        </Routes>
      </Router>
      </AuthProvider>
    </div>
     

  );
}

export default App;
