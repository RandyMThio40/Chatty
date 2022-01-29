import {useState,useContext,createContext, useEffect} from 'react'

const ChatContext = createContext();

export const UseChatContext = () => {
    return useContext(ChatContext);
}

export const ChatProvider = ({children}) => {
    const [conv,setConv] = useState();
    const [loading,setLoading] = useState();
    


    const value = {}
    useEffect(()=>{
       
        console.log("%c chat context rendered",'background:white;color:red')
    },[])

    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}

export default ChatProvider;