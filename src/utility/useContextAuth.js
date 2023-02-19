import React,{useContext, useState, useEffect} from 'react';
import {auth,createUser,signOutUser, signInUser, database} from '../firebase.js';
import { ref,get, child, set,query,equalTo, push, onValue, update, orderByChild, orderByValue, orderByKey } from "firebase/database";
import { updateProfile } from 'firebase/auth';
import { uploadBytes,ref as storageRef, getDownloadURL, deleteObject, list } from 'firebase/storage';
import { storage } from '../firebase.js';
import { HashString } from './simpleHash.js';

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

    // const cdb = async() => {
    //     const db_ref = ref(database);
    //     return get(child(db_ref,"Users/")).then((snapshot)=>{

    //         // console.log("cdb: ",snapshot.val());
    //         return snapshot.val();
    //     }).catch((error)=>{
    //         console.log(error);
    //     })

    // }

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
    const setInactiveUser = () =>{
        set(ref(database,`Users/${currentUser.uid}/active`),false);
    }

    const updatePhotoURL = async(current_user,url) =>{
        return updateProfile(current_user,{photoURL:url}).then(()=>{
            set(ref(database, `Users/${current_user.uid}/profile/img_url`),url)
            console.log("updated photoURL ");
        })
        .catch((error)=> {
            console.log(error);
        })
    }

    const updateDisplayName = async( current_user, nickname ) => {

        return updateProfile(current_user,{displayName: nickname }).then(()=>{
            set(ref(database, `Users/${current_user.uid}/profile/name`),nickname)
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

    /* 
        Creates a group chat and updates all group members' chatrooms list
        @param {Object} groupMembers - array of particapants' uid
        @param {string} title - name of chatRoom
    */
    const createGroupChat = async(title="",groupMembers=undefined) => {
        try {
            if(!groupMembers || !title) return
            const chatKey = push(child(ref(database),'ChatRooms')).key;
            const chatRoomsUpdates = {};
            const userUpdates = {};
            let groupMembersUid = Object.keys(groupMembers);
            groupMembersUid.forEach((memberUid)=>{
                chatRoomsUpdates[`chat_info/members/${memberUid}`] = {name:groupMembers[`${memberUid}`].profile.name,active_member:true};
                userUpdates[`${memberUid}/chats/${chatKey}/group/members`] =  groupMembersUid.filter((uid)=>uid !== memberUid)
            })
            chatRoomsUpdates[`chat_info/type`] = "group";
            chatRoomsUpdates[`chat_info/title`] = title;
            update(ref(database,`/ChatRooms/${chatKey}`),chatRoomsUpdates)
            update(ref(database,`/Users`),userUpdates)
            return 200
        } catch(err){
            console.log(err)
            return 400;
        }
    }
 

    const acceptFriendReq = async(uid,user_uid) => {
        const existing_chat = await findChat(uid,user_uid);
        const data_key = push(child(ref(database), 'ChatRooms')).key;
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
        const name1 = await get(ref(database,`Users/${uid}/profile/name`));
        const name2 = await get(ref(database,`Users/${user_uid}/profile/name`));

        updates[`Users/${uid}/chats/${data_key}/private`] = obj1;
        updates[`Users/${user_uid}/chats/${data_key}/private`] = obj2;
        updates[`ChatRooms/${data_key}/chat_info/members/${uid}/name`] = name1.val();
        updates[`ChatRooms/${data_key}/chat_info/members/${user_uid}/name`] = name2.val();
        updates[`ChatRooms/${data_key}/chat_info/type`] = "private";
        
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

    const fetchUsersData = async(path = "") => {
        return get(child(ref(database),`Users/${path}`));
    }

    const getConv = async(path) => {
        try{
            const conv = await get(ref(database,`ChatRooms/${path}`))
            const obj = {
                key: conv.key, 
                val: conv.val()
            }
            return obj;
            
        } catch (err) {
            console.log(err);
        }
    }

    
    const changeBG = async(chatID,file,metaData) => {
        try{
            const updates = {}
            const url = await uploadBytes(storageRef(storage,`${chatID}/background-img`),file,metaData)
            .then(()=>getDownloadURL(storageRef(storage,`${chatID}/background-img`)));
            updates[`${chatID}/chat_info/background_img`] = url;
            update(ref(database,`/ChatRooms`),updates);
        } catch(err){
            console.log(err);
        } 
    }  

    const setNickName = (chatID,userID,nickname) => {
        try{
            const updates = {};
            updates[`${chatID}/chat_info/members/${userID}/nickname`] = nickname;
            update(ref(database,`/ChatRooms`),updates);
        } catch(err){
            console.log(err)
        }
    }
    
    const [currentChatBG,setCurrentChatBG] = useState("");
    
    const observeChatBG = (path) => {
        onValue(ref(database,`/ChatRooms/${path}/chat_info/background_img`),(snapshot)=>{
            setCurrentChatBG(snapshot.val());
        })
    }
    const clearChatBG = ()=> {
        setCurrentChatBG("");
    }

    const uploadToStorage = async (obj,path="test_upload_img") => {
        try{
            let uid = push(child(ref(database),'/')).key;
            const url = await uploadBytes(storageRef(storage,`${path}${uid}`),obj,{contentType:"image/png"})
            .then(()=>getDownloadURL(storageRef(storage,`${path}${uid}`)))
            console.log("url: ",url)
            return url
        } catch (err){
            console.log("error in uploading image",err);
        }
    }

    const sendMessage = async (chat_id,data) => {
        try{
            const updates = {};
            const keys = []
            data.forEach(async(obj)=>{
                let key = push(child(ref(database), 'ChatRooms')).key
                keys.push(key);
                updates[key] = obj;
            })
            update(ref(database,`ChatRooms/${chat_id}/messages/`),updates);
            return keys;
        } catch (err){
            return err;
        }
    }
    
    const deleteImg = async(chatID,url,path = "background") => {
        const updates = {};
        deleteObject(storageRef(storage,url)).then(()=>{
            console.log("file deleted successfully")
        }).catch((error)=>{
            console.log(error);
        })
        switch(path){
            case "background": {
                updates[`${chatID}/chat_info/background_img`] = null;
                break;
            }
            default: {
                updates[`${chatID}/messages/${path}`] = null;
                break;
            }
        }
        update(ref(database,`/ChatRooms`),updates);
    }
    
    const deleteChatData = async(id,url,path,type) => {
        const updates = {};
        console.log("id: ",id," url: ",url," path: ",path, "type: ",type)
        switch(type){
            case "text": {
                console.log("text del")
                updates[`/${id}/${path}`] = null;
                break;
            }
            case "img": {
                console.log("img del")
                await deleteObject(storageRef(storage,url)).then(()=>{
                    console.log("file deleted successfully")
                    updates[`/${id}/${path}`] = null;
                }).catch((error)=>{
                    console.log(error);
                })
                break;
            }
            default: {
                break;
            }
        }
        console.log("updoot")
        update(ref(database,`/ChatRooms`),updates);
    }

    const getMedia = async(chat_id,token = null, max=10, trailing_number) => {
        try{
            const media_ref = await list(storageRef(storage,`${chat_id}/media`),{maxResults:max,pageToken:token});
            let urls = [];
            console.log(!media_ref.items.length === trailing_number);
            if( (!media_ref.items.length === trailing_number)  ) return -1;
            for(let idx in media_ref.items){
                if(idx < trailing_number) continue;
                let url = await getDownloadURL(media_ref.items[idx]);
                urls.push(url);
            }
            return ({token:media_ref.nextPageToken,img_urls:urls});
        }catch(err){
            console.log(err)
            return -1;
        }
    }

    const observeValue = (path,setState) => {
        onValue(ref(database,path),(snapshot)=>{
            setState(snapshot.val())
        })
    }

    const setLastActive = (chatID,userID) => {
        const updates ={};
        let date = new Date();
        updates[`ChatRooms/${chatID}/chat_info/members/${userID}/last_active`] = date.getTime();
        updates[`ChatRooms/${chatID}/chat_info/members/${userID}/last_active_date`] = date.toString();
        update(ref(database,'/'),updates);
    }
    const getFriendsList = async (user) => {
        try{
            const que = query(ref(database,`Users/${user}/friends`), orderByValue(),equalTo(true));
            const data = await get(que).then(res=>res.val());
            const friends_data = [];
            for(let uid in data){
                const friend_profile = await get(ref(database,`Users/${uid}/profile`));
                friends_data.push({
                    uid:uid,
                    profile:friend_profile.val(),
                });
            }
            return friends_data;
        }catch(err){
            console.log(err);
        }
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
        uploadToStorage,
        deleteImg,
        deleteChatData,
        getMedia,
        observeValue,
        setLastActive,
        setNickName,
        getFriendsList,
        createGroupChat,
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
        if(currentUser){
            const test = async() => {
                const que = query(ref(database,`/Users/ads/1ObJwt9gusgL8UKi376WV1bt9s42/chats`),orderByChild("group/members"),equalTo(""));
                let data = await get(que)?.then(snapshot => {
                    if(!snapshot.val()) return null;
                    return snapshot.val();
                });
                console.log(data);
                return data;

            }
            // test();`
            // const t = async () => {
            //     try{
            //         const test_ref = await get(query(ref(database,"ChatRooms/-Mw4w7hEQ9qXyr_sznLc/messages"),orderByChild('type'), equalTo("media")));
            //         test_ref.forEach((item)=>{
            //             console.log(item.key,item.val(),item.val().timestamp)
            //         })
            //     } catch(err){
            //         console.log(err);
            //     }

            // }
            // t();
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
    },[currentUser])

    return(
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

