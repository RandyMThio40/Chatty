import React from 'react';
import { Navigate ,useParams } from 'react-router';
import { UseAuth } from './useContextAuth';
import { NotFound } from '../pages/notFound/NotFound';
import { Outlet } from 'react-router-dom';

export const ProtectedRoute = ({children}) => {
    const id = useParams().id;
    const {currentUser} = UseAuth();
    if(!currentUser) return <Navigate to="/" replace={true}/>
    if(currentUser?.uid !== id) return <NotFound/>
    return <>{children}<Outlet/></>
}

export default ProtectedRoute;