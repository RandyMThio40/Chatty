import React,{useState,useEffect,useRef} from'react';
import { Link, Outlet,useNavigate,useOutletContext, useParams} from 'react-router-dom';
import { UseAuth } from '../../utility/useContextAuth';
import { database } from '../../firebase';
import { get, onValue, ref } from 'firebase/database';
import { io } from 'socket.io-client';
import axios from "axios";
import './Chat.css';
import { v4 } from 'uuid';
import jump_down_icon from '../../imgs/down_arrow_icon.svg';

const displayTime = (date_obj) => {
    let D = new Date(date_obj);
    let hrs = D.getHours();
    let min = D.getMinutes();
    if(min < 10) min = `0${min}`;
    if(hrs < 10) hrs = `0${hrs}`;
    return `${hrs}:${min}`;
}

const isComplete = (e) => {
    let img = e.target;
    if(img.complete){
        img.parentNode.classList.remove("loading");
    }
    if(!img.complete){
        alert("incomplete");
    }
}

const DisplayChatProfileImg = ({members_obj,user_imgs,overhead}) => {

    return (
        <div className={overhead ? "chat-overhead-profile-img" : "chat-settings-prof-img"}>
            {    
                members_obj.members.map((obj,idx)=>{
                    return(
                        <React.Fragment key={idx}>
                            {
                                (user_imgs[obj.uid]?.img_url)
                                ? <img src={user_imgs[obj.uid]?.img_url} alt="chat.png"/>
                                : <div className="alt-img"><span>{user_imgs[obj.uid]?.name[0]}</span></div>
                            }
                        </React.Fragment>
                    )
                })
            }
        </div>
    )
}

const DisplayTitle = ({members_obj}) => {

    if(members_obj.title)
    return(
        <>{members_obj.title}</>
    )

    return members_obj.members.map((obj,idx)=>{
        return(
            <React.Fragment key={idx}>
                {`${obj.member}${idx !== members_obj.members.length-1 ?  ", " : ""}`}
            </React.Fragment>
        )
    })
}


const LinkChat = ({item, roomID, setState}) => {
    const [number_of_new_messages,set_number_of_new_messages] = useState(0);
    const { currentUser } = UseAuth();
    const {chatID} = useParams();
    const currentRoom = useRef(chatID);
    const last_active = useRef();

    useEffect(()=>{
        if(last_active.current && currentRoom.current === roomID && currentRoom.current !== chatID){
            last_active.current = new Date().getTime();
            set_number_of_new_messages(0);
            setState(prev => {
                let obj = {};
                obj[roomID] = {
                    new_messages_count:0,
                }
                return {
                    ...prev,
                    ...obj,
                }
            });
        }
        currentRoom.current = chatID;
        if(chatID === roomID){

        }
    },[chatID])

    useEffect(()=>{
        onValue(ref(database,`/ChatRooms/${roomID}/messages`), async(snapshot)=>{
            try{
                if(currentRoom.current === roomID && last_active.current){
                    set_number_of_new_messages(0);
                    return;
                }
                last_active.current = last_active.current || await get(ref(database,`ChatRooms/${roomID}/chat_info/members/${currentUser.uid}/last_active`)).then(res=>res.val())
                let new_messages_count = Array.from(Object.entries(snapshot.val())).filter((duple)=> duple[1]["timeStamp"] > last_active.current).length;
                new_messages_count && set_number_of_new_messages(prev => new_messages_count);
                new_messages_count && setState(prev => {
                    let obj = {};
                    obj[roomID] = {
                        new_messages_count:new_messages_count,
                    }
                    return {
                        ...prev,
                        ...obj,
                    }
                });
            }catch(err){
                set_number_of_new_messages(prev=>{
                    if(prev) return prev;
                    return 0;
                });
                console.log(err);
            }
        })
        return()=>{
            set_number_of_new_messages();
        }
    },[])

    return(
        <Link to={`${item.key}`}>
            <div className={`link-chat ${(chatID === item.key) ? "active" : ""}`}>
                <h4 className="link-chat-title">
                    <DisplayTitle members_obj={item} />
                </h4>
                <p>new messages: {number_of_new_messages}</p>
            </div>
        </Link>
    )
}

