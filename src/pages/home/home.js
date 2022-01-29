import React from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';

export const Home = () => {
    const { currentUser } = UseAuth();

    const handleClick = () => {
        const text = document.querySelector(".asd");
        navigator.clipboard.writeText(text.value).then(()=>{
            alert(`copied the text: ${text.value}` )
        })
        console.log("copy was " + text.value)

    }
 
    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.displayName}</h3>
            <button onClick={handleClick} >copy</button>
            <textarea className='asd' defaultValue={"qwyetgqheiqweo"}/>
        </section>
    );
}

export default Home;