import React,{useState} from 'react';
import './friendButton.css';

export const FriendButton = ({type,callback}) => {
    switch(type){
        case "pending": {
            return
        }
        case "friend": {
            return <span className={`friend-request-butt friend`} >friend</span>
        }
        default: {
            return <button onClick={callback} className={`friend-request-butt `} >send request</button>
        }
    }

}