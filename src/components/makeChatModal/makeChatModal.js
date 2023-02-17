import React, {useState, useEffect, useRef} from 'react';
import { equalTo } from 'firebase/database';
import { UseAuth } from '../../utility/useContextAuth';
import backArrow from '../../imgs/back-arrow.svg';
import './makeChatModal.css';
import { useNavigate } from 'react-router-dom';

const ListFriends = React.memo(({query,friendsList , participantsList,addParticapant,removeParticipant,participantKeys}) => {
    return(
        <>     
            <div className="participants-wrapper">
                { participantKeys?.map((participant_uid,idx)=>{  
                    console.log(participantsList[participant_uid],participant_uid,participantsList)
                        return(
                            <div key={idx} className="participant-preview">
                                <div className="participant-profile">
                                    {
                                        (participantsList[participant_uid]?.profile?.img_url)
                                        ? <img src={participantsList[participant_uid].profile.img_url} />
                                        : <div className='alt-pic'><span>{participantsList[participant_uid].profile.name[0]}</span></div>
                                    }
                                    <button type="button" className="remove-participant" onClick={()=>removeParticipant(participant_uid)}></button>
                                </div>
                                <h6>{participantsList[participant_uid].profile.name}</h6>
                            </div>
                        )
                })}
            </div>
            <div className='form-wrapper'>
                { friendsList?.map((friend,idx)=>{
                        if(participantsList[friend.uid] !== undefined ) return null
                        if(query && !friend.profile.name.match( new RegExp(query))) return null
                        return(
                            <button type="button" className="option-container" onClick={()=>addParticapant(friend)} key={idx}>
                                {
                                    (friend.profile.img_url)
                                    ? <img className="profile-pic" src={friend.profile.img_url} alt="profile-pic.png"/>
                                    : <div className='alt-pic'><span>{friend.profile.name[0]}</span></div>
                                }
                                <div className="option-wrapper">
                                    <label>{friend.profile.name}</label>
                                </div>
                            </button>
                        )
                })}
            </div>
        </>
    );
},(prevProps,nextProps)=>{
    if(prevProps.query !== nextProps.query || prevProps.participantKeys.length != nextProps.participantKeys.length  ) return false;
    return true;
})

const SelectParticapantsForm = ({loading,friends,formObj,nextStep}) => {

    const getParticipants = () => {
        return formObj.current?.["groupMembers"]
    }

    const getKeys = () => {
        if(formObj.current["groupMembers"]) return Object.keys(formObj.current["groupMembers"])
        return undefined
    }

    const [participantKeys,setParticipantKeys] = useState(getKeys() || []);
    const [participants,setParticipants] = useState(getParticipants() || {});

    const [query,setQuery] = useState("");
    const timeout_var = useRef();

    const hasEnoughParticapants = () => {
        if(participantKeys.length >= 2) return true;
        return false;

    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if(!hasEnoughParticapants()) return
        formObj.current["groupMembers"] = participants;
        nextStep();
    }

    const removeParticipant = (uid) => {
        setParticipantKeys(prev=>{
            return prev.filter((item,idx)=>item!==uid)
        })
        setParticipants(prev=>{
            delete prev[uid]
            return {...prev};
        })
    }

    const addParticapant = (friend) => {
        if(participants[friend.uid]) return;
        setParticipantKeys(prev=>{
            return [...prev,friend.uid]
        })
        setParticipants(prev => {
            prev[friend.uid] = friend;
            return {...prev};
        })
    }

    const handleQueryInput = (e) => {
        if(timeout_var.current) clearTimeout(timeout_var.current);
        timeout_var.current = setTimeout(()=>{
            setQuery(e.target.value);
        },500)
    }

    return(
        <form id="participants-form" onSubmit={handleSubmit} >      

            <h1 className="make-group-chat-header1">Create new group</h1>
            <h5 className="make-group-chat-header5">Select participants</h5>
            <input id="query" type="text" name='query' placeholder='Search User...' onChange={handleQueryInput}/>
            {   
                (loading)
                ? <>loading</> 
                : <>
                    <ListFriends query={query} friendsList={friends} participantsList={participants} participantKeys={participantKeys} addParticapant={addParticapant} removeParticipant={removeParticipant} />
                    <input type="submit" value="Next" disabled={(hasEnoughParticapants()) ? false : true}/>
                  </>
            }
        </form>
    );
}

