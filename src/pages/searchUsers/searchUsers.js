import React,{useState, useEffect,useCallback} from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import './searchUser.css';
import { useNavigate, Link, Outlet } from 'react-router-dom';

const isComplete = (e) => {
    let img = e.target;
    if(img.complete){
        img.classList.remove("incomplete");
    }
    if(!img.complete){
        alert("incomplete");
    }
}

export const Users = () => {
    const navigate = useNavigate();
    
    return(
        <section className="search-user-container">
            <div>
                <button onClick={()=>{navigate('../home',{replace:true})}}>back</button><br/>
                <Link to={`../Users`}>Search Users</Link><br/>
                <Link to="FriendRequests">FriendRequests</Link><br/>
                <Link to="Friends">Friends</Link>
                <hr/>
            </div>
            <div>
                <Outlet/>
            </div>
       </section>
    )
}

export const Search = () => {
    const {currentUser,cdb,writeDB,friends, friendRequests} = UseAuth();
    const [users,setUsers] = useState([]);

    const getData = useCallback(async() => {
        let data = await cdb();
        let arr = [];
        for( let i in data){
            if(i === currentUser.uid) continue
            arr.push({uid:i,data:data[i]});
        }
        console.log("Search: ",arr);
        setUsers(arr);
    },[currentUser])

    const handleFriendRequest = async(event,user_uid) => {
        try{
            writeDB(`${currentUser.uid}/friends/${user_uid}`,false);
            writeDB(`${user_uid}/friendRequests/${currentUser.uid}`,true);
            event.target.classList.add("pending");
            event.target.disable = true;
        } catch(err){
            console.log("handleFriends error: ", err);
        }

    }

    useEffect(()=>{
        getData();
    },[getData])
    
    return(
        <section className="search-users-page">
                <h3>Users</h3>
                {users?.map((el,idx)=>{
                    let className = "";
                    let disabled = false;
                    if(friends === null) { }
                    else if(friends[el.uid] === undefined){ }
                    else if(!friends[el.uid]) { return <></> }
                    else if (friends[el.uid]) { 
                        className = "friend";
                        disabled = true;
                    } 
                    if(friendRequests && friendRequests[el.uid]) return <></>
                    return(
                        
                        <div className="select-user-option" key={idx}>
                            {
                                (el.data.img_url) 
                                ? <img className="select-user-img incomplete" onLoad={isComplete} src={el.data.img_url} alt={el.data.img_url} />
                                : <p className='alt-user-img'><span>{el.data.name[0]}</span></p>
                            }
                            <div>
                                <p className="select-user-name">{el.data.name}</p>  
                                
                                <button onClick={(e)=>{handleFriendRequest(e,el.uid)}} className={`friend-request-butt ${className}`} disabled={disabled} ></button>
                            </div>
                        </div>
                    )
                })}
        </section>
    )
}

export const FriendRequests = () => {
    const [friendReqs,setFriendReqs] = useState([]);
    const [loading,setLoading] = useState(true);

    const {currentUser, fetchUsersData, friendRequests,acceptFriendReq,rejectFriendReq} = UseAuth();


    const getData = useCallback(async() => {
        let friend_requests = []
        if(friendRequests === undefined) setFriendReqs(friend_requests);
        if(friendRequests === null) console.log("null Friend requests")
        for(let i in friendRequests){
            let known_req = friendReqs.find((val,idx)=>val.uid === i);
            if(known_req) {
                console.log("known req: ", known_req);
                friend_requests.push(known_req);
                continue;
            }
            let res = await fetchUsersData(i);
            friend_requests.push({uid:res.key,name:res.val().name,pic:res.val().img_url});
        }
    
        setFriendReqs(friend_requests);
        setLoading(false);

        
        console.log("here: ",friend_requests);
        
    },[friendRequests])

    useEffect(()=>{
        getData();
    },[getData,friendRequests])

    if(loading) return <h1>Loading....</h1>

    return(
        <div className="friend-request-page">
            <h3>Friend Requests</h3>
            {friendReqs?.map((el,idx)=>{
                return(
                    <div className="select-user-option" key={idx}>
                        {
                            (el.pic)
                            ? <img className="select-user-img" src={el.pic} alt={el.pic || el.name[0]} />
                            : <p className="alt-user-img">{el.name[0]}</p>
                        }
                        <div>
                            <p className="select-user-name">{el.name}</p>
                            <button className="pending-request-butt" onClick={()=>acceptFriendReq(currentUser.uid,el.uid)}>accept</button><button onClick={()=>rejectFriendReq(currentUser.uid,el.uid)} className="pending-request-butt">reject</button>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}



export const Friends = () => {
    const {currentUser,friends,fetchUsersData,removeFriend,removePending,findChat} = UseAuth();
    const [friendList,setFriendList] = useState([]);
    const navigate = useNavigate();
    const convertToArr = useCallback(async()=> {
        let arr = [];
        for(let i in friends){
            try{
                let chat_ref = await findChat(currentUser.uid,i);
                let data = await fetchUsersData(i).then((snapshot)=>{ return {uid:snapshot.key,name:snapshot.val().name,pic:snapshot.val().img_url,chat_id:chat_ref}});
                arr.push(data);
                console.log(`convertToArr function data: `,data, friends);
            } catch( err ){
                console.log(err);
            }
        }
        console.log("outside: ", arr);
        setFriendList(arr);
    },[friends,currentUser.uid])

    const sendMessage = async(chat_id) => {
        navigate(`../../Chats/${chat_id}`,{replace:true});
    }

    useEffect(()=>{
        convertToArr()
        console.log("Friends")
    },[friends,convertToArr])

    return(
        <section className="friends-page">
            <h3>Friends</h3>
            {friends && friendList?.map((el,idx)=>{
                return(
                    <div key={idx} className="select-user-option" >
                        {
                            (el.pic)
                                ? <img onLoad={isComplete} className="select-user-img incomplete" src={el.pic} alt={el.pic || el.name[0]} />
                                : <p className="alt-user-img">{el.name[0]}</p>
                        }
                        <div>
                            <p className="select-user-name">{el.name}</p>
                            {
                                (friends[el.uid])
                                ? <>
                                    <button onClick={()=>sendMessage(el.chat_id)}>send message</button> 
                                    <button onClick={()=>removeFriend(currentUser.uid,el.uid)} >remove</button>
                                  </>
                                : <><span>pending</span><button onClick={()=>removePending(currentUser.uid,el.uid)} >remove</button></>

                            }
                        </div>
                    </div>
                )
            })}
        </section>
    )
}

