import React from 'react';
import './ProfilePic.css';

export const ProfilePic = () => {
    return(
        <div className="profile-image-container">
            <img className="profile-image" src={currentUser.photoURL} alt="userImage"/>
        </div>
    );
}

export default ProfilePic;