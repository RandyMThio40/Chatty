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

    return(
        <nav className="Nav-bar">
            <Link to={`/${currentUser.uid}/home`} >
                <h1>Chatty</h1>
            </Link>
            <div className="user-setting" onClick={toggleActive}>
                <div className="profile-image-container">
                    {
                        (imgUrl || currentUser?.photoURL)
                        ?   <img onLoad={handleComplete} className="profile-image incomplete" src={imgUrl || currentUser?.photoURL} alt="userImage"/>
                        :   <svg className="default-image" viewBox="0 0 168 168" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" clipRule="evenodd" d="M45.7042 128.642C74.225 124.475 93.8625 124.833 122.421 128.787C124.489 129.087 126.379 130.125 127.741 131.71C129.104 133.294 129.847 135.319 129.833 137.408C129.833 139.408 129.146 141.35 127.904 142.867C125.74 145.511 123.523 148.111 121.254 150.667H132.258C132.95 149.842 133.646 149 134.35 148.146C136.822 145.115 138.17 141.323 138.167 137.412C138.167 128.975 132.008 121.704 123.563 120.537C94.3292 116.492 73.8959 116.104 44.5 120.4C35.9667 121.646 29.8334 129.029 29.8334 137.525C29.8334 141.296 31.0625 145.025 33.3917 148.046C34.0792 148.937 34.7584 149.812 35.4334 150.671H46.1709C44.0601 148.144 42.0014 145.574 39.9959 142.962C38.8041 141.399 38.1611 139.487 38.1667 137.521C38.1667 133.033 41.3917 129.271 45.7042 128.642ZM84 88.1667C87.2831 88.1667 90.534 87.52 93.5671 86.2636C96.6003 85.0073 99.3563 83.1658 101.678 80.8443C103.999 78.5229 105.841 75.7669 107.097 72.7337C108.353 69.7006 109 66.4497 109 63.1666C109 59.8836 108.353 56.6327 107.097 53.5996C105.841 50.5664 103.999 47.8104 101.678 45.489C99.3563 43.1675 96.6003 41.326 93.5671 40.0697C90.534 38.8133 87.2831 38.1666 84 38.1666C77.3696 38.1666 71.0108 40.8006 66.3224 45.489C61.634 50.1774 59 56.5362 59 63.1666C59 69.7971 61.634 76.1559 66.3224 80.8443C71.0108 85.5327 77.3696 88.1667 84 88.1667V88.1667ZM84 96.5C92.8406 96.5 101.319 92.9881 107.57 86.7369C113.821 80.4857 117.333 72.0072 117.333 63.1666C117.333 54.3261 113.821 45.8476 107.57 39.5964C101.319 33.3452 92.8406 29.8333 84 29.8333C75.1595 29.8333 66.681 33.3452 60.4298 39.5964C54.1786 45.8476 50.6667 54.3261 50.6667 63.1666C50.6667 72.0072 54.1786 80.4857 60.4298 86.7369C66.681 92.9881 75.1595 96.5 84 96.5V96.5Z" fill="#131525"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M84 159C125.421 159 159 125.421 159 84C159 42.5792 125.421 8.99999 84 8.99999C42.5792 8.99999 9.00002 42.5792 9.00002 84C9.00002 125.421 42.5792 159 84 159ZM84 167.333C130.025 167.333 167.333 130.025 167.333 84C167.333 37.975 130.025 0.666656 84 0.666656C37.975 0.666656 0.666687 37.975 0.666687 84C0.666687 130.025 37.975 167.333 84 167.333Z" fill="#131525"/>
                            </svg>
                    }
                </div>
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