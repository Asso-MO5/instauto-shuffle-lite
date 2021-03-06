#!/usr/bin/env node
const
    yargs = require('yargs'),
    low = require('lowdb'),
    FileSync = require('lowdb/adapters/FileSync'),
    clear = require('clear'),
    FileCookieStore = require('tough-cookie-filestore2'),
    fs = require('fs'),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    figlet = require('figlet'),
    Instagram = require('instagram-web-api'),
    util = require('util'),
    lstat= util.promisify(fs.lstat),
    readdir = util.promisify(fs.readdir),
    readFile = util.promisify(fs.readFile),
    typeFile = require('./typeFile'),
    packageJson = require('./package.json'),
    txtTransform = require('./lib/txtTransform'),
    args = process.argv.slice(2),
    iconv = require('iconv-lite'),
    chardet = require('chardet'),
    params = {};

iconv.skipDecodeWarning = true;

function getRandom(max) {
    min = 0;
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min
}

async function run() {
    
    let error;

    args.forEach(arg=>{
        if(arg.includes('=')){
            const [key,value] = arg.split('=')
            params[key] = value;
        }
    });

    const 
        firstQuestion = await inquirer.prompt({
            type: "input",
            name: "folder",
            message: "Pictures' folder path : ",
            default: params.folder
        }),
    {folder} = firstQuestion,
    slash = folder.includes(`\\`) ? '\\': '/',
    files = await readdir(folder).catch(e => error = e);
    
    if(error){return console.log(chalk.red(error))}

    const
        credentials = {},
        cookieStore = new FileCookieStore(`${folder}${slash}cookies.json`),
        adapter = new FileSync(`${folder}${slash}save.json`),
        db = low(adapter);
        db.defaults({ credentials: null, files: [], defaultText: null }).write();

        db._.mixin({
            random: function(array) {
              return array[getRandom(array.length)]
            }
          });

        credentialsSave = db.get('credentials').value();


    if(!credentialsSave || (!credentialsSave.username && !credentialsSave.password)){

        console.log(chalk.red('no "save.json" file found.' ));
        const credentialsQuestions = await inquirer.prompt([
            {
                type: 'input',
                name: 'username',
                message: 'Instagram ID : '
            },
            {
                type: 'password',
                name: 'password',
                message: 'Instagram password : ',
            },
            {
                type: 'confirm',
                name: 'save_credentials',
                message: 'Save credentials in folder "'+ folder +'": '
            }
        ]);
        
        const {username, password, save_credentials} = credentialsQuestions; 
        
        credentials.username = username;
        credentials.password = password;
        credentials.cookieStore = cookieStore;

        if(save_credentials){db.set('credentials', credentials).write()}

    } else {
        credentials.username = credentialsSave.username;
        credentials.password = credentialsSave.password;
        credentials.cookieStore = cookieStore;
    }

    console.log(chalk.magenta('connect to Instagram...'));
    
    const client = new Instagram(credentials);
    await client.login().catch(e => error = e);
    const profile = await client.getProfile();
    //const profile = {username: "test"};
    
    if(!profile){
        
        console.log(chalk.red('Problem with instagram connection'));
        console.log(chalk.redBright('You may have logged in too often within a very short time'));
        const delConfirm = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'del_credentials',
                message: 'Delete your registered crendentials ?  '
            }
        ]);
        
        const {del_credentials} = delConfirm; 
        
        if(del_credentials){
            db.unset('credentials.username').write();
            db.unset('credentials.password').write();
            return console.log(chalk.red('credentials deleted'))
        }
        return console.log(chalk.red('See you soon !'))
    }

    console.log(chalk.greenBright.inverse(`Welcome to Instagram ${profile.username}.`));
    console.log(chalk.greenBright('\n'));

    for(const file of files){

        const
            link = folder+slash+file
            filetoArray = file.split('.');

        if(filetoArray.length === 1 ) {

            const isDirectory = await lstat(link);

            if(isDirectory.isDirectory()){

                const subFolder = await readdir(link);

                for(const subFile of subFolder){
                    const
                        subLink = link + slash + subFile,
                        subFiletoArray = subFile.split('.'),
                        search = db.get('files').find({ link: subLink }).value();

                    if(!search){
                        const type = typeFile(subFile);
                        if(type){
                            db
                            .get('files')
                            .push({
                                name: subFiletoArray[0],
                                type,
                                value: type === "txt" && iconv.decode(await readFile(link) ,chardet.detectFileSync(link)),
                                link: subLink,
                                publish: false,
                                folder: link
                            })
                            .write();
                        }
                    }
                }
            }
        } else {
            const isFile = await lstat(link);
            if(isFile.isFile()){
                const search = db.get('files').find({ link }).value();

                if(!search){
                    const type = typeFile(file);

                    if(type){
                        db
                        .get('files')
                        .push({
                            name: filetoArray[0],
                            type,
                            value: type === "txt" && iconv.decode(await readFile(link) ,chardet.detectFileSync(link)),
                            link,
                            folder,
                            publish: false,
                            folderName: file
                        })
                        .write()
                    }
                }
            }
        }
    }

    const 
        randomImage = db.get('files').filter({publish: false, type: "img" }).random().value(),
        textImage = db.get('files').find({
            name: randomImage.name,
            folder:randomImage.folder, 
            type: "txt" }).value(),
            searchDefaultText = db.get('defaultText').value();

    console.log(chalk.greenBright.bold(randomImage.name + '\n'));

    let caption;

    if(!textImage){

        if(!searchDefaultText){
            const writeText = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'write_txt',
                    message: 'Write text and/or hastags ? '
                }
            ]);
            
            const {write_txt} = writeText; 

            if(write_txt){
                const defaultTxt = await inquirer.prompt([
                    {
                        type: 'editor',
                        name: 'default_txt',
                        message: 'Your text (you can add hastag): ',
                    },
                    {
                        type: 'confirm',
                        name: 'save_defaultTxt',
                        message: 'Save this text in default ? '
                    }
                ]);
                
                const 
                    {default_txt, save_defaultTxt} = defaultTxt,
                    txtFormat = chardet.detect(Buffer.from(default_txt)),
                    default_txt_decode = txtFormat === "UTF-8" ? default_txt : iconv.decode(default_txt ,txtFormat);

                if(save_defaultTxt){
                    console.log(chalk.yellow(txtTransform(default_txt_decode,randomImage)));
                    db.set('defaultText', default_txt_decode).write();
                    console.log(chalk.green('text saved !'));
                }

                if(default_txt.length > 2){caption = default_txt_decode}
            }
        } else {

            console.log(chalk.yellow.inverse('My default text :'));
            console.log(chalk.yellowBright('\n',txtTransform(searchDefaultText, randomImage)));

            const defaultTxt = await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'load_defaultTxt',
                    message: 'Load this text ? '
                }
            ]);
            
            const {load_defaultTxt} = defaultTxt; 

            if(load_defaultTxt) {
                caption = searchDefaultText;
            } else {
                const newTxt = await inquirer.prompt([
                    {
                        type: 'editor',
                        name: 'new_txt',
                        message: 'Your text (you can add hastag or %filename% for replace by file name): ',
                    },
                    {
                        type: 'confirm',
                        name: 'save_newTxt',
                        message: 'Save this text in default ? '
                    }
                ]);
                
                const 
                    {new_txt, save_newTxt} = newTxt,
                    newTxtFormat = chardet.detect(Buffer.from(new_txt)),
                    new_txt_decode = newTxtFormat === "UTF-8" ? new_txt : iconv.decode(new_txt ,newTxtFormat);

                if(new_txt.length > 2){caption = new_txt_decode }

                if(save_newTxt){
                    db.set('defaultText', new_txt_decode).write();
                    console.log(chalk.yellow(txtTransform(new_txt_decode,randomImage)));
                    console.log(chalk.green('text saved !'));
                }
            }

        }

    } else if(searchDefaultText){


        const TxtAggregator = await inquirer.prompt([
            {
                type: 'list',
                name: 'txt_aggregator',
                message: 'what loaded text ? ',
                choices: ['Image text', 'Default text','Both', 'Nothing']
            }
        ]);
        
        const {txt_aggregator} = TxtAggregator; 

        switch(txt_aggregator) {
            case 'Image text':
                caption = textImage.value;
                break;
            case 'Default text':
                caption = searchDefaultText;
                break;
            case 'Both':
                caption = textImage.value + '\n' + searchDefaultText;
                break;
            default:
                caption = ' ';
        }

    }

    caption = txtTransform(caption,randomImage);

    console.log(chalk.white('\n'));
    console.log(chalk.whiteBright.inverse.bold("POST RESUME:"));
    console.log(chalk.white('---------------'));
    console.log(chalk.greenBright.bold(randomImage.name));
    console.log(chalk.bold('Your choiced text :'));
    console.log(chalk.yellowBright(caption));
    console.log(chalk.white('---------------'));
    const ready = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'publish_ready',
            message: 'Publish ? '
        }
    ]);
    
    const {publish_ready} = ready; 

    if(publish_ready) {
        console.log(chalk.magenta('loading...'));
        await client.uploadPhoto({ 
            photo: randomImage.link, caption, post: 'feed'
        }).catch(e => error = e);

        if(error){return console.log(chalk.red(error))}
        
        db.get('files').find({link: randomImage.link }).assign({ publish: true}).write();
        
        console.log(chalk.greenBright.bold(randomImage.name + ' published !'));
    }

};

function init(){
    clear();
    console.log(
        chalk.blueBright(
            figlet.textSync('InstAuto Shuffle', {
                horizontalLayout: 'default',
                whitespaceBreak: true 
            })
        ),'v'+packageJson.version
    );
    run();
}

init();