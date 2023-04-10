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

const debug = false;

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
    default:"JSPOS_TXT",
    current:"JSPOS_TXT",
    editors:{
        JSPOS_TXT:(c) => {
            //by the time we get here, fileEditor.pointer has the file we are editing
            //and thats all we need
            console.log(fileEditor.pointer);
            let exit = false;
            let FILE = null;
            fileEditor.pointer.getFile().then((result) => {
                FILE = result;
            },(e) => {
                messageError("could not grab file");
                exit = true;
                return;
            });
            //we have a File() object in FILE of the file we want to edit
            let WRITER = null;
            fileEditor.pointer.createWritable().then((result) => {
                WRITER = result;
            },(e) => {
                messageError("failed to make a file writer");
                exit = true;
                return;
            });
            if (exit) {
                return;
            }
            //we now have the FILE and the WRITER!
            message("JSPOS_TXT is still a work in progress...");
            WRITER.close();
        }
    }
}

let commands = {
    say:{
        run:(c) => {
            if (c.split(' ').length > 1 && c.split(' ')[1] != '') {
                let a = c.substring(1 + c.indexOf(' '));
                messageColors(a);//+ (a.length<Math.floor((window.innerWidth-2)/8) ? '\u00A0':''));
            }
        },
        hlp:() => {
            message("say *anything");
            message("prints everything after 'say '");
            message("but you can add colored text by using the format:");
            message("[normal text]`[color]`[colored text]`[normal text]");
            message("for example: say `crimson`crimson text` is cool, but `#FF0000`this is red`, will print:");
            messageColors("`crimson`crimson text` is cool, but `#FF0000`this is red`");
        }
    },
    
    verbalize:{
        run:(c) => {
            if (debug) {
                if (c.split(' ').length > 1 && c.split(' ')[1] != '') {
                    let a = c.substring(1 + c.indexOf(' '));
                    message(a + (a.length<Math.floor((window.innerWidth-2)/8) ? '\u00A0':''));
                }
            } else {
                messageError("this command is currently dissabled");
            }
        },
        hlp:() => {
            message("verbalize *innerHTML")
            message("pushes everything after 'verbalize ' into the first terminal line as innerHTML");
            message("this is a debug command, and is currently " + (debug ? 'enabled' : 'disabled'));
        }
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
        hlp:() => {
            message("help ?command");
            message("lists all commands, optionaly prints help message for specific command");
            message("view the <a style='margin:0px;display:inline' href='https://github.com/ShadowTide14/JSPseudoOS/wiki'>GitHub JSPOS wiki</a> for more info on JSPOS");
        }
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
                            messageColors("`lightblue`"+entry.name+"`");
                        } else {
                            message(entry.name);
                        }
                    }
                }
                a();
            } else {
                messageError("no root folder selected");
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
                messageError("no root folder selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            }
        },
        hlp:() => {
            message("cd ~|..|[sub-directory name]");
            message("changes your current directory");
        }
    },
    
    
    view:{
        run:(c) => {
            if (!flags.root.valid) {
                messageError("no root folder selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            } else {
                fileExplorer.current.getFileHandle(c.substring(1 + c.indexOf(' '))).then((result) => {
                    //found file
                    result.getFile().then((rslt) => {
                        rslt.text().then((txt) => {
                            //text file viewer!!
                            let txtArr = txt.split('\n');
                            let page = 1;
                            let pageMax = Math.ceil(txtArr.length/lineMax);
                            let viewPage = () => {
                                commands.clear.run("clear");
                                for (let i = 0; i < lineMax; i++) {
                                    if (((page-1) * lineMax) + i < txtArr.length) {
                                        message(txtArr[((page-1) * lineMax) + i]);
                                    } else {
                                        message("");
                                    }
                                }
                            };
                            viewPage();
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
                                                page += page<pageMax ? 1 : 0;
                                                viewPage();
                                            } else if (answer == 'prev') {
                                                page -= page>1 ? 1 : 0;
                                                viewPage();
                                            } else {
                                                viewPage();
                                            }
                                            busy = false;
                                        })
                                    }
                                    setTimeout(loop,0);
                                } else {
                                    return;
                                }
                            }
                        },() => {
                            messageError("failed to get text");
                        });
                    },() => {
                        messageError("could not grab file");
                    });
                },() => {
                    messageError("could not find file: " + c.split(' ')[1]);
                });
            }
        },
        hlp:() => {
            message("view [file name]");
            message("opens up and views the specified file as text information");
        }
    },
    
    mkdir:{
        run:(c) => {
            if (flags.root.valid) {
                if (!(c.indexOf(' ')+1 >= c.length)) {
                    fileExplorer.current.getDirectoryHandle(c.substring(c.indexOf(' ') + 1),{create:true}).then((result) => {
                        message("directory " + c.substring(c.indexOf(' ') + 1) + " was made or already exists");
                    },(e) => {
                        messageError("failed to create directory");
                        messageError(e);
                    });
                } else {
                    messageError("invalid arguments");
                }
            } else {
                messageError("no root folder selected");
                messageColors("try the command `white`root`");
            }
        },
        hlp:() => {
            message("mkdir *directory_name");
            message("makes a new directory (if it doesn't already exist)");
        }
    },
    
    mkfile:{
        run:(c) => {
            if (flags.root.valid) {
                fileExplorer.current.getFileHandle(c.substring(c.indexOf(' ') + 1),{create:true}).then((result) => {
                    message("file " + c.substring(c.indexOf(' ') + 1) + " was made or already exists");
                },(e) => {
                    messageError("failed to create directory");
                    messageError(e);
                });
            } else {
                messageError("no root folder selected");
                message('try the command<p style="color:white;margin:0px;display:inline;"> root</p>');
            }
        },
        hlp:() => {
            
        }
    },
    
    del:{
        run:(c) => {
            if (flags.root.valid) {
                fileExplorer.current.removeEntry(c.substring(c.indexOf(' ',c.indexOf(' ')+1)+1),{ recursive:c.split(' ')[1]=='yes'}).then((result) => {
                    messageColors("deleted subdirectory|file `lightblue`"+c.substring(c.indexOf(' ',c.indexOf(' ')+1)+1)+"`");
                },(e) => {
                    if (e.name == "InvalidModificationError") {
                        messageError("cannot delete directory, recursive removal disabled");
                    } else {
                        messageError("could not find file or directory");
                    }
                });
                
            } else {
                messageError("no root folder selected");
                messageColors("try the command `white`root`");
            }
        },
        hlp:() => {
            message("del yes|no *directory or file name");
            message("deletes the corrisponding directory or file");
            message("if you specify 'no' then this command wont delete recursivly");
        }
    },
    
    edit:{
        run:(c) => {
            if (flags.root.valid) {
                fileExplorer.current.getFileHandle(c.substring(c.indexOf(' ')+1)).then((result) => {
                    fileEditor.pointer = result;
                    fileEditor.editors[fileEditor.current](c);
                },(e) => {
                    messageError("could not find that file");
                });
            } else {
                messageError("no root folder selected");
                messageColors("try the command `white`root`");
            }
        },
        hlp:() => {
            message("edit *filename");
            message("opens your JSPOS file editor (defaults to JSPOS_TXT editor)");
            message("see the <a style='margin:0px;display:inline' href='https://github.com/ShadowTide14/JSPseudoOS/wiki'>GitHub JSPOS wiki</a> to get more info on custom editors");
        }
    }
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
        a.style = "font-family:'Courier New', monospace;font-size:14px;";
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
    //str = str + '\u00A0';
    for (let i = 0; i <= lineMax; i++) {
        let ref = document.getElementById("line"+i);
        if (i<lineMax) {
            ref.innerHTML = document.getElementById("line"+(i+1)).innerHTML;
        } else {
            ref.innerHTML = str + '\u00A0';
        }
        if (ref.innerText.length>=Math.floor((window.innerWidth-2)/8)) {
            ref.innerText = ref.innerText.substring(0,Math.floor((window.innerWidth-2)/8));
        }
    }
}
/*
like message but it does this:
`red`words that are red`normal text`white`white text`this is a forward slash: /
becomes:
<p style="color:red;margin:0px;display:inline">words that are red</p>normal text<p style="color:white;margin:0px;display:inline">white text</p>

the format for this is:
[normal text]`[color]`[your colored text]`[normal text]
*/
function messageColors(str) {
    let index = 0;
    let color = '';
    let depth = 0;
    let out = str.substring(0,str.indexOf('`'));
    while (str.indexOf('`',index)>=0) {
        let curI = str.indexOf('`',index);
        if (!(str.indexOf('`',curI+1) < 0)) {
            if (depth == 0) {
                color = str.substring(curI+1,str.indexOf('`',curI+1));
                depth += 1;
            } else if (depth == 1) {
                out = out + "<p style='margin:0px;display:inline;color:"+color+";'>"+str.substring(curI+1,str.indexOf('`',curI+1))+"</p>";
                depth += 1
            } else if (depth == 2) {
                out = out + str.substring(curI+1,str.indexOf('`',curI+1));
                depth = 0;
            }
            index = curI+1;
        } else {
            index += 1;
        }
    }
    if (index != str.length) {
        out = out + str.substring(index);
    }
    message(out);
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
