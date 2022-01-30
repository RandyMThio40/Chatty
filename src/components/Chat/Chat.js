import React,{useState,useEffect,useRef} from'react';
import { Link, Outlet,useNavigate,useOutletContext, useParams} from 'react-router-dom';
import { UseAuth } from '../../utility/useContextAuth';
import { database } from '../../firebase';
import { onValue,ref } from 'firebase/database';
import { io } from 'socket.io-client';
import './Chat.css';

const displayTime = (date_obj) => {
    let D = new Date(date_obj);
    let hrs = D.getHours();
    let min = D.getMinutes();
    if(min < 10) min = `0${min}`;
    if(hrs < 10) hrs = `0${hrs}`;
    return `${hrs}:${min}`;
}


export const ChatLayout = () => {
    const {chatID} = useParams();
    const { currentUser, getConv , fetchUsersData,changeBG} = UseAuth();
    const [loading,setLoading] = useState(true);
    const [loadingConv,setLoadingConv] = useState(true);
    const navigate = useNavigate();
    const [conversation,setConversation] = useState([]);
    const [userData,setUserData] = useState({});
    const [chatsList, setChatsList] = useState([]);
    const socket = useRef();
    const change_bg = useRef();
    const prev_room = useRef(chatID);

    const findChatObj = (element) =>{
        return element.key === chatID;
    }

    const getCurrentConv = async() => {
        const data = await getConv(chatID);
        let obj = {};
        if(!data.val){
            if(chatsList.length) navigate(`${chatsList[0]["key"]}`,{replace:true})
            setLoadingConv(false);
            return;
        }
        for(let uid in data.val.members){
            const img_url = await fetchUsersData(`${uid}/img_url`)
            obj[uid] = {
                name:data.val.members[uid]["name"],
                img_url:img_url.val()
            }
        }
        setUserData(obj);
        // console.log("userData: ",obj)
        let arr =[];
        for(let i in data.val.messages){
            // const img_url = await fetchUsersData()
            // console.log(data.val.messages[i]);
            arr.push(data.val.messages[i])
        }
        setConversation(arr);
        if(loadingConv) setLoadingConv(false);
    }

    const clickChangeBG = () =>{
        change_bg.current.click();
    }

    const handleChangeBG = async(e) => {
        if(!e.target.files[0]) return;
        const metadata = {
            contentType: e.target.files[0].type,
        };
        changeBG(chatID,e.target.files[0],metadata);
    }

    const getData = async() => {
        const chats = await fetchUsersData(`${currentUser.uid}/chats`);
        let is_chat_id_real = false;
        let chat_arr = [];
        let chat_list = []
        // console.log("chats bruh",chats.val());
        if(!chats.val()){
            setLoading(false);
            return;
        }
        for(let keys in chats.val()){
            let chat_data = await getConv(keys);
            if(chatID === keys) is_chat_id_real = true;
            // console.log("chat_data: ",chat_data);
            chat_arr.push(chat_data);
            if(chat_data.val.type === "private"){
                Object.keys(chat_data.val.members).forEach(el=>{
                    // console.log("keys: ", chat_data.val.members[el].name);
                    if(chat_data.val.members[el].name !== currentUser.displayName ) chat_list.push({key:keys,uid:el,members:chat_data.val.members[el].name})
                })
                
            } else if(chat_data.val.type === "group"){

            }
        }

        // console.log("chat_arr: ",chat_arr);
        // console.log("chat_list: ",chat_list);


        setChatsList(chat_list);    
        if(!is_chat_id_real) navigate(`${chat_list[0]["key"]}`,{replace:true});
        setLoading(false);
        
        

    }
    useEffect(()=>{
        getData();
        socket.current = io("http://localhost:5000");
        socket.current.on("is-connected",(res)=>{
            console.log("ressss: ", socket.current.id);
        })

        console.log("%c chat layout component rendered",'background:red;color,white')
        return async()=>{
            socket.current.disconnect();
            console.log("%c unmount",'background:yellow;')
            setLoadingConv(true);
            setLoading(true);
        }
    },[currentUser])

    

    useEffect(()=>{
        console.log("getting current convo: ");
        getCurrentConv();
    },[chatID])
    
    
    if(loading  || loadingConv)return <>loading....</>
    if(!chatsList.length) return <>no conversations you are lonely</>
    return(
        <section className="layout-chat">
            <div className="chat-list-links"> 
                <div className="chat-list-overhead">
                    <h3 className="chat-list-header">Chats</h3>
                    <div className="dot-container">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>
                {chatsList.length && chatsList.map((el,idx)=>{
                    return(
                        <Link key={idx} to={`${el.key}`}>
                            <div className={`link-chat ${(chatID === el.key) ? "active" : ""}`}>
                                <h4 className="link-chat-title">{el.members.toString()}</h4>
                            </div>
                        </Link>
                    )
                })}
            </div>
            <div className="chat-main-content">
            {
                (chatsList.find(findChatObj))
                ? <Outlet context={[socket,chatID,conversation,setConversation,userData,chatsList.find(findChatObj),prev_room]} />
                : <div style={{width:"100%"}}>Chat does not exist</div>
            }
            </div>
            {
                (chatsList.find(findChatObj))
                ? <div className="chat-settings-container">
                    <div className="chat-settings-wrapper">
                        {
                            (userData[chatsList.find(findChatObj).uid]?.img_url)
                            ? <img className="chat-settings-prof-img" src={userData[chatsList.find(findChatObj)?.uid]?.img_url} alt="chat.png"/>
                            : <div className="alt-img"><span>{chatsList.find(findChatObj).members[0]}</span></div>
                        }
                        <div className="chat-name">{chatsList.find(findChatObj).members.toString()}</div>
                        <details className="customize-chat">
                            <summary>Customize chat</summary>
                            <div>
                                <div>
                                    <input ref={change_bg} onChange={handleChangeBG} type="file" accept="image/*" hidden/>
                                    <button onClick={clickChangeBG}>Change background img</button>
                                </div>

                            </div>
                        </details>
                    </div>
                </div>
                : <></>

            }
        </section>
    )
}

