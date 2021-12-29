import React,{useState,useEffect,useRef} from'react';
import './Chat.css';

export const Chat = () => {
    const [conversation,setConversation] = useState([]);
    const [message,setMessage] = useState("");
    const enter_key_down = useRef(false);
    const shift_key_down = useRef(false);
    const hidden_butt = useRef();
    const socket = useRef();


    const FORM_TYPE = {
        MESSAGE:"message",
        IMAGE:"image",
        VIDEO:"video"
    }

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log("submit: ",message);
        setMessage("");
        
    }
    
    const handleKeyUp = (event) => {
        console.log(event.key," shiftkey: ",shift_key_down.current, " enterkey: ",enter_key_down.current)
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

    const handleInput = (event) => {
        if( !message.length && !shift_key_down.current && enter_key_down.current){
            const editable_div = document.querySelector(".chat-text-message");
            editable_div.innerText = "";
            return;
        } 
        setMessage(event.target.innerText);
    }

    useEffect(()=>{
        
    },[])


   
    
    return(
        <div className="chat-container">
            <section className="chat-wrapper">
                
            </section>
            <section className="chat-input-section">
                <form  className="chat-input-container" onSubmit={handleSubmit}>
                    <div contentEditable suppressContentEditableWarning onInput={handleInput} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} className="chat-text-message">
                    </div>
                    <div className="chat-input-placeholder" style={message.length ? {display:"none"} : {}}>Message...</div>
                
                    <input ref={hidden_butt} type="submit" value="submit" hidden/>
                </form>
            </section>
            <pre className="text">
                {message}
            </pre>

        </div>
    );
}

export default Chat;