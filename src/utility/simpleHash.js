export const HashString = (stringValue,iterations=10) => {
    if(typeof stringValue === "string"){
        return stringValue.split("").reduce((acc,val,idx)=>acc+val.charCodeAt()+idx,0)
    }
    else if(Array.isArray(stringValue)){
        let groupID = 0;
        stringValue.forEach((string,idx)=>{
            groupID += string.split("").reduce((acc,val,idx)=>acc+val.charCodeAt()*(idx+1),0)
        })
        return groupID;
    }
    return;
}