export const Chat = () => {
    const {sendMessage} = UseAuth();
    const [socket,currentRoom,conversation,setConversation,userData,currentChatMembers,prev_room] = useOutletContext();
    const [message,setMessage] = useState("");
    const enter_key_down = useRef(false);
    const shift_key_down = useRef(false);
    const hidden_butt = useRef();
    const editable_div = useRef();
    const [active,setActive] = useState(false);
    const {currentUser,observeChatBG,currentChatBG,clearChatBG} = UseAuth();

    const handleSubmit = async(event) => {
        event.preventDefault();
        if(!message.trim().length) return
        // console.log("submit: ",message);
        let message_obj = {text: message.trim(), timeStamp: new Date().toString(), img:null, sender: currentUser.uid};
        setConversation(prev => [...prev,message_obj]);
        socket.current.emit("sent",currentRoom,message_obj);
        const res = await sendMessage(currentRoom,message_obj);
        const chat_el = document.querySelector(".chat-wrapper");
        setTimeout(()=>{
            chat_el.scrollTop = chat_el.scrollHeight;
        })
        setMessage("");
    }
    
    const handleKeyUp = (event) => {
        // console.log(event.key," shiftkey: ",shift_key_down.current, " enterkey: ",enter_key_down.current)
        if(shift_key_down.current && event.key === "Shift"){
            shift_key_down.current = false;
        }
        else if(enter_key_down.current && event.key === "Enter"){
            
            enter_key_down.current = false;
        }
    }
    
    const handleKeyDown = (event) => {
        if(!shift_key_down.current && event.shiftKey){
            shift_key_down.current = true;
        }
        else if( shift_key_down.current && event.key === "Enter"){
            enter_key_down.current = true;
        }
        else if( !shift_key_down.current && event.key === "Enter" ){
            enter_key_down.current = true;
            if(message.length) hidden_butt.current.click();
        }
    }

    const clearInput = () => {
        editable_div.current.innerText = "";

    }

    const handleInput = (event) => {
        // console.log(event.target.childNodes[0]?.nodeName)
        if(!shift_key_down.current && enter_key_down.current){
            editable_div.current.innerText = "";
            return;
        } 
        setMessage(event.target.innerText);
    }

    const toggleSetting = () => {
        document.querySelector(".chat-settings-container").classList.toggle("active");
    }

    useEffect(()=>{
        console.log("%c aksjdnahjbalsfkbdlskbaldfbaljd",'background:purple');
        if(socket.current){
            socket.current.on("response",(res)=>{
                console.log("chat: ",res);
            })
            socket.current.on("receive-message",(res)=>{
                console.log("recieved-message event: ",res);
                setConversation(prev => [...prev,res])
            })
        }
    },[])    
    
    useEffect(()=>{
        console.log("useEffect at Chat component",currentRoom);
        if(socket.current){
            socket.current.emit("join-room",currentRoom);
        }
        
        observeChatBG(currentRoom);
        prev_room.current = currentRoom;
        return()=>{
            console.log("leaving room: ",prev_room.current," currrent: ",currentRoom);
            socket.current.emit("leave-room",prev_room.current);
            clearChatBG();
        }

       
    },[currentRoom])

    useEffect(()=>{
        const chat_bg = document.querySelector(".chat-bg");
        chat_bg.style.backgroundImage = "none";
        if(currentChatBG){
            chat_bg.style.backgroundImage = `url(${currentChatBG})`;
        }
    },[currentChatBG])

    useEffect(()=>{
        onValue(ref(database,`Users/${currentChatMembers.uid}/active`),(snapshot)=>{
            setActive(snapshot.val());
        })
    },[currentRoom])

    useEffect(()=>{
        const jump_butt = document.querySelector(".jump-down-button");
        document.querySelector(".chat-wrapper").addEventListener('scroll',e=>{
            // console.log("helloor ; ",e.target.scrollTopMax)
            // console.log("e.target.offsetHeight: ",e.target.offsetHeight," e.target.scrollHeight: ",e.target.scrollHeight," e.target.scrollTop: ",e.target.scrollTop," e.target.scrollHeight - e.target.offsetHeight: ",e.target.scrollHeight - e.target.offsetHeight,e.target.scrollHeight - e.target.offsetHeight === e.target.scrollTop);
            if(e.target.scrollTopMax && e.target.scrollTopMax === e.target.scrollTop){
                jump_butt.classList.remove("active");
                return;
            }
            else if(e.target.scrollHeight - e.target.offsetHeight === e.target.scrollTop){
                jump_butt.classList.remove("active");
                return;
            }
            !jump_butt.classList.contains("active") && jump_butt.classList.add("active");
        })
        
    },[])

    if(!currentRoom) return<></>
    
    return(
        <div className="chat-container">
            <div className="chat-overhead">
                <div className="chat-overhead-prof">
                    <img className="chat-overhead-profile-img" src={userData[currentChatMembers.uid]?.img_url} alt="img.png"/>
                    <h1 className="chat-overhead-title">{currentChatMembers.members.toString()}</h1>
                    {
                        (active)
                        ? <div className="active"></div>
                        : <div className="inactive"></div>
                    }
                </div>
                <div className="dot-container" onClick={toggleSetting}>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </div>
            </div>
            <div className="chat-bg" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <Conversation uid={currentUser.uid} conversation={conversation} userData={userData} />
                <section className="chat-input-section">
                    <form id="message-form" className="chat-input-container" onSubmit={handleSubmit}>
                        <div ref={editable_div} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="chat-text-message">
                        </div>
                        <div className="chat-input-placeholder" style={message.length ? {display:"none"} : {}}>Message...</div>
                    
                        <input ref={hidden_butt} type="submit" value="submit" hidden/>
                    </form>
                    <input id="send-butt" form="message-form" type="submit" value="send" onClick={clearInput}/>
                </section>

            </div>
        </div>
    );
}