const toggleSetting = () => {
    const chat_settings_cont = document.querySelector(".chat-settings-container");
    const change_bg_button = document.querySelector(".customize-chat summary");
    const media_button = document.querySelector(".media-button");
    const close_button = document.querySelector(".chat-settings-container .close");
    chat_settings_cont?.classList.toggle("active");
    if(!change_bg_button || !media_button || !close_button) return;
    if(chat_settings_cont.classList?.contains("active") ){
        change_bg_button.tabIndex = 0;
        media_button.tabIndex = 0;
        close_button.tabIndex = 0;
    } else {
        change_bg_button.tabIndex = -1;
        media_button.tabIndex = -1;
        close_button.tabIndex = -1;
    }
}

export const ChatLayout = () => {
    const {chatID} = useParams();
    const { currentUser, getConv , fetchUsersData,changeBG,currentChatBG,deleteChatData, getMedia } = UseAuth();
    const [loading,setLoading] = useState(true);
    const [loadingConv,setLoadingConv] = useState(true);
    const [conversation,setConversation] = useState([]);
    const [userData,setUserData] = useState({});
    const [chatsList, setChatsList] = useState([]);
    const socket = useRef();
    const change_bg = useRef();
    const prev_room = useRef(chatID);
    const [media,setMedia] = useState({token:null,img_urls:[]});
    const mediaCont = useRef();
    const [MCount,setMCount] = useState({});
    const [name,setName] = useState("");
    const navigate = useNavigate();
    
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
        for(let uid in data.val.chat_info.members){
            const profile = await fetchUsersData(`${uid}/profile`);
            obj[uid] = {
                name:data.val.chat_info.members[uid]["nickname"] || data.val.chat_info.members[uid]["name"] || profile.val()["name"],
                img_url:profile.val()?.img_url
            }
        }
        setUserData(obj);
        let arr =[];
        for(let i in data.val.messages){
            arr.push({...data.val.messages[i],message_key:i})
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
        if(!chats.val()){
            setLoading(false);
            return;
        }
        for(let chat_key in chats.val()){
            let chat_data = await getConv(`${chat_key}/chat_info`);
            if(chatID === chat_key) is_chat_id_real = true;
            chat_arr.push(chat_data.val);
            if(chat_data.val.type === "private"){
                let members_obj_arr = []
                for( let member_uid in chat_data.val.members){
                    if(member_uid !== currentUser.uid){
                        let member_name =  chat_data.val.members[member_uid].nickname || chat_data.val.members[member_uid].name || await fetchUsersData(`${member_uid}/profile/name`).then(snap=>snap.val());
                        members_obj_arr.push({uid:member_uid,member:member_name});
                    }
                }
                chat_list.push({
                    key: chat_key,
                    members: members_obj_arr,
                    title: chat_data.val.title,
                    type: chat_data.val.type
                });
            }
        }
        setChatsList(chat_list);    
        if(!is_chat_id_real) navigate(`${chat_list[0]["key"]}`,{replace:true});
        setLoading(false);
    }

    const loadMedia = async () => {
        if(!chatID) return;
        let MAX_RESULTS =  20;
        let trailing_number = (media.img_urls.length % MAX_RESULTS)
        let data = await getMedia(chatID,media.token,MAX_RESULTS, trailing_number);
        console.log(data,media)
        if(data === -1) return;
        if(media.img_urls[media.img_urls.length-1] && (media.img_urls[media.img_urls.length-1] === data.img_urls[data.img_urls.length-1])) return;
        setMedia(pre =>{return{token:data.token || pre.token,img_urls:[...pre.img_urls,...data.img_urls]}});
    }

    const loadOnScroll = (e) => {
        console.log(e.target.scrollHeight - e.target.offsetHeight,e.target.scrollTop)
        if(e.target.scrollTopMax && e.target.scrollTopMax === parseInt(e.target.scrollTop)){
            loadMedia()
            console.log("end1");
        }
        else if((e.target.scrollHeight - e.target.offsetHeight) <= parseInt(e.target.scrollTop)){
            loadMedia();
            console.log("end2");
        }
    }

    const viewMedia = () =>{
        mediaCont.current.classList.add("active");
        document.querySelector(".back-button").tabIndex = 0;
        document.querySelector("#change-background-button").tabIndex = -1;
        document.querySelector(".media-button").tabIndex = -1;
        document.querySelector(".chat-settings-container .close").tabIndex = -1;
        loadMedia();
    }
    
    const closeMedia = (e) => {
        e.target.tabIndex = -1;
        document.querySelector("#change-background-button").tabIndex = 0;
        document.querySelector(".media-button").tabIndex = 0;
        document.querySelector(".chat-settings-container .close").tabIndex = 0;
        mediaCont.current.classList.remove("active");
    }

    const handleSubmit = () => {

    }

    const handleTextChange = (e, type) => {
        switch(type){
            case "nickname":{
                setName(e.target.value);
                break;
            }
            case "title":{
                break;
            }
            default:{
                break;
            }
        }
    }

    const setActiveButton = () => {
        document.querySelector('.change-users-nickname-container')?.classList.add("active");
    }
    const unsetActiveButton = () => {
        document.querySelector('.change-users-nickname-container')?.classList.remove("active");

    }

    useEffect(()=>{
        getData();
        socket.current = io("https://chatty-deploy-heroku.herokuapp.com/");
        socket.current.on("is-connected",(res)=>{
            // console.log("ressss: ", socket.current.id);
        })
        socket.current.on("delete-message",(res)=>{
            console.log(res);
        })
        console.log("%c chat layout component rendered",'background:red;color,white')
        return ()=>{
            socket.current.disconnect();
            console.log("%c unmount",'background:yellow;')
            setLoadingConv(true);
            setLoading(true);
        }
    },[currentUser])


    useEffect(()=>{
        console.log("getting current convo: ");
        getCurrentConv();
        return()=>{
            setMedia({token:null,img_urls:[]});
        }
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
                       <LinkChat key={idx} item={el} roomID={el.key} setState={setMCount}  />
                    )
                })}
            </div>
            <div className="chat-main-content">
            {
                (chatsList.find(findChatObj))
                ? <Outlet context={[socket,chatID,conversation,setConversation,userData,chatsList.find(findChatObj),prev_room,MCount]} />
                : <div style={{width:"100%"}}>Chat does not exist</div>
            }
            </div>
            {
                (chatsList.find(findChatObj))
                ? <div className="chat-settings-container">
                    <div className="chat-settings-wrapper">
                        <button className='close' onClick={toggleSetting} tabIndex={-1}></button>
                        <DisplayChatProfileImg members_obj={chatsList.find(findChatObj)} user_imgs={userData}/>
                        <div className="chat-name">
                           <DisplayTitle members_obj={chatsList.find(findChatObj)} />
                        </div>
                        <details className="customize-chat">
                            <summary tabIndex={-1}>Customize chat</summary>
                                <div>
                                    <div>
                                        <input ref={change_bg} onChange={handleChangeBG} type="file" accept="image/*" hidden/>
                                        <button id="change-background-button" onClick={clickChangeBG}>Change background img</button>
                                    </div>
                                    { currentChatBG && <div><button onClick={()=>deleteChatData(chatID,currentChatBG,"background_img","img")}>remove img</button></div> } 
                                </div>
                        </details>
                        <div className="change-users-nickname-container">
                            <button className="change-users-nickname-button" tabIndex={-1} onClick={setActiveButton} >Change nickname</button>
                            <form >
                                <input type="text" onChange={(e)=>handleTextChange(e,"nickname")} value={name || currentUser.displayName}/>
                                <button type="button" className="decline" onClick={unsetActiveButton}></button>
                                <button type="submit" className="accept"></button>
                            </form>
                        </div>
                        <button className="media-button" tabIndex={-1} onClick={viewMedia}>Media</button>
                    </div>
                    <div ref={mediaCont} className="media-container">
                        <div className="media-overhead">
                            <button className="back-button" tabIndex={-1} onClick={closeMedia}></button> 
                            <h3>media</h3>
                        </div>

                        <div className="media-wrapper" onScroll={loadOnScroll}>
                            {
                                media.img_urls?.map((url,idx)=>{
                                    return(
                                        <img key={idx} src={url} alt={"no img"} />
                                    )
                                })
                            }
                        </div>

                    </div>
                </div>
                : <></>

            }
        </section>
    )
}



