import React, { useEffect, useRef, useState } from 'react';
import './home.css';
import { UseAuth } from '../../utility/useContextAuth';
import downloadImg, {legitYTV} from '../../utility/downloadImg';
import axios from 'axios';
import { v4 } from 'uuid';

export const Home = () => {
    const downloaded_img = useRef();
    const url_butt = useRef();
    const { currentUser, uploadToStorage } = UseAuth();
    const [imgAddress,setImgAddress] = useState("");

    const handleClick = () => {
        const text = document.querySelector(".asd");
        navigator.clipboard.writeText(text.value).then(()=>{
            alert(`copied the text: ${text.value}` )
        })
        console.log("copy was " + text.value)

    }

    const config = {
        onDownloadProgress: (e)=>{
            console.log(e);
        }
    }

    const test = async(e) => {
        e.preventDefault();
        let t = await axios.post("http://localhost:3001/findImg",{url:imgAddress},config);
        let b = new Blob([new Uint8Array(t.data.buffer.data)],{type:"image/jpg"});
        let url = await uploadToStorage(b).then(blob=>{
            setImgAddress("");
            return blob;
        })
        let img = new Image();
        // img.src = URL.createObjectURL(b);
        img.src = url;
        document.querySelector("#cont").appendChild(img);
        console.log(t);
        
    }

    const generateUUID = ()=>{
        let uuid = v4();
        console.log("uuid: ", v4());
    }

    useEffect( async ()=>{   
        // const res = await axios.get("https://i.ytimg.com/vi/4HwX-1C14CA/hqdefault.jpg",{
        //     responseType:"arraybuffer",
        // })
        // console.log(res);     
        // const res = await axios.get("https://pbs.twimg.com/media/FK3zlxHXsAI_zP0?format=jpg&name=medium",{
        //     responseType:"arraybuffer",
        // })
        // console.log(res);     
        // let http = new XMLHttpRequest()
        // http.open('HEAD',"https://pbs.twimg.com/media/EZ0AkWUcAEytSU?format=jpg&name=large", false);
        // http.send();
        // console.log(http.status);
        // let test = await axios.post("http://localhost:3001/findImg",{url:"https://pbs.twimg.com/media/EZ0AkWUcAEytSU?format=jpg&name=large"})
        // console.log(test);
        // legitYTV();
        // downloadImg("https://i.ytimg.com/vi/EZ0AkWUcAEytSU/maxresdefault.jpg")
        let empty = [1,2,3,4,5];
        let arr = [];
        arr.push( empty);
        console.log("arr: ", arr)
    },[])

 
    return(
        <section className="Home-container">
            <h1>HOME PAGE</h1>
            <h3>WELCOME {currentUser?.displayName}</h3>
            <button onClick={generateUUID}>gen uuid</button>
            <form onSubmit={test}>
                <input width={"100vw"} type="url" onChange={(e)=>{setImgAddress(e.target.value)}} value={imgAddress} placeholder="url"/>
                <input ref={url_butt} type="submit" value="Submit" hidden/>
            </form>
            <button onClick={()=>{url_butt.current.click()}} >submit</button>
            <button onClick={handleClick} >copy</button>
            <textarea className='asd' defaultValue={"qwyetgqheiqweo"}/>
            <div id="cont"></div>

            {/* <img onLoad={(e)=>{console.log("loaded")}} onError={(e)=>{console.log("error")}} src="https://pbs.twimg.com/media/EZ0OAkWcAEytSU?format=jpg&name=large" alt="" style={{width:"100px",height:"100px",objectFit:"cover"}} /> */}
        </section>
    );
}

export default Home;