import React from 'react';
import './SignUp.css'
import { UseAuth } from '../../utility/useContextAuth.js'
import { Navigate, useNavigate, Link } from 'react-router-dom';

const SignUp = () => {
    const [concealed,setConcealed] = React.useState(true); 
    const [email,setEmail] = React.useState("");
    const [password,setPassword] = React.useState("");
    const [confirmPass,setConfirmPass] = React.useState("");
    const {currentUser, signup } = UseAuth();
    const navigate = useNavigate();
    const FORM_TYPE = {
        EMAIL:"email",
        PASSWORD:"password",
        CONFIRMATION:"confirmation"
    }


    const handleSubmit =  (e) => {
        e.preventDefault()
        console.log(password,email,concealed);
        
        if(password === confirmPass){
            signup(email,password).then((userCredential) => {
                console.log("userCreds: ",userCredential);
                navigate(`/${userCredential.user.uid}/Home`,{replace:true});
            }).catch((error=>{
                const error_code = error.code;
                const error_mess = error.message;
                console.log("error_code: ", error_code, " error_mess: ", error_mess)
            }))
        }
    }


    const handleChanges = (event,type) => {
        event.preventDefault();

        switch(type){
            case FORM_TYPE.EMAIL: {
                setEmail(event.target.value);
                break;
            }
            case FORM_TYPE.PASSWORD: {
                setPassword(event.target.value);
                break;
            }
            case FORM_TYPE.CONFIRMATION: {
                setConfirmPass(event.target.value);
                break;
            }
            default: {
                break;
            }
        }

    }

    if(currentUser) return <Navigate to={`/${currentUser.uid}/Home`} replace={true}/>
    
    return(
        <div className="signup-container">
            <div className="auth-container">
                <form className="auth-form" id="signup_form"  onSubmit={(e)=>handleSubmit(e)}>
                    <div className="auth-field-container">
                        <label htmlFor="email">Email: </label>
                        <input type="email" id="user_email" name="email" placeholder="email" onChange={(e)=>handleChanges(e,FORM_TYPE.EMAIL)} value={email} autoComplete="true" required/>
                    </div>
                    <div className="auth-field-container">
                        <label htmlFor="password">Password: </label>
                        <input type={`${concealed ? "password" : "text"}`} id="password" name="password" placeholder="password" onChange={(e)=>handleChanges(e,FORM_TYPE.PASSWORD)} value={password} autoComplete="true" required/>
                        <span><button htmlFor="not" type="button" className="concealing-eye" onClick={(e)=>{
                            e.preventDefault();
                            e.target?.classList?.toggle("active");
                            setConcealed(!concealed);
                        }}></button></span>
                    </div>
                    <div className="auth-field-container">
                        <label>Confirm Password: </label>
                        <input type="password" placeholder="password" onChange={(e)=>handleChanges(e,FORM_TYPE.CONFIRMATION)} value={confirmPass}  autoComplete="true"/> <br/>
                        <p id="signup-pass-error"><sup>*</sup>passwords don't match</p>
                    </div>
                    <input type="submit" value="Submit"></input>
                    
                </form>
                <hr/>
                <div className="">
                   <span> already have an account? <Link to="/Login" >Login</Link></span>
                </div>
            </div>

        </div>
    )
}

export default SignUp