export default Chat;

const ProfileImg = ({display = true,img_type}) => {
    if(!display) return <></>
    if(img_type["img_url"]) return <img className="profile-pic" src={img_type["img_url"]} alt="img" />
    if(!img_type["img_url"]) return <p className='alt-pic'><span>{img_type["name"][0]}</span></p>
    
}


const Conversation = React.memo(({uid,conversation,userData}) =>{
    const prev_date = useRef({
        day:null,
        month:null,
        year:null
    });
    const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const prev_display_name = useRef("");
    
    const handleJump = () => {
        const chat_wrap = document.querySelector(".chat-wrapper");
        chat_wrap.scrollTop = chat_wrap.scrollHeight;
    }

    useEffect(()=>{
        prev_date.current = {
            day:null,
            month:null,
            year:null
        }
        const chat_wrap = document.querySelector(".chat-wrapper");
        chat_wrap.scrollTop = chat_wrap.scrollHeight;
        chat_wrap.style.scrollBehavior = "smooth";
        return()=>{
            chat_wrap.style.scrollBehavior = "";

        }
    },[conversation])

    const handleLinks = (str) => {
        if(!str) return;
        let split_str = str;
        let new_str = []

        do{
            let match_idx = split_str.search(/https:\/\//);
            if(match_idx > 0){
                new_str.push(split_str.substring( 0,match_idx));
                split_str = split_str.substring(match_idx);
            }
            else if(match_idx === 0){
                let whitespace_idx = split_str.search(" ");
                let url = split_str.substring(0,whitespace_idx);
                new_str.push(<a className="hyperlink" target="_blank" href={url}>{`${url}`}</a>)
                split_str = (whitespace_idx === -1) ? "" : split_str.substring(whitespace_idx);
            }
            else{
                if(split_str === str) return str;
                new_str.push(split_str);
                split_str = "";
            }
        } while(split_str.length)


        return new_str.map((el,idx)=>{
            return (
                <React.Fragment key={idx}>
                    {el}
                </React.Fragment>
            )
        }); 
    }
    
    
    return(
        <section className="conv-container">
            <div className="chat-wrapper">
                {conversation?.map((item,idx)=>{
                    // console.log("item: ",item,userData)
                    // console.log("prev: ",prev_date.current["year"]);
                    let date = new Date(item.timeStamp);
                    // console.log("date: ",date);
                    let today;
                    let Y = date.getFullYear();
                    let M = date.getMonth();
                    let D = date.getDate();
                    let display_time = false;
                    let display_name = false;
                    if( !idx || date.getFullYear() !== prev_date.current["year"] || date.getMonth() !== prev_date.current["month"] || date.getDate() !== prev_date.current["day"] ){
                        prev_date.current["year"] = Y;
                        prev_date.current["month"] = M; 
                        prev_date.current["day"] = D;
                        display_time = true;
                        let d = new Date();
                        if(Y === d.getFullYear() && M === d.getMonth() && D === d.getDate()) today = "Today";
                    }
                    if(display_time){
                        display_name = true
                    } 
                    else if( prev_display_name.current !== item.sender ){
                        display_name = true;
                    }
                    prev_display_name.current = item.sender


                    
                    return(
                        <React.Fragment key={idx}>
                            {
                                (display_time)
                                ? <div className="display-date" style={{textAlign:"center"}} >{today || `${weekday[date.getDay()]}, ${month[M]} ${D}, ${Y}`}</div>
                                : <></>
                            }
                            <div  className={`message-container  ${ item.sender === uid ? `user` : `` }`}>
                                <div className={`message-content ${(!display_name)? "no-prof-img" : ""}`}>
                                    {
                                        (display_name)
                                            ?<h3 className="message-sender">{userData[item.sender]["name"]}</h3>
                                            :<></>
                                    }
                                    <div className="message-wrapper">
                                        <p className="message-text">
                                            {handleLinks(item?.text.trim())}
                                            <span className="time"><sub>{displayTime(item.timeStamp)}</sub></span>
                                        </p>
                                    </div>

                                </div>
                                <ProfileImg display={display_name} img_type={userData[item.sender]}/>
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
            <div className="jump-down-button" onClick={handleJump}/>
        </section>
    )
},(prevProps,nextProps) =>{
    // console.log("prev: ",prevProps.conversation.length !== nextProps.conversation.length );
    if(prevProps.conversation.length === nextProps.conversation.length){
        return true;
    }
    return false;
})