const ChatMediaFiles = ({src,id,callback,list}) => {
    const [progress,setProgress] = useState(0);
    const cancel = useRef(false);
    const controller = new AbortController();

    const config =  {
        signal: controller.signal,
        onDownloadProgress:(e)=>{
            setProgress(parseInt(e.loaded / e.total * 100));
        },
    }

    const getImageData = async (url) => {
        try{
            let res = await axios.post("https://chatty-deploy-heroku.herokuapp.com/findImg",{url:url},config);
            let blob = new Blob([new Uint8Array(res.data.buffer.data)],{type:"image/png"})
            if(!cancel.current){
                callback(prev => {
                    prev[id].blob = blob;
                    return prev;
                })
            }
            console.log(`id: ${id}, res: `,res);
        } catch(err){
            console.log("aborted request",err);
            return
        }
    }

    const handleRemove = async() =>{
        if(progress === 0) controller.abort();
        if(progress < 0) cancel.current = true;
        callback(prev => prev.filter((item,idx)=> idx !== id));
    }

    useEffect(()=>{
        if(src.type !== "file") getImageData(src.url);
        if(src.type === "file") setProgress(100);
        return()=>{
            cancel.current = true;
            setProgress()
        }
    },[])

    return(
        <div className="chat-img-container">
            <div className="remove-butt" onClick={handleRemove}/>
            <div className="progress-bar-container">
                <img src={src.url} alt={src.url} className="chat-img"/>
                <div style={{width:`${progress}%`}} className='progress-bar'/>
            </div>
        </div>
    )
}

