import React,{useState,useEffect} from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import { useOutletContext,useParams } from 'react-router-dom';
import './MediaView.css';

export const MediaView = () => {
    const {getMedia} = UseAuth();
    const {imgID} = useParams();
    const [something,media] = useOutletContext();

    useEffect(()=>{
        console.log("In MediaView:", something,media)
        console.log("In MediaView/imgID:", imgID)
    },[media])

    return(
        <section className="media-view-container">
            img
        </section>
    );
}

export default MediaView