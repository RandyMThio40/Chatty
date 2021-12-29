import { onValue } from 'firebase/database';
import React,{ useState, useEffect, useRef} from 'react';
import { UseAuth } from '../utility/useContextAuth';
import { Link, useNavigate, useParams } from 'react-router-dom';
import './nav.css'

export const Nav = () => {
    const {currentUser,signout} = UseAuth();
    const navigate = useNavigate();
    const {id} = useParams();

    const toggleActive = (event) => {
        event.target.classList.toggle("active");
        console.log("click")
    }
    
    const handleSignout = () => {
        signout().then(navigate("/",{replace:true}));
    }


    useEffect(()=>{
        
    },[])

    return(
        <nav className="Nav-bar">
            <h1>Chatty</h1>
            <div className="user-setting" onClick={toggleActive}>
                <div className="profile-image-container"><img className="profile-image" src={currentUser.photoURL} alt="userImage"/></div>
                <div className="username-container"><h3 className="username">{currentUser?.displayName || currentUser?.email}</h3></div>
                <div className="drop-down-menu">
                    <Link to={`/${id}/Profile`}>Profile</Link>
                    
                    <button className="sign-out" onClick={handleSignout}>
                        sign out
                    </button>
                </div>
            </div>
        </nav>
    )
}