const NamingGroupChat = ({formObj,prevStep,createGroupChat}) => {
    const {currentUser} = UseAuth();
    const [title,setTitle] = useState(formObj.current["title"] || "");
    const [hasTitle,setHasTitle] = useState(false);
    const [error,setError] = useState("")
    const [loading,setLoading] = useState(false);

    const handleSubmit = async(e) => {
        e.preventDefault();
        setLoading(true);
        const groupMembers = {
            ...formObj.current["groupMembers"],
        }
        groupMembers[`${currentUser.uid}`] = {
            uid:currentUser.uid,
            profile:{
                name:currentUser.displayName
            }
        }
        const status = await createGroupChat(title,groupMembers);
        if(status === 400) {
            setError("There was an error making the group chat. please try again.")
        };
        setLoading(false);

        
    }
    
    const handleChange = (e) => {
        setTitle(e.target.value);
    }
    
    const handleBack = () => {
        formObj.current["title"] = title;
        prevStep();
    }

    if(loading) return(
        <div className="loading">
            <h1>Creating group chat...</h1>
        </div>
    )

    return(
        <form id="title-form" onSubmit={handleSubmit}>
            <div className="make-group-chat-header-container">
                <button type="button" id="back-button" onClick={handleBack}>
                    <img src={backArrow} alt="back-arrow.svg"/>
                </button>
                <h1 className='make-group-chat-header1'>Create new group</h1>
            </div>
            <h5 className='make-group-chat-header5'>Name the group chat</h5>
            {hasTitle && <aside><b>Important:</b> Enter Title</aside>}
            <input id="title" name="title" type="text" onChange={handleChange} value={title} placeholder="Title..." required/>
            <input type="submit" value="Submit"/>
        </form>
    );
}

const MultiStepForm = () => {
    const [step,setStep] = useState(1);    
    const {currentUser,getFriendsList,createGroupChat} = UseAuth();
    const [loading,setLoading] = useState(true);
    const [friends,setFriends] = useState([]);
    const formObj = useRef({});
    
    const nextStep = () => {
        setStep(prev=>(prev + 1))
    }
    const prevStep = () => {
        setStep(prev=>(prev - 1))
    }

    useEffect(()=>{
        console.log("mounted");
        const getData = async ()=> {
            try{
                const friends_profile = await getFriendsList(currentUser.uid);
                console.log(friends_profile)
                setFriends(friends_profile);
                setLoading(false);
            }
            catch(err){
                console.log(err);
            }
        } 
        getData();
        return ()=>{
            console.log("unmounted")
        }
    },[])

    if(step === 2) return <NamingGroupChat formObj={formObj} prevStep={prevStep} createGroupChat={createGroupChat}/>;
    return <SelectParticapantsForm friends={friends} loading={loading} formObj={formObj} nextStep={nextStep} />

}


export const MakeChatModal = ({cb}) => {
    const container = useRef();
    const [query,setQuery] = useState("");
    const timeout_var = useRef();
    const navigate = useNavigate();

    const handleClose = () => {
        if(cb) {
            cb(false);
            return;
        }

        navigate(-1)
    }

    const handleQueryInput = (e) => {
        if(timeout_var.current) clearTimeout(timeout_var.current);
        timeout_var.current = setTimeout(()=>{
            setQuery(e.target.value);
        },500)
    }

    
    return(
        <section ref={container} className="make-chat-modal-container">
            <div className="modal-bg"/>
            <button onClick={handleClose} id="close-icon"></button>
            <main className="make-chat-content">
                <MultiStepForm/>
            </main>
        </section>
    );
}

export default MakeChatModal;