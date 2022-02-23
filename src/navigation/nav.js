import React, { useEffect, useState } from 'react';
import { UseAuth } from '../utility/useContextAuth';
import { Link, useNavigate } from 'react-router-dom';
import './nav.css'


export const Nav = () => {
    const [displayName,setDisplayName] = useState("");
    const [imgUrl,setImgUrl] = useState("");
    const {currentUser,signout,setInactiveUser,observeValue} = UseAuth();
    const navigate = useNavigate();

    const toggleActive = (event) => {
        event.target.classList.toggle("active");
        console.log("click")
    }
    
    const handleSignout = () => {
        setInactiveUser();
        signout().then(navigate("/",{replace:true}));
    }

    const handleComplete = (e) => {
        let img = e.target;
        if(img.complete){
            img.classList.remove("incomplete");
        }
    }

    useEffect(()=>{
        const base = `/Users/${currentUser.uid}/profile`
        observeValue(`${base}/name`,setDisplayName);
        observeValue(`${base}/img_url`,setImgUrl)
    },[])

    useEffect(()=>{
        console.log(displayName,imgUrl);
    },[displayName,imgUrl])

    return(
        <nav className="Nav-bar">
            <Link to={`/${currentUser.uid}/home`} >
                <h1>Chatty</h1>
            </Link>
            <div className="user-setting" onClick={toggleActive}>
                <div className="profile-image-container"><img onLoad={handleComplete} className="profile-image incomplete" src={imgUrl || currentUser?.photoURL} alt="userImage"/></div>
                <div className="username-container"><h3 className="username">{displayName || currentUser?.displayName || currentUser?.email}</h3></div>
                <div className="drop-down-menu">
                    <Link to={`Profile`}>Profile</Link>
                    <Link to={`Users`}>Search Users</Link>
                    <Link to="Chats/">Chats</Link>
                    
                    <button className="sign-out" onClick={handleSignout}>
                        sign out
                    </button>
                </div>
            </div>
        </nav>
    )
}