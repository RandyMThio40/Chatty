import React, { useState } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';

export const Home = () => {
    const {uploadToStorage,currentUser } = UseAuth();
    const [file,setFile] = useState();




 
    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.displayName}</h3>
        </section>
    );
}

export default Home;