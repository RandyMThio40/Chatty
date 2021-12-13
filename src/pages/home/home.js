import React,{ useState, useEffect } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';
import { useNavigate } from 'react-router';
import { onValue, ref, } from '@firebase/database';
import { uploadBytes, ref as storageRef, getDownloadURL } from '@firebase/storage';
import { database, storage } from '../../firebase';

export const Home = () => {
    const { currentUser, signout,wdb } = UseAuth();
    const [message,setMessage] = useState("");
    const [head,setHead] = useState("");
    const [file,setFIle] = useState();
    const [picture,setPicture] = useState();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const metadata = {
            contentType: file.type,
        };

        const url = await uploadBytes(storageRef(storage,`ProfilePics/file-${file.name}`),file,metadata)
        .then(()=>getDownloadURL(storageRef(storage,`ProfilePics/file-${file.name}`)))
        wdb(currentUser.uid,message, url);
    }

    const handleValue = () => {
        const db_ref = ref(database, 'Users');
        onValue(db_ref,(snapshot)=>{
            const data = snapshot.val();
            if(!data[currentUser.uid] && !data[currentUser.uid]?.message && !data[currentUser.uid]?.img_url) return
            console.log("message: ",data[currentUser.uid]["message"], " picture_blob: ", data[currentUser.uid]["img_url"]);
            setHead(data[currentUser.uid]["message"]);
            setPicture(data[currentUser.uid]["img_url"]);
        })
    }
    
    useEffect(handleValue,[currentUser.uid])
    useEffect(()=>{
        return ()=>{
            console.log("unmount");
            setHead();
            setPicture();
        }
    },[])


    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.email}</h3>
            <button onClick={()=>{
                signout().then(()=>navigate("/",{replace: true}))
            }}>
            sign out</button>
            <hr/>
            <h2>message: {head} </h2>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>message: </label>
                    <input type="text" placeholder="enter message..." onChange={(e)=>setMessage(e.target.value)} value={message} />
                    <input type="file" accept="image/*" onChange={(e)=>{
                        console.log("file.name: ", e.target.files[0].name, " filetype: ",e.target.files[0].type)
                        e.target.files[0] && setFIle(e.target.files[0])
                    }}/>
                </div>
                <input type="submit" value="send"/>
            </form>
            <div id="test">
                    <img src={picture} alt="img from db"/>
            </div>
        </section>
    );
}

export default Home;