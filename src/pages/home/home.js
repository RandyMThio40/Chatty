import React, { useState } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';
import MakeChatModal from '../../components/makeChatModal/makeChatModal';

export const Home = () => {
    const {uploadToStorage,currentUser } = UseAuth();
    const [file,setFile] = useState();
    const [display,setDisplay] = useState(true);
 
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