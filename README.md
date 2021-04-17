![logo](https://github.com/Asso-MO5/instauto-shuffle-lite/blob/master/favicon.png?raw=true)

# InstAuto Shuffle Lite

**InstAuto** publish a random picture in your **Instagram** account.

*Only `jpg/jpeg` picture is available.*


## Installation

install nodeJs : https://nodejs.org/

open console (Linux) or Powershell (in Admin mode) and type : 
```bash
npx instauto-shuffle-lite
```

## local installation
If you want install this package in your machine : 

```bash
npm install -g instauto-shuffle-lite
```
and run 

```bash
instauto-shuffle-lite
```

## How to use
## V0.1.9
✨ New feature ✨
You can use `%filename%` in your text for replace by `file name`. 
## V0.1.8
Your **Instagram** cookie is save in `cookie.json` in your **images folders** (with save.json).

## V0.1.4
You can add **argument** `folder`. dont  forget `""`:
```bash
npx instauto-shuffle-lite folder="MY_PICTURE_FOLDER_LINK"
```
## v0.1.0
**Instauto Shuffle Lite** save our datas in `save.json` file, in your images folder. 

What datas is saved in `save.json` ? 
- credentials
- publish images
- default text

### text per image

If you have a **text file** (`.txt`) with **same name** of image in same folder, You can choice this text. 

```bash
- my-cat.jpg
- my-cat.txt
```

## v0.0.6

### Success
If your picture is publish, it's rename with `[ias-publish]` for exclude to random choice.

#### exemple : 

```bash
my-picture.jpg
```
become: 
```bash
my-picture[ias-publish].jpg
```

*Visit [MO5.COM](https://mo5.com).*