import React,{ useState, useEffect, useRef } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Chat from '../../components/Chat/Chat';

export const Home = () => {
    const { currentUser, signout } = UseAuth();
    const navigate = useNavigate();
    const socket = useRef();
    const [loading,setLoading] = useState(true);

    useEffect(()=>{
        socket.current = io("http://localhost:5000");
        socket.current.emit("has-connected",{user:currentUser});
        socket.current.on("is-connected",(res)=>{
            setLoading(false);
        })
        socket.current.on("response",(res)=>{
            console.log(res);

        })
        console.log("currrentuser: ", currentUser);
        return ()=>{
            socket.current.disconnect()
        }
    },[])
    
    if(loading) return(
        <>
            <h1>LOADING...</h1>
        </>
    )

    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.displayName}</h3>
            <Chat/>
            
        </section>
    );
}

export default Home;