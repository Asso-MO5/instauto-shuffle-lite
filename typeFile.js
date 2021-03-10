function typeFile(file){

    const 
        fileToArray = file.split('.'),
        extension = fileToArray[fileToArray.length-1];
    if(fileToArray.length === 2){
        const 
            isJpg = extension.match(/jpg|jpeg/gm),
            isTxt = extension.match(/txt/gm);

        if(isJpg){return "img"}
        if(isTxt){return "txt"}
    }

    return undefined;
}

module.exports = typeFile;
    