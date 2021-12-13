import React from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import { Link } from 'react-router-dom';

export const NotFound = () => {
    const {currentUser} = UseAuth();
    const section_style ={
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        flexDirection:"column",
        width:"100vw",
        height:"100vh",
        fontSize:"4rem",
        fontWeight:"bold"
    }
    const h1_style ={
        width:"max-content",
    }
    return(
       <section style={section_style} >
           <h1 style={h1_style} >Page Not Found</h1>
           {(currentUser) ? <Link to={`/${currentUser.uid}/Home`}>Return Home</Link> : <Link to="/">Go to Sign Up</Link>}
       </section>
    )
}