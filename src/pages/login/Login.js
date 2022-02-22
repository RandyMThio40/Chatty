import React,{useState} from 'react';
import { UseAuth } from '../../utility/useContextAuth';
import { useNavigate } from 'react-router';
import './Login.css';
import {Link} from 'react-router-dom';


export const Login = () => {
    const {signin} = UseAuth();
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const navigate = useNavigate();

    const FORM_TYPE = {
        EMAIL:"email",
        PASS:"password"
    }

    const handleChanges = (e,type) =>{
        e.preventDefault();
        switch(type){
            case FORM_TYPE.EMAIL:{
                setEmail(e.target.value);
                break;
            }
            case FORM_TYPE.PASS:{
                setPassword(e.target.value);
                break;
            }
            default:{
                break;
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();

        signin(email,password).then((res)=>{
            console.log(res);
            setEmail("");
            setPassword("");
            navigate(`/${res?.user?.uid}/Home`,{replace:true});
        }).catch((error)=>{
            console.log(error)
        })

    }

    return(
       <section className="login-landing">
            <div className="login-container">
                <h2>Login</h2>
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className={`auth-field-container ${email ? `active` : ``}`}>
                        <label className="placeholder" htmlFor="email">Email</label>
                        <input type="email" name="email" onChange={(e)=>handleChanges(e,FORM_TYPE.EMAIL)} autoComplete="true" />
                    </div>
                    <div className={`auth-field-container ${password ? `active` : ``}`}>
                        <label className="placeholder" htmlFor="email">Password</label>
                        <input type="password" name="password" onChange={(e)=>handleChanges(e,FORM_TYPE.PASS)} autoComplete="true"/>
                    </div>
                    <input type="submit" value="Sign in" />
                </form>  
                <p className="signup-link">
                    Don't have an account? <Link to="/">Sign up</Link>
                </p>
            </div>
       </section>
    )
}

export default Login;