export const Chat = () => {
    const [socket,currentRoom,conversation,setConversation,userData,currentChatMembers,prev_room,MCount] = useOutletContext();
    const [message,setMessage] = useState("");
    const enter_key_down = useRef(false);
    const shift_key_down = useRef(false);
    const hidden_butt = useRef();
    const editable_div = useRef();
    const [active,setActive] = useState(false);
    const {currentUser,observeChatBG,currentChatBG,clearChatBG,uploadToStorage,deleteChatData, setLastActive,sendMessage} = UseAuth();
    const [media,setMedia] = useState([]);
    const files_input = useRef();
    const MAX_FILES = 5;

    const manageUploadFiles = async() => { 
        setMedia([]);
        return await Promise.all(media.filter((item,idx)=>item.blob).map(async(src,idx)=>{
            let date = new Date().getTime();
            const url = await uploadToStorage(src.blob,`${currentRoom}/media/${date}`)
            return {text:null,img:url,timeStamp: date, sender: currentUser.uid,type:"media"}     
        }));
    }

    const clearInput = () => {
        editable_div.current.innerText = "";
    }
    
    const handleSubmit = async(event) => {
        event.preventDefault();
        if(!message.trim().length && !media.length) return
        const message_arr = [];
        if(message.trim().length){
            let a = document.createElement("a");
            a.innerHTML = message;
            let polished_message = `${a.innerHTML.replace(/&nbsp;/g," ")}`.trim();
            let message_obj = {text: polished_message, timeStamp: new Date().getTime(), img:null, sender: currentUser.uid,type:'text'};
            message_arr.push(message_obj);
        }
        if(media.length && !media.find((item)=>!item["blob"])){
            let files = await manageUploadFiles();
            message_arr.push(...files);
        }
        const res = await sendMessage(currentRoom,message_arr);
        message_arr.forEach((item,idx)=>{
            item["message_key"] = res[idx];
        })
        setConversation(prev => [...prev,...message_arr]);
        socket.current.emit("sent",currentRoom,message_arr);
        const chat_el = document.querySelector(".chat-wrapper");
        setTimeout(()=>{
            chat_el.scrollTop = chat_el.scrollHeight;
        })
        setMessage("");
        clearInput();
    }
    
    const handleKeyUp = (event) => {
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
            if(message.length || media.length) hidden_butt.current.click();
        }
    }

    
    const handleAlert = () =>{
        const alert = document.querySelector(".alert");
        if(alert.classList.contains("active")) return;
        alert.classList.add("active");
        setTimeout(()=>{
            alert.classList.remove("active");
        },5000 )
    }

    const handleInput = (event) => {
        if(!shift_key_down.current && enter_key_down.current){
            editable_div.current.innerText = "";
            return;
        } 
        let elements = Array.from(event.target.children);
        elements.forEach((el,idx)=>{
            if(el.nodeName === "IMG"){
                if(media.length === MAX_FILES) handleAlert();
                if(media.length !== MAX_FILES) setMedia(old => [...old,{url:el.src,blob:null}]);
                el.remove();
            }
        })
        setMessage(event.target.innerText);
    }

    const click_input_file = () => {
        files_input.current.click();
    }

    const handleFilesChange = () => {
        const remaining_space = MAX_FILES - media.length;
        editable_div.current.focus();
        if(!remaining_space) {
            handleAlert();
            return;
        }
        Array.from(files_input.current.files).forEach((file,idx)=>{
            if(idx < remaining_space) setMedia(prev => [...prev,{url:URL.createObjectURL(file), blob:file,type:"file"}]);
            if(idx === remaining_space) handleAlert();
        })
    }

    const removeMessage = (message) =>{
        let type = message.text ? "text" : "img"
        switch(type){
            case "text": {
                deleteChatData(currentRoom,"",`/messages/${message.message_key}`,type);
                break;
            }
            case "img": {
                deleteChatData(currentRoom,message.img,`/messages/${message.message_key}`,type);
                break;
            }
            default: {
                return;
            }
        }
        socket.current.emit("remove-message",currentRoom,{message_id: message.message_key});
        setConversation(prev=>{
            return prev.filter(item=>{
                return item.message_key !== message.message_key;
            })
        })
    }

    const setLastActiveField = () => {
        setLastActive(currentRoom,currentUser.uid,new Date());
    }

    useEffect(()=>{
        
        if(socket.current){
            socket.current.on("response",(res)=>{
                console.log("chat: ",res);
            })
            socket.current.on("receive-message",(res)=>{
                const chat_el = document.querySelector(".chat-wrapper");
                let at_bottom = false;
                console.log("recieved-message event: ",res);
                console.log(chat_el?.scrollTop , (chat_el?.scrollHeight - Math.ceil(chat_el?.getBoundingClientRect().height))-100)
                if(chat_el?.scrollTop >= (chat_el?.scrollHeight - Math.ceil(chat_el?.getBoundingClientRect().height)) - 100){
                    console.log("is scroll at bottom",);
                    at_bottom = true;
                }
                setConversation(prev => [...prev,...res]);
                if(at_bottom){
                    setTimeout(()=>{
                        console.log("down")
                        chat_el.scrollTop = chat_el.scrollHeight;
                    })
                    at_bottom = false;
                }
            })
            socket.current.on("delete-message",(res)=>{;
                setConversation(prev => prev.filter(message=>message.message_key !== res.message_id))
            })  
        }
        
    },[])    

    useEffect(()=>{
        // console.log("useEffect at Chat component",currentRoom);
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
        onValue(ref(database,`Users/${currentChatMembers.members[0].uid}/active`),(snapshot)=>{
            // console.log(snapshot.val(), currentChatMembers.members[0].uid);
            setActive(snapshot.val());
        })
        window.addEventListener("unload",setLastActiveField)
        return ()=>{
            window.removeEventListener('unload',setLastActiveField)
            setLastActive(currentRoom,currentUser.uid,new Date());
            setActive();
        }
    },[currentRoom])

    if(!currentRoom) return<></>
    
    return(
        <div className="chat-container">
            <div className="chat-overhead">
                <div className="chat-overhead-prof">
                    <DisplayChatProfileImg members_obj={currentChatMembers} user_imgs={userData} overhead={true} />
                    <h1 className="chat-overhead-title">
                        <DisplayTitle members_obj={currentChatMembers} />
                    </h1>
                    <div className={(active) ? "active" : "inactive"}></div>
                </div>
                <button className="dot-container" onClick={toggleSetting}>
                    <div className="dot"></div>
                    <div className="dot"></div>
                    <div className="dot"></div>
                </button>
            </div>
            <div className="chat-bg" style={{display:"flex",flexDirection:"column",overflow:"hidden"}}>
                <section className="conv-container">
                    { 
                        (conversation.length) 
                        ? <Conversation chatID={currentRoom} uid={currentUser.uid} conversation={conversation} userData={userData} deleteFunc={removeMessage} MCount={MCount}/> 
                        : <></>
                    }
                </section>
                <section className="chat-input-section">
                    <button className='chat-input-files' onClick={click_input_file}>
                        <div className='alert'>{`max: ${MAX_FILES} files`}</div>
                    </button>
                    <input ref={files_input} type="file" accept='image/*' onChange={handleFilesChange} multiple hidden/>  
                    <form id="message-form" className="chat-input-container" onSubmit={handleSubmit}>
                        <div style={(!media.length)?{display:"none"}:{}} className="chat-imgs-container">
                            {media.map((url,idx)=>{
                                return(
                                    <React.Fragment key={idx}>
                                        <ChatMediaFiles src={url} id={idx} callback={setMedia} list={media} deleteMessage={deleteChatData}/>
                                    </React.Fragment>
                                )
                            })}
                        </div>
                        <div className="chat-input-wrapper">
                            <div ref={editable_div} contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} value={message} className="chat-input">
                            </div>
                            {
                                (message.length)
                                ?<></>
                                : <div className="chat-input-placeholder">Message...</div>
                            }
                        </div>
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

