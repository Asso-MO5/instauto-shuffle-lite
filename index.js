#!/usr/bin/env node
const
    clear = require('clear'),
    fs = require('fs'),
    chalk = require('chalk'),
    inquirer = require('inquirer'),
    figlet = require('figlet'),
    Instagram = require('instagram-web-api');

function getRandom(max) {
    min = 0;
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min
}

async function run() {

    const questions = [
        {
            type: 'input',
            name: 'folder',
            message: 'Pictures\' folder path : '
        },
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
            type: 'input',
            name: 'tags',
            message: 'Hashtags ? (separate by comma) ',
        },
    ];

    inquirer.prompt(questions).then(async answers => {
        const 
            {folder, username, password, tags} = answers,
            // for windows or Linux system. 
            slash = folder.includes(`\\`) ? '\\': '/',
            imgPublish = "[ias-publish]";

        fs.readdir(folder, async (err, files) => {

            if (err) {return console.log(chalk.red('problem with path link'))} 

            const images = [];

            files.forEach(file => {
                const 
                    parseFile = file.split('.'),
                    extension = parseFile[parseFile.length-1],
                    isJpg = extension.match(/jpg|jpeg/);
                if(isJpg){
                    const isPublish = file.includes(imgPublish);
                    if(!isPublish){images.push(file)}
                }
            });

            if(images.length === 0){return console.log(chalk.red('not images available for publish !'))}

            const 
                photo = images[getRandom(images.length)],
                link = folder + slash + photo,
                client = new Instagram({ username, password }),
                hashtags = [];

            if(tags){
                tags.split(',').forEach(tag=> hashtags.push(tag.slice(1) === '#' ? 
                    tag.replace(/ /g, ''): `#${tag.replace(/ /g, '')}`)
                )
            }

            const caption = hashtags.toString().replace(/,/g, ' ')

            await client.login();


            const profile = await client
                                    .getProfile()
                                    .catch(e=>console.log(
                                        chalk.red('problem with instagram connection')
                                    ));
            
            console.log(chalk.greenBright(`welcome to Instagram ${profile.username}`))

            await client.uploadPhoto({ 
                photo: link, caption, post: 'feed'
            }).catch(e=> console.log(chalk.red(e)))

            const 
                splitName = photo.split('.'),
                splitExt = splitName[splitName.length-1],
                newLink = folder + slash + splitName.slice(0,splitName.length-1).toString() + imgPublish + '.' + splitExt;

            fs.rename(link,newLink, (err, renFile)=>{
                if(err){err=>console.log(chalk.red(err))}
            })

            console.log(chalk.greenBright(`${photo} publish !`));

            inquirer.prompt([{
                type: 'confirm',
                name: 'rerun',
                message: 'relancer ?  ',
            }]).then(confirmAnSwers => {
                const {rerun} = confirmAnSwers;
                if(rerun){return init()}
                console.log(chalk.yellow('Done ! See you soon.'))
            })
        });

    })
};

function init(){
    clear();
    console.log(
        chalk.blueBright(
            figlet.textSync('InstAuto Shuffle', {
                horizontalLayout: 'default',
                whitespaceBreak: true 
            })
        )
    );
    run();
}

init();