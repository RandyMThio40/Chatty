import React from 'react';
import './SignUp.css'
import { UseAuth } from '../../utility/useContextAuth.js'
import { Navigate, useNavigate, Link, Outlet } from 'react-router-dom';


export const AuthLayout = () => {

    const style = {
        position:"absolute",
        top:0,
        left:0,
        fontSize:"1.2rem",
        zIndex:1,
    }

    return(
        <React.Fragment>
            <div className="App-title" >chatty</div>
            <Outlet/>
        </React.Fragment>
    )
}


const SignUp = () => {
    const [concealed,setConcealed] = React.useState(true); 
    const [concealed2,setConcealed2] = React.useState(true); 
    const [firstName,setFirstName] = React.useState("");
    const [lastName,setLastName] = React.useState("");
    const [email,setEmail] = React.useState("");
    const [passwordStrength,setPasswordStrength] = React.useState("");
    const [password,setPassword] = React.useState("");
    const [confirmPass,setConfirmPass] = React.useState("");
    const {currentUser, signup, updateDisplayName,setActiveUser } = UseAuth();
    const [error,setError] = React.useState([]);
    const [emailError,setEmailError] = React.useState("");
    const [isMatch,setIsMatch] = React.useState(false);
    const navigate = useNavigate();
    const FORM_TYPE = {
        EMAIL:"email",
        PASSWORD:"password",
        CONFIRMATION:"confirmation",
        FIRSTNAME:"firstName",
        LASTNAME:"lastName",
    }
    const lowercase_alphabet = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z'];
    const uppercase_alphabet = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    let special_chars = ['/','\\','[',']','#','@','!','$','%','^','&','*','(',')','_','-','+','=',',','.','<','>','?',':',';',"\"",'\'',`\``,'~','|'];

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(password !== confirmPass) {
            setIsMatch(true);
            return;
        }
        let password_strength = 100;
        let error_messages = [];

        let sc,lc,uc,ws,n;
        password.split("").forEach((letter)=>{
            (!sc) && (sc = special_chars.includes(letter));
            (!lc) && (lc = lowercase_alphabet.includes(letter));
            (!uc) && (uc = uppercase_alphabet.includes(letter));
            (!ws) && (ws = letter === " ");
            (!n) && (n = !isNaN(letter));
        })

        // let has_special_char = password.split("").some((letter)=>special_chars.includes(letter));
        // let has_uppercase = password.split("").some((letter)=>uppercase_alphabet.includes(letter));
        // let has_lowercase = password.split("").some((letter)=>lowercase_alphabet.includes(letter));
        // let has_white_space = password.split("").some((letter)=>letter === " ");
        // let has_numbers = password.split("").some((letter)=>!isNaN(letter));
        // console.log("has_special_char: ",has_special_char, " has_uppercase: ",has_uppercase," has_lowercase: ",has_lowercase, " has_white_space: ",has_white_space, " has_numbers: ", has_numbers);

        if(!sc){
            password_strength -= 25;
            error_messages.push("special characters, e.g., @,#,!,$,%.");
        }
        if(!lc) {
            password_strength -= 10;
            error_messages.push("lowercase characters");
        }
        if(!uc) {
            password_strength -= 10;
            error_messages.push("uppercase characters");
        }
        if(!ws) {
            password_strength -= 10;
            error_messages.push("white space");
        }
        if(!n) {
            password_strength -= 15;
            error_messages.push("numbers");
        }
        if(password.length < 7){
            password_strength -= 25;
            error_messages.push("a longer password (required)");
        }

        // if(password_strength >= 70){
        //     setPasswordStrength("strong");
        // }
        // if(password_strength < 70 && password_strength >= 35){
        //     setPasswordStrength("moderate");
        // }
        if(password_strength < 35) {
            setPasswordStrength("weak");
            setError(error_messages);
            return;
        }

        let res = await signup(email,password).then((userCredential) => {
            console.log("userCreds: ",userCredential.user);
            updateDisplayName(userCredential.user,`${firstName} ${lastName}`).then(()=>setActiveUser(userCredential.user.uid)).then(()=>{
                navigate(`/${userCredential.user.uid}/Home`,{replace:true});
            });
        }).catch((error=>{
            const error_code = error.code;
            const error_mess = error.message;
            console.log("error_code: ", error_code, " error_mess: ", error_mess);
            return 1;
        }))
        if(res) {setEmailError("email already in use")}
        else {setEmailError("")}
        console.log(error_messages,password);
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
            case FORM_TYPE.LASTNAME: {
                setLastName(event.target.value);
                break;
            }
            case FORM_TYPE.FIRSTNAME: {
                setFirstName(event.target.value);
                break;
            }
            default: {
                break;
            }
        }
    }

    React.useEffect(()=>{
        return()=>{
            setEmailError();
            setError();
            setPasswordStrength();
        }
    },[])

    if(currentUser) return <Navigate to={`/${currentUser.uid}/Home`} replace={true}/>
    
    return(
        <div className="signup-container">
            <div className="auth-container">
                <h2>Sign up</h2>
                <form className="auth-form" id="signup_form"  onSubmit={(e)=>handleSubmit(e)}>
                    <div style={emailError?.length ? {} : {display:"none"}} className="auth-error-container" >
                        {emailError}
                    </div>
                    <div className="name-field-container">
                        <div className={`auth-field-container ${(firstName) ? `active` : ``}`}>
                            <label className="placeholder" htmlFor="FirstName">First</label>
                            <input type="text" id="first_name" name="FirstName"  onChange={(e)=>handleChanges(e,FORM_TYPE.FIRSTNAME)} value={firstName} autoComplete="true" required/>
                        </div>
                        <div className={`auth-field-container ${(lastName) ? `active` : ``}`}>
                            <label className="placeholder"  htmlFor="LastName">Last</label>
                            <input type="text" id="last_name" name="LastName"  onChange={(e)=>handleChanges(e,FORM_TYPE.LASTNAME)} value={lastName} autoComplete="true" required/>
                        </div>
                    </div>
                    <div className={`auth-field-container ${(email) ? `active` : ``}`}>
                        <label className="placeholder"  htmlFor="email">Email</label>
                        <input type="email" id="user_email" name="email"  onChange={(e)=>handleChanges(e,FORM_TYPE.EMAIL)} value={email} autoComplete="true" required/>
                    </div>
                    <div className="password-field-container">
                        <div className={`auth-field-container ${(password) ? `active` : ``}`}>
                            <label className="placeholder" htmlFor="password">Password</label>
                            <input type={`${concealed ? "password" : "text"}`} id="password" name="password"  onChange={(e)=>handleChanges(e,FORM_TYPE.PASSWORD)} value={password} autoComplete="true" required/>
                        </div>
                        <span><button htmlFor="not" type="button" className="concealing-eye" onClick={(e)=>{
                            e.preventDefault();
                            e.target?.classList?.toggle("active");
                            setConcealed(!concealed);
                        }}></button></span>
                    </div>
                    <div style={(!isMatch) ? {display:"none"} : null} className="auth-error-container">
                        passwords don't match!
                    </div>
                    <div className="password-field-container">
                        <div className={`auth-field-container ${(confirmPass) ? `active` : ``}`}>
                            <label className="placeholder" htmlFor="confirm-password" >Confirm password</label>
                            <input type={concealed2 ? "password" : "text"} name="confirm-password"  onChange={(e)=>handleChanges(e,FORM_TYPE.CONFIRMATION)} value={confirmPass}  autoComplete="true" required/>
                        </div>
                        <span><button htmlFor="not" type="button" className="concealing-eye" onClick={(e)=>{
                                e.preventDefault();
                                e.target?.classList?.toggle("active");
                                setConcealed2(!concealed2);
                            }}></button></span>
                    </div>
                    <ul style={(error?.length) ? {} :{display:"none"}} className="auth-error-container">
                        Your password is {passwordStrength}, add:
                        {error?.map((message,index) => {
                            return(
                                <li key={`error-${index}`}>{message}</li>
                            )
                        })}
                    </ul>
                    <input type="submit" value="Sign Up"></input>
                </form>
                <hr/>
                <span> already have an account? <button className="button-link" onClick={()=>{navigate("Login")}}>Login</button></span>
            </div>
            <div className="growing">

            </div>
        </div>
    )
}

export default SignUp