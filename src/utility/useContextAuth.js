import React,{useContext, useState, useEffect} from 'react';
import {auth,createUser,signOutUser, signInUser, database} from '../firebase.js';
import { ref,get, child, set,query,equalTo, push, onValue, update, orderByChild } from "firebase/database";
import { updateProfile } from 'firebase/auth';
import { uploadBytes,ref as storageRef, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase.js';

const AuthContext = React.createContext();

export function UseAuth(){
    return useContext(AuthContext);
}

export function AuthProvider({children}){
    const [currentUser,setCurrentUser] = useState();
    const [loading,setLoading] = useState(true);
    const [friends,setFriends] = useState();
    const [friendRequests,setFriendRequests] = useState();
 

    const signup = (email, password) => {
        return createUser(email,password);
    }

    const signout = () =>{
        return signOutUser();
    }

    const signin = ( email, password) => {
        return signInUser(email,password);
    }

    const cdb = async() => {
        const db_ref = ref(database);
        return get(child(db_ref,"Users/")).then((snapshot)=>{

            // console.log("cdb: ",snapshot.val());
            return snapshot.val();
        }).catch((error)=>{
            console.log(error);
        })

    }

    const writeDB = (path, data_obj) => {

        set(ref(database, `Users/${path}`),data_obj).catch((error)=>{
            console.log("wdb.error: ", error);
        })
    }
    const setActiveUser = async(uid) =>{
        try{
            set(ref(database,`Users/${uid}/active`),true);
        } catch (err) {
            console.log(err)
        }
    }
    const setInactiveUser = React.useCallback(() =>{
        set(ref(database,`Users/${currentUser.uid}/active`),false);
    },[currentUser])

    const updatePhotoURL = async(current_user,url) =>{
        return updateProfile(current_user,{photoURL:url}).then(()=>{
            set(ref(database, `Users/${current_user.uid}/img_url`),url)
            console.log("updated photoURL ");
        })
        .catch((error)=> {
            console.log(error);
        })
    }

    const updateDisplayName = async( current_user, nickname ) => {

        return updateProfile(current_user,{displayName: nickname }).then(()=>{
            set(ref(database, `Users/${current_user.uid}/name`),nickname)
        })
        .catch((error)=> {
            console.log(error);
        })
    }

    const queryList = async(path) => {
        try{
            let que = query(ref(database,`Users/${path}`));
            return get(que)
        } catch (error){
            console.log(error);
        }
    }

    // const makePrivateChat = (uid,user_uid) => {

    //     const data_key = push(child(ref(database), 'ChatRoom')).key;
    //     const obj1 = {
    //         member:user_uid
    //     }
    //     const obj2 = {
    //         member:uid
    //     }
    //     const updates = {};
    //     updates[`Users/${uid}/chats/${data_key}/private`] = obj1;
    //     updates[`Users/${user_uid}/chats/${data_key}/private`] = obj2;
    //     updates[`ChatRooms/${data_key}/members/${uid}`] = true;
    //     updates[`ChatRooms/${data_key}/members/${user_uid}`] = true;

    //     return update(ref(database,`/`),updates);
    // }

    
    const findChat = async(uid,user_uid) => {
        const que = query(ref(database,`/Users/${uid}/chats`),orderByChild("private/member"),equalTo(user_uid));
        return get(que)?.then(snapshot => {
            if(!snapshot.val()) return null;
            return Object.keys(snapshot.val())[0];
        });
    }


    const pushDB = (path,data) => {
        set(push(ref(database,`Users/${path}`)),data);
    }
 
    const acceptFriendReq = async(uid,user_uid) => {
        const existing_chat = await findChat(uid,user_uid);
        const data_key = push(child(ref(database), 'ChatRoom')).key;
        const obj1 = {
            member:user_uid
        }
        const obj2 = {
            member:uid
        }
        const updates = {};
        
        updates[`Users/${uid}/friends/${user_uid}`] = true;
        updates[`Users/${user_uid}/friends/${uid}`] = true;
        updates[`Users/${uid}/friendRequests/${user_uid}`] = null;

        if(existing_chat) {
            console.log("found existing chat");
            return update(ref(database,`/`),updates);
        }
        const name1 = await get(ref(database,`Users/${uid}/name`));
        const name2 = await get(ref(database,`Users/${user_uid}/name`));

        updates[`Users/${uid}/chats/${data_key}/private`] = obj1;
        updates[`Users/${user_uid}/chats/${data_key}/private`] = obj2;
        updates[`ChatRooms/${data_key}/members/${uid}/name`] = name1.val();
        updates[`ChatRooms/${data_key}/members/${user_uid}/name`] = name2.val();
        
        return update(ref(database,`/`),updates);
    }

    const rejectFriendReq = (uid,user_uid) => {
        const updates = {};
        updates[`${user_uid}/friends/${uid}`] = null;
        updates[`${uid}/friendRequests/${user_uid}`] = null;

        return update(ref(database,`Users/`),updates);
    }

    const removePending = (uid,user_uid) => {
        const updates = {};
        updates[`${uid}/friends/${user_uid}`] = null;
        updates[`${user_uid}/friendRequests/${uid}`] = null;

        return update(ref(database,`Users/`),updates);
    }

    const removeFriend = (uid,user_uid) => {
        const updates = {};
        updates[`${user_uid}/friends/${uid}`] = null;
        updates[`${uid}/friends/${user_uid}`] = null;

        return update(ref(database,`Users/`),updates);
    }

    const fetchUsersData = async(path) => {
        return get(child(ref(database),`Users/${path}`));
    }

    const getConv = async(chat_id) => {
        try{
            const conv = await get(ref(database,`ChatRooms/${chat_id}`))
            const obj = {
                    key: conv.key, 
                    val: conv.val()
            }
            return obj;
            
        } catch (err) {
            console.log(err);
        }
    }

    const sendMessage = (chat_id,data) => {
        try{
            return set(push(ref(database,`ChatRooms/${chat_id}/messages`)),data);
        } catch (err){
            return err;
        }
    }

    const changeBG = async(chatID,file,metaData) => {
        try{
            const updates = {}
            const url = await uploadBytes(storageRef(storage,chatID),file,metaData)
            .then(()=>getDownloadURL(storageRef(storage,chatID)));
            updates[`${chatID}/background_img`] = url;
            update(ref(database,`/ChatRooms`),updates);
        } catch(err){
            console.log(err);
        }

    }  

    const [currentChatBG,setCurrentChatBG] = useState("");
    
    const observeChatBG = (path) => {
        onValue(ref(database,`/ChatRooms/${path}/background_img`),(snapshot)=>{
            setCurrentChatBG(snapshot.val());
        })
    }
    const clearChatBG = ()=> {
        setCurrentChatBG("");
    }

    const handleUnmountChat = (chat_id) => {

    }


    const value = {
        currentUser,
        friends,
        friendRequests,
        currentChatBG,
        signup,
        signout,
        signin,
        writeDB,
        updateDisplayName,
        updatePhotoURL,
        setActiveUser,
        setInactiveUser,
        cdb,
        queryList,
        pushDB,
        fetchUsersData,
        acceptFriendReq,
        rejectFriendReq,
        removeFriend,
        removePending,
        getConv,
        findChat,
        sendMessage,
        changeBG,
        observeChatBG,
        clearChatBG,
    } 
    
    useEffect(()=>{
        const unsubscribe = auth.onAuthStateChanged(user => {
            console.log("in sub: ", user);
            setCurrentUser(user)
            setLoading(false);
        });

        return unsubscribe;
    },[])

    useEffect(()=>{
        console.log("bg: ",currentChatBG);
    },[currentChatBG])




    useEffect(()=>{
        if(currentUser){
            setActiveUser(currentUser.uid);
            onValue(ref(database,`Users/${currentUser.uid}/friends`),(snapshot)=>{
                setFriends(snapshot.val());
            })
            onValue(ref(database,`Users/${currentUser.uid}/friendRequests`),(snapshot)=>{
                setFriendRequests(snapshot.val());
            })
            window.addEventListener("unload",setInactiveUser);
            return ()=>{
                window.removeEventListener("unload",setInactiveUser);
                setFriendRequests();
                setCurrentUser();
                setLoading();
            }
        }
    },[currentUser,setInactiveUser])

    return(
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

