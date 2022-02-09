

const drawImage = (e) => {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.width = e.target.width;
    canvas.height = e.target.height;

    context.drawImage(e.target,0,0);
    canvas.addEventListener('error',()=>console.log("kill"))
    console.log(canvas.toDataURL("image/png"))

}

const downloadImg = (url) => {
    let img = document.createElement("img");
    img.crossOrigin = "Anonymous";
    img.addEventListener('load',drawImage)
    img.addEventListener('error',()=>console.log("hel"))
    img.src = url;
}

export default downloadImg;

export const legitYTV = (url) => {
    let is_youtube = url.match("https://www.youtube.com/watch");
    console.log("is_youtube: ", is_youtube)
    if(is_youtube){
        let has_divider = url.indexOf("&");
        console.log(has_divider)
        let video_id = (has_divider !== -1) ? url.substring(32,has_divider) : url.substring(32);
        let img = document.createElement("img");
        img.addEventListener('load',(e)=>{
            console.log("width: ",img.width);
            if(img.width === 120) console.log("is 120px")
        })
        img.addEventListener('error',()=>{
            console.log("error");
        })
        img.src = `https://i.ytimg.com/vi/${video_id}/default.jpg`;
    }
}