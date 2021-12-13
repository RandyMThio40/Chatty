import React,{useContext, useState, useEffect} from 'react';
import {auth,createUser,signOutUser, signInUser, database} from '../firebase.js';
import { ref,get, child, set } from "firebase/database";



const AuthContext = React.createContext();

export function UseAuth(){
    return useContext(AuthContext);
}

export function AuthProvider({children}){
    const [currentUser,setCurrentUser] = useState();
    const [loading,setLoading] = useState(true);

    const signup = (email, password) => {
        return createUser(email,password);
    }

    const signout = () =>{
        return signOutUser();
    }

    const signin = ( email, password) => {
        return signInUser(email,password);
    }

    const cdb = () => {
        const db_ref = ref(database);
        get(child(db_ref,"Users/")).then((snapshot)=>{
            console.log("cdb: ",snapshot.val());
        }).catch((error)=>{
            console.log(error);
        })

    }

    const wdb = (path, message, img = null) => {
        const db = database;
        set(ref(db, `Users/${path}`),{
            message: message,
            img_url:img
        }).catch((error)=>{
            console.log("wdb.error: ", error);
        })
    }

    
    const value = {
        currentUser,
        signup,
        signout,
        signin,
        wdb
    } 
    
    useEffect(()=>{
        cdb();
        console.log("auth: ", auth, "database: ", database);
        const unsubscribe = auth.onAuthStateChanged(user => {
            console.log("in sub: ", user?.uid);

            setCurrentUser(user)
            setLoading(false);
        })
        return unsubscribe;
    },[])

    return(
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

