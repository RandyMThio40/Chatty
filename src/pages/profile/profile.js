import React,{ useState, useEffect, useRef } from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import { useNavigate } from 'react-router-dom';
import { ref } from '@firebase/database';
import { uploadBytes, ref as storageRef, getDownloadURL } from '@firebase/storage';
import { database, storage } from '../../firebase';
import './profile.css';

export const Profile = () => {
    const { currentUser, signout,wdb, updatePhotoURL, updateDisplayName } = UseAuth();
    const [name,setName] = useState("");
    const [file,setFIle] = useState();
    const [picture,setPicture] = useState();
    const [loading,setLoading] = useState(true);
    const inref = useRef();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const metadata = {
            contentType: file.type,
        };
        const url = await uploadBytes(storageRef(storage,`${currentUser.uid}/ProfilePics/userImage`),file,metadata)
        .then(()=>getDownloadURL(storageRef(storage,`${currentUser.uid}/ProfilePics/userImage`)));
        wdb(currentUser.uid,currentUser.displayName,url);
        updatePhotoURL(currentUser,url);
        updateDisplayName(currentUser,name)
        setPicture(url)
    }

    const handleImageChange  = (e) => {
        e.target.files[0] && setFIle(e.target.files[0]);
        setPicture(window.URL.createObjectURL(e.target.files[0]));

        
    }

    const handleValue = () => {
        setPicture(currentUser.photoURL);
        setLoading(false);
    }
    const handleFileInput = () => {
        inref.current.click();
    }

    
    useEffect(()=>{

        handleValue();
        return handleValue;
    },[])

    if(loading) return(<></>);

    return(
        <section className="profile-container">
            <span className="backbutton" onClick={()=>navigate(-1)}> Go Back </span>
            <h1>Profile page</h1>
            <div className="profile-wrapper">
                <div className="profile-input-container">
                    <form onSubmit={handleSubmit}>
                        <div>
                            <label>name: </label>
                            <input type="text" placeholder="enter name" onChange={(e)=>setName(e.target.value)} value={name} />
                            <br/>
                            <div>
                                <input ref={inref} id="file-input" type="file" accept="image/*"  onChange={handleImageChange}/>
                                <button type="button" onClick={handleFileInput}>choose file</button>
                            </div>
                        </div>
                        <input type="submit" value="send"/>

                    </form>
                        <button onClick={()=>{
                            signout().then(()=>navigate("/",{replace: true}))
                        }}>
                        sign out</button>
                </div>
               
                <div>
                    <h2>Preview:</h2>
                    <img id="profile-image-preview" src={picture} alt="img from db"/>
                </div>
            </div>
            
        </section>
    )

}