const DisplayMessageContent = ({content}) => {
    const handleLinks = (str) => {
        if(!str) return;
        let split_str = str;
        let new_str = [];
    
        /* a way to determine if the text has non-breaking space(&nbsp;)
        &nbsp; only renders in html cant be detected in text
        so we examine innerHTML to search for &nbsp;*/
        let a = document.createElement("a");
        a.innerHTML = split_str;
        if(a.innerHTML.match(/&nbsp;/)) split_str = `${a.innerHTML.replace(/&nbsp;/g," ")}`;
        do{
            let match_idx = split_str.search(/https:\/\//);
            if(match_idx > 0){
                new_str.push(split_str.substring( 0,match_idx));
                split_str = split_str.substring(match_idx);
            }
            else if(match_idx === 0){
                let whitespace_idx = split_str.search(" ");
                let url = (whitespace_idx !== -1) ? split_str.substring(0,whitespace_idx) : split_str.substring(0);
                new_str.push(<a className="hyperlink" tabIndex={-1} target="_blank" rel="noreferrer" href={url}>{`${url}`}</a>);                
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
        })
    }

    if(content.text) return(
        <div className="message-wrapper">
                <p className="message-text">
                    {handleLinks(content?.text.trim())}
                    <span className="message-time"><sub className="time-value">{displayTime(content.timeStamp)}</sub></span>
                </p>
        </div>
    )
    if(content.img) return(
        <div className="message-wrapper img">
            <div className="message-img-wrapper loading">
                <img onLoad={isComplete} onClick={(e)=>{e.target.parentNode.parentNode.classList.add("active")}} className="message-img" src={content.img} alt={content.img} />
                <span className="message-time"><span className="time-value">{displayTime(content.timeStamp)}</span></span>
            </div>
            <div className="img-modal">
                <div className="img-modal-background" onClick={(e)=>{e.target.parentNode.parentNode.classList.remove("active")}}></div>
                <div className="img-modal-wrapper">
                    <img src={content.img} alt={content.img}/>
                    <a href={content.img} target="_blank">
                        open original
                    </a>
                </div>
                <div className="img-modal-close" onClick={(e)=>{e.target.parentNode.parentNode.classList.remove("active")}}></div>
            </div>
        </div>
    )
}



const Conversation = React.memo(({chatID,uid,conversation,userData, deleteFunc,MCount}) =>{
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

    const handleMouseLeave = (e) => {
        const message_option = e.target
        window.onclick = (e)=>{
            if(message_option.classList.contains("active")) message_option.classList.remove("active");
            window.onclick = null;
        }
    }

    useEffect(()=>{
        const jump_butt = document?.querySelector(".jump-down-button");
        let scroll_timer = -1;
        document?.querySelector(".chat-wrapper")?.addEventListener('scroll',e=>{
            // console.log("helloor ; ",e.target.scrollTopMax)
            // console.log("e.target.scrollTopMax: ",e.target.scrollTopMax," e.target.offsetHeight: ",e.target.offsetHeight," e.target.scrollHeight: ",e.target.scrollHeight," e.target.scrollTop: ",parseInt(e.target.scrollTop)," e.target.scrollHeight - e.target.offsetHeight: ",e.target.scrollHeight - e.target.offsetHeight,e.target.scrollHeight - e.target.offsetHeight === e.target.scrollTop);
            if(e.target.scrollTopMax && e.target.scrollTopMax === parseInt(e.target.scrollTop)){
                jump_butt?.classList.remove("active");
            }
            else if((e.target.scrollHeight - e.target.offsetHeight) <= parseInt(e.target.scrollTop)){
                jump_butt?.classList.remove("active");
            }
            else if(!jump_butt?.classList.contains("active") && (e.target.scrollHeight - e.target.offsetHeight) >= parseInt(e.target.scrollTop)){
                jump_butt?.classList.add("active");
            }
            if(scroll_timer !== -1) {
                clearTimeout(scroll_timer);
            }
            scroll_timer = setTimeout(()=>{jump_butt?.classList.remove("active");},1000)
        })
    },[])
    
    const handleOptionClick= (e) => {
        // e.stopPropagation();
        window.onclick = null;
        e.target?.classList.toggle("active");
        let active = e.target.classList.contains("active");
        if(active){
            e.target.addEventListener('mouseleave',handleMouseLeave,{once:true});
        }
        else if(!active){
            e.target.removeEventListener('mouseleave',handleMouseLeave);
        }
    }

    const handleCopy = (message) => {
        navigator.clipboard.writeText(message.text || message.img).then(()=>{
            alert(`copied the text: ${message.text || message.img}` )
        })
    }

    const handleRemove = (e,item) => {
        document.querySelector(".dot-container.active").classList.remove("active");
        deleteFunc(item)
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
    },[chatID])
    
    return(
            <div className="chat-wrapper">
                <div id="jump-down-button-container">    
                    <div className="jump-down-button" onClick={handleJump}>
                        <img src={jump_down_icon} alt="jumpdownicon.svg"/>
                    </div>
                </div>
                {conversation?.map((item,idx)=>{
                    let date = new Date(item.timeStamp);
                    let today;
                    let Y = date.getFullYear();
                    let M = date.getMonth();
                    let D = date.getDate();
                    let display_time = false;
                    let display_name = false;
                    let display_new_notification = false;
                    if( !idx || date.getFullYear() !== prev_date.current["year"] || date.getMonth() !== prev_date.current["month"] || date.getDate() !== prev_date.current["day"] ){
                        prev_date.current["year"] = Y;
                        prev_date.current["month"] = M; 
                        prev_date.current["day"] = D;
                        display_time = true;
                        let d = new Date();
                        if(Y === d.getFullYear() && M === d.getMonth() && D === d.getDate()) today = "Today";
                    }
                    if(display_time || prev_display_name.current !== item.sender){
                        display_name = true
                    } 
                    prev_display_name.current = item.sender;
                    if(MCount?.[`${chatID}`]?.new_messages_count && ((conversation.length-1) - (MCount[`${chatID}`].new_messages_count-1)) === idx){
                        display_new_notification = true;
                    }
                    
                    return(
                        <React.Fragment key={idx}>
                            {
                                (display_time)
                                ? <div className="display-date" >{today || `${weekday[date.getDay()]}, ${month[M]} ${D}, ${Y}`}</div>
                                : <></>
                            }
                            {
                                (display_new_notification)
                                ? <div  className="display-new-notification">New message(s)</div>
                                : <></>
                            }
                            <React.Fragment>
                            <div  className={`message-container  ${ item.sender === uid ? `user` : `` }`}>
                                <div className={`message-content ${(!display_name)? "no-prof-img" : ""}`}>
                                    {
                                        (display_name)
                                            ?<h3 className="message-sender">{userData[item.sender]["name"]}</h3>
                                            :<></>
                                    }
                                    <div style={{display:"flex",flexWrap:"nowrap",flexDirection:(item.sender === uid) ? "row" : "row-reverse"}}>
                                        <div className='dot-container'  onClick={handleOptionClick} >
                                            <div className="dot"></div>
                                            <div className="dot"></div>
                                            <div className="dot"></div>
                                            <div  className="message-options" onClick={(e)=>e.stopPropagation()}>
                                                {
                                                    (item.sender === uid) &&
                                                    <div className="delete-container" onClick={(e)=>{handleRemove(e,item)}}>
                                                        <div className="delete-icon"/>
                                                        <span>delete</span>
                                                    </div>
                                                }
                                                <div className="copy-message" onClick={()=>handleCopy(item)}>copy</div>
                                            </div>
                                        </div>
                                        <DisplayMessageContent content={item}/>
                                    </div>

                                </div>
                                <ProfileImg display={display_name} img_type={userData[item.sender]}/>
                            </div>
                            </React.Fragment>
                        </React.Fragment>
                    )
                })}
            </div>
    )
},(prevProps,nextProps) =>{
    // console.log("prev: ",prevProps.conversation.length !== nextProps.conversation.length );
    if(prevProps.conversation.length === nextProps.conversation.length){
        return true;
    }
    return false;
})


