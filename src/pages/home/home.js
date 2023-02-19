import React, { useEffect, useState, useRef } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';
import MakeChatModal from '../../components/makeChatModal/makeChatModal';
import axios from 'axios';
import { io } from 'socket.io-client';


export const Home = () => {
    const {uploadToStorage,currentUser } = UseAuth();
    const [file,setFile] = useState();
    const [display,setDisplay] = useState(true);
    const socket = useRef();

    useEffect(()=>{
        // socket.current = io("https://marvelously-urban-iguana-burg.wayscript.cloud/",{

        // });
        // socket.current.on("is-connected",(res)=>{
        //     // setConnected(true);
        //     console.log("ressss: ", socket.current.id);
        // })
        const test = async () => {
            try{
                const res = await axios.post("https://marvelously-urban-iguana-burg.wayscript.cloud/findImg",{url:"https://i.ytimg.com/vi/DrAAzSadJZw/maxresdefault.jpg"})
                let blob = new Blob([new Uint8Array(res.data.buffer.data)],{type:"image/png"})
                let img = document.createElement('img');
                img.src = URL.createObjectURL(blob);
                document.querySelector(".Home-container").appendChild(img);
                console.log( "ping server: ",res)
            } catch (err) {
                console.log(err)
            }
        }
        test();
    },[])
 
    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.displayName}</h3>
            <button onClick={()=>setDisplay(true)}>open modal</button>
            {/* {display && <MakeChatModal cb={setDisplay} />} */}
        </section>
    );
}

export default Home;