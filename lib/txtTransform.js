module.exports = function txtTransform (txt,img){
    let newTxt = txt.replaceAll('%filename%',img.name);
    return newTxt.replaceAll('%link%',img.link)
}