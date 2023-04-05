//Main file
/*
things to do:

*/
let ready = false

let user;
let Console;
let lineMax;

/*
let cutsceens = {
    intro:[
        [">loading...",100],
        [">finished",1]
    ]
}
*/

let flags = {
    root:{
        valid:false,
        pointer:null
    },
    getRoot:() => {return flags.root.pointer}
}

let fileExplorer = {
    current:null,
    prev:[],
}

let fileEditor = {
    pointer:null,
}

let commands = {
    say:{
        run:(c) => {
            if (c.split(' ').length > 1 && c.split(' ')[1] != '') {
                let a = c.substring(1 + c.indexOf(' '));
                message(a + (a.length<Math.floor((window.innerWidth-2)/8) ? '\u00A0':''));
            } else {
                
            }
        },
        hlp:() => {message("say *anything");message("prints whatever comes after 'say '")}
    },
    
    
    help:{
        run:(c) => {
            if (c == "help") {
                //list all possible commands
                message("\u00A0");
                message("System commands:");
                Object.entries(commands).forEach((e) => message(e[0]));
            } else if (c.split(' ').length = 2) {
                //print the help message for that command
                message("\u00A0");
                commands[c.split(' ')[1]].hlp();
            } else {
                messageError("that is not valid");
            }
        },
        hlp:() => {message("help ?command");message("lists all commands, optionaly prints help message for specific command")}
    },
    
    
    clear:{
        run:(c) => {for (let i = 0; i <= lineMax; i++) {document.getElementById("line"+i).innerText = "\u00A0";}},
        hlp: () => {message("clear");message("clears the screen");}
    },
    
    
    test:{
        run:(c) => {
            query("please enter something", (answer) => {
                message("you typed: " + answer);
            });
        },
        hlp:() => {
            message("test *args");
            message("tests whatever I want it to");
        }
    },
    
    
    
    
    
    root:{
        run:(c) => {
            if (flags.root.valid) {
                query('<p style="color:yellow;margin:0px;display:inline;">WARNING: you are trying to change your root folder! are you sure?</p> y/n',(answer) => {if (answer == 'y') {flags.root.valid = false;commands.root.run("root");} else {message("cancelling")}});
            } else {
                window.showDirectoryPicker().then((dir) => {
                    flags.root.valid = true;
                    flags.root.pointer = dir;
                    fileExplorer.current = dir;
                    fileExplorer.prev = [dir];
                    message('selected <p style="color:white;margin:0px;display:inline;">' + dir.name + '</p> as root directory');
                }, (err) => {
                    messageError("user cancelled root file pick");
                });
            }
        },
        hlp:() => {
            message("root");
            message("opens up a directory picker, lets you pick the psuedo root folder");
        }
    },
    
    //file exploring functions
    ls:{
        run:(c) => {
            if (flags.root.valid) {
                let a = async () => {
                    message("<p style='margin:0px;display:inline;text-decoration:underline;'>"+fileExplorer.current.name+"</p>");
                    for await (let entry of fileExplorer.current.values()) {
                        if (entry.kind == "directory") {
                            message("<p style='color:lightblue;margin:0px;display:inline;'>"+entry.name + "</p>");
                        } else {
                            message(entry.name);
                        }
                    }
                }
                a();
            } else {
                messageError("no root file selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            }
        },
        hlp:() => {
            message("ls");
            message("lists all files and subdirectories within the current directory");
        }
    },
    
    cd:{
        run:(c) => {
            if (flags.root.valid) {
                if (c.split(' ').length == 2) {
                    switch (c.split(' ')[1]) {
                        case '~':
                            fileExplorer.current = flags.root.pointer;
                            fileExplorer.prev = [flags.root.pointer];
                            message("current directory: " + fileExplorer.current.name);
                            break;
                        case '..':
                            if (fileExplorer.prev.length == 1) {
                                fileExplorer.current = flags.root.pointer;
                                fileExplorer.prev = [flags.root.pointer];
                            } else {
                                fileExplorer.current = fileExplorer.prev[fileExplorer.prev.length - 1];
                                fileExplorer.prev.pop();
                            }
                            message("current directory: " + fileExplorer.current.name);
                            break;
                        default:
                            fileExplorer.current.getDirectoryHandle(c.split(' ')[1]).then((result) => {
                                //found directory
                                fileExplorer.prev[fileExplorer.prev.length] = fileExplorer.current;
                                fileExplorer.current = result;
                                message("current directory: " + fileExplorer.current.name);
                            },() => {
                                //did not find directory
                                messageError("could not find directory: " + c.split(' ')[1]);
                            });
                            break;
                    }
                    
                } else {
                    messageError("invalid arguments");
                }
            } else {
                messageError("no root file selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            }
        },
        hlp:() => {
            
        }
    },
    
    
    view:{
        run:(c) => {
            if (!flags.root.valid) {
                messageError("no root file selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            } else {
                //needs to display the contents of a file, in specific format? or as text?
                //if the file is a .txt file then view the text [ ]
                //if its an image file, throw an error? or maybe do some cool fancy stuff? [ ]
                //if the file is an audio file... maybe play it? [ ]
                let a = c.substring(1 + c.indexOf(' '));
                fileExplorer.current.getFileHandle(a).then((result) => {
                    //found file
                    result.getFile().then((rslt) => {
                        rslt.text().then((txt) => {
                            //text file viewer!!
                            let txtArr = txt.split('\n');
                            commands.clear.run("clear");
                            let page = 1;
                            let pageMax = Math.ceil(txtArr.length/lineMax);
                            for (let i = 0; i < lineMax; i++) {
                                if (i < txtArr.length) {
                                    message(txtArr[((page-1) * lineMax) + i]);
                                } else {
                                    message("");
                                }
                            }
                            
                            let keepGoing = true;
                            let busy = false;
                            loop();
                            function loop() {
                                if (keepGoing) {
                                    //main loop stuff
                                    if (!busy) {
                                        busy = true;
                                        query("page " + page + "/" + pageMax + " commands: prev,next,stop",(answer) => {
                                            
                                            if (answer == 'stop') {
                                                keepGoing = false;
                                                message("stopping");
                                            } else if (answer == 'next') {
                                                if (page < pageMax) {
                                                    page += 1;
                                                }
                                                commands.clear.run("clear");
                                                for (let i = 0; i < lineMax; i++) {
                                                    if (((page-1) * lineMax) + i < txtArr.length) {
                                                        message(txtArr[((page-1) * lineMax) + i]);
                                                    } else {
                                                        message("");
                                                    }
                                                }
                                                //message(keepGoing);
                                            } else if (answer == 'prev') {
                                                if (page > 1) {
                                                    page -= 1;
                                                }
                                                commands.clear.run("clear");
                                                for (let i = 0; i < lineMax; i++) {
                                                    if (((page-1) * lineMax) + i < txtArr.length) {
                                                        message(txtArr[((page-1) * lineMax) + i]);
                                                    } else {
                                                        message("");
                                                    }
                                                }
                                            }
                                            busy = false;
                                        })
                                    }
                                    setTimeout(loop,0);
                                } else {
                                    return;
                                }
                            }
                            
                            console.log(txtArr);
                        },() => {
                            messageError("failed to get text");
                        });
                    },() => {
                        messageError("could not grab file");
                    });
                },() => {
                    //did not find file
                    messageError("could not find file: " + c.split(' ')[1]);
                });
            }
        },
        hlp:() => {
            
        }
    },
}

//preload function
window.onload = () => {
    Console = document.getElementById("console");
    user = document.getElementById("user");
    user.style = "border:hidden;background-color:black;color:lime;outline-style:none;font-family:'Courier New', monospace;font-size:14px;";
    user.autocomplete = "off";
user.style.width = window.innerWidth - 24 - 8 + "px";
    user.parentElement.style = "font-family:'Courier New', monospace;font-size:14px;color:lime;margin-block-start:0px;margin-block-end:0px;";
    
    for (let i = 0; i < (window.innerHeight/17)-2;i++) {
        let a = document.createElement("p");
        a.style = "font-family:'Courier New', monospace;font-size:14px;color:lime";
        a.id = "line"+i;
        a.innerText = "\u00A0";
        a.style.marginTop = "0px";
        a.style.marginBottom = "0px";
        a.style.width = (window.width/8) + "ch";
        Console.appendChild(a);
    }
    lineMax = Math.floor((window.innerHeight/17)-2);
    
    user.addEventListener("change", handleCommand);
    
    ready = true;
}

//draw function
function Main() { if(ready) {
    
    
}}

/*
references the commands dictionary to run commands
*/
function handleCommand() {
    let cmnd = user.value;
    let spacedCmnd = cmnd.split(" ");
    user.value = "";
    if (spacedCmnd.length > 0 && !(commands[spacedCmnd[0]] === undefined)) {
        commands[spacedCmnd[0]].run(cmnd);
    } else {
        messageError("[" + cmnd + "] is not a valid command");
    }
}

/*
shifts all the terminal lines down one
and inserts the message [str] into the first line
*/
function message(str) {
    str = str + '\u00A0'
    for (let i = 0; i <= lineMax; i++) {
        let ref = document.getElementById("line"+i);
        if (i<lineMax) {
            ref.innerHTML = document.getElementById("line"+(i+1)).innerHTML;
        } else {
            ref.innerHTML = str;
        }
        if (ref.innerText.length>=Math.floor((window.innerWidth-2)/8)) {
            ref.innerText = ref.innerText.substring(0,Math.floor((window.innerWidth-2)/8));
        }
    }
}
/*
like message but it does this:
\red\words that are red\normal text\white\white text\
becomes:
<p style="color:red;margin:0px;display:inline">words that are red</p>normal text<p style="color:white;margin:0px;display:inline">white text</p>
*/
function messageColors(str) {
    
}

/*
like message but it does some auto formatting
*/
function messageError(str) {
    for (let i = 0; i <= lineMax; i++) {
        let ref = document.getElementById("line"+i);
        if (i<lineMax) {
            ref.innerHTML = document.getElementById("line"+(i+1)).innerHTML;
        } else {
            ref.innerHTML = "<p style='color:red;margin:0px;display:inline;'>ERR: "+str+"</p>";
        }
        if (ref.innerText.length>=Math.floor((window.innerWidth-2)/8)) {
            ref.innerText = ref.innerText.substring(0,Math.floor((window.innerWidth-2)/8));
        }
    }
}

/*
prints the message [str] to the screen
then waits for the user to input something,
when they do, the callback method is called
*/
function query(str, callback) {
    message(str);
    //request user input
    let keepGoing = true;
    let answer = "";
    user.removeEventListener("change",handleCommand);
    user.addEventListener("change",()=>answer=user.value,{once:true});
    loop();
    function loop() {
        if (keepGoing) {
            if (answer != "") {
                keepGoing = false;
            }
            setTimeout(loop, 0);
        }
        else {
            user.addEventListener("change",handleCommand);
            user.value = "";
            callback(answer);
        }
    }
}