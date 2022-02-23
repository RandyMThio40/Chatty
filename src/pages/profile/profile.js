import React,{ useState, useEffect, useRef,useCallback } from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import { useNavigate } from 'react-router-dom';
import { uploadBytes, ref as storageRef, getDownloadURL } from '@firebase/storage';
import { storage } from '../../firebase';
import './profile.css';

export const Profile = () => {
    const { currentUser, signout,setInactiveUser, updatePhotoURL, updateDisplayName } = UseAuth();
    const [name,setName] = useState("");
    const [file,setFIle] = useState();
    const [picture,setPicture] = useState();
    const [loading,setLoading] = useState(true);
    const [visible,setVisible] = useState(false);
    const inref = useRef();
    const [error,setError] = useState(false);
    const navigate = useNavigate();

    const handleIMGSubmit = async (e) => {
        e.preventDefault();
        
        const metadata = {
            contentType: file.type,
        };
        const url = await uploadBytes(storageRef(storage,`${currentUser.uid}/ProfilePics/userImage`),file,metadata)
        .then(()=>getDownloadURL(storageRef(storage,`${currentUser.uid}/ProfilePics/userImage`)));
        updatePhotoURL(currentUser,url);
        // updateDisplayName(currentUser,name)
        setPicture(url)
    }

    const handleMakeInvisible = () => {
        setVisible(false);
        setName("")
    }
    const handleNameSubmit = (e) => {
        e.preventDefault();
        updateDisplayName(currentUser,name);
        handleMakeInvisible();
    }

    const handleImageChange  = (e) => {
        e.target.files[0] && setFIle(e.target.files[0]);
        setPicture(window.URL.createObjectURL(e.target.files[0]));
    }

    const handleValue = useCallback(() => {
        setPicture(currentUser.photoURL);
        setLoading(false);
    },[currentUser])
    const handleFileInput = () => {
        inref.current.click();
    }

    const handleSignOut = () => {
        setInactiveUser();
        signout().then(()=>navigate("/",{replace: true}))
    }

    const handleMakeVisible = () => {
        setVisible(true);
    }

    
    useEffect(()=>{
        handleValue();
        return handleValue();
    },[handleValue])

    if(loading) return(<></>);

    return(
        <section className="profile-container">
            {
                (visible)
                ?  <div className="modal">
                        <form  onSubmit={handleNameSubmit}>
                            <h3>Enter Name</h3>
                            <div>
                                <label className={`${name ? `active` : ``}`}>Name</label>
                                <input type="text" onChange={(e)=>setName(e.target.value)} value={name} required/>
                            </div>
                            <p id="error-message" style={error ? {} : {display:"none"}}>
                                * can't be blank.
                            </p>
                            <div className='butt-cont'>
                                <button type="button" accessKey='c' onClick={handleMakeInvisible}>cancel</button>
                                <input type="submit" value="Submit" accessKey='s'/>
                            </div>
                        </form>
                    </div>
                : <></>
            }
            <h1>Profile page</h1>
            <div className="profile-wrapper">
                <div className="profile-input-container">
                    <button className="change-name-button" onClick={handleMakeVisible}>Change Name</button>
                    <form className='profile-form' onSubmit={handleIMGSubmit}>
                        <div>
                            <input ref={inref} id="file-input" type="file" accept="image/*"  onChange={handleImageChange} hidden />
                            <button type="button" onClick={handleFileInput}>Choose file</button>
                        </div>
                        <input type="submit" value="Change"/>
                    </form>
                    <button className='signout' onClick={handleSignOut}>Sign out</button>
                </div>
               
                <div>
                    <h2>Preview:</h2>
                    <img id="profile-image-preview" src={picture} alt="img from db"/>
                </div>
            </div>
            
        </section>
    )

}