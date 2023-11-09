//Main file
let ready = false

let user;
let Console;
let lineMax;

const debug = false;
const version = "0.1.2";


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
/*
JSPOS_TXT commands:
prev/next, navigates the file viewer
exit, ends the file editing session
save, writes current file data to the temporary .crswap file
#:*anything, writes [anything] onto line [#], fills in empty strings on intermediary lines if the new line would be outside the bounds of the current file
#!, deletes line [#] and any empty lines between it and the next non empty line
*/

let fileEditor = {
    pointer:null,
    default:"JSPOS_TXT",
    current:"JSPOS_TXT",
    run:(c) => {
        //bootstraps the file editor
        let FILE = null;
        let TEXT = null;
        let WRITER = null;
        fileEditor.pointer.getFile().then((result) => {
            FILE = result;
            FILE.text().then((rslt) => {
                TEXT = rslt.split('\n');
                fileEditor.pointer.createWritable().then((rslt1)=> {
                    WRITER = rslt1;
                    fileEditor.editors[fileEditor.current](c,FILE,TEXT,WRITER);
                },(e) => {
                    messageError("failed to create WRITER");
                    return;
                });
            },(e) => {
                messageError("failed to grab file text");
                return;
            });
        },(e) => {
            messageError("could not grab file");
            return;
        });
    },
    editors:{
        JSPOS_TXT:(c,FILE,TEXT,WRITER) => {
            //FILE contains the fileEditor.pointer.getFile() result
            //TEXT contains the result of FILE.text()
            //WRITER contains the FileSystemWritableFileStream of fileEditor.pointer

            
            //cursor: <span class='pulsate'>#</span>
            let page = 1;
            let pageMax = Math.ceil(TEXT.length/lineMax);
            let viewPage = () => {
                commands.clear.run("clear");
                for (let i = 0; i < lineMax; i++) {
                    if (((page-1) * lineMax) + i < TEXT.length) {
                        message(TEXT[((page-1) * lineMax) + i]);
                    } else {
                        message("");
                    }
                }
            };
            viewPage();
            let keepGoing = true;
            let busy = false;
            let saved = true;
            
            loop();
            function loop() {
                if (keepGoing) {
                    //main loop stuff
                    if (!busy) {
                        busy = true;
                        query("page " + page + "/" + pageMax + " " + FILE.name + (saved ? "" : "*"),(answer) => {
                            if (answer == "save") {
                                WRITER.seek(0);
                                let data = "";
                                for (let i = 0; i < TEXT.length; i++) {
                                    if (i != 0 && i != TEXT.length) {
                                        data = data + "\n";
                                    }
                                    data = data + TEXT[i];
                                }
                                WRITER.write(data);
                                saved = true;
                                viewPage();
                            } else if (answer == "exit") {
                                WRITER.close().catch((e) => {
                                    messageError("failed to flush file data");
                                });
                                message("closed JSPOS_TXT");
                                keepGoing = false;
                            } else if (answer == "next") {
                                page += page<pageMax ? 1 : 0;
                                pageMax = Math.ceil(TEXT.length/lineMax);
                                viewPage();
                            } else if (answer == "prev") {
                                page -= page>1 ? 1 : 0;
                                pageMax = Math.ceil(TEXT.length/lineMax);
                                viewPage();
                            } else if (answer != "") {
                                //line commands
                                if (answer[answer.length - 1] == '!' && Number.parseInt(answer.split('!',1)) != NaN) {
                                    TEXT[Number.parseInt(answer.split('!',1))-1] = "";
                                    if (Number.parseInt(answer.split('!',1)) == TEXT.length) {
                                        let min = TEXT.length - 1;
                                        for (let i = TEXT.length - 1; i > 0; i--) {
                                            if (TEXT[i] != "") {
                                                break;
                                            }
                                            min = i;
                                        }
                                        TEXT.splice(min);
                                    }
                                    TEXT.splice(Number.parseInt(answer.split('!',1)) - 1,1)
                                } else if (Number.parseInt(answer.split(':',1)) != NaN) {
                                    let oldEnd = TEXT.length;
                                    TEXT[Number.parseInt(answer.split(':',1)) - 1] = answer.substring(answer.indexOf(':')+1);
                                    for (let i = oldEnd; i < TEXT.length; i++) {
                                        if (TEXT[i] == undefined) {
                                            TEXT[i] = "";
                                        }
                                    }
                                    pageMax = Math.ceil(TEXT.length/lineMax);
                                    saved = false;
                                }
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

    VStest:{
        run:(c) => {
            messageColors("helloooo~... `red`you` arent supposed to be here...");
        },
        hlp:() => {
            message("boo!");
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
                let temp = [];
                Object.entries(commands).forEach((e) => temp.push(e[0]));
                temp.sort();
                for (const e of temp) message(e);
            } else if (c.split(' ').length == 2) {
                //print the help message for that command
                message("\u00A0");
                commands[c.split(' ')[1]].hlp();
            } else {
                messageError("invalid arguments");
            }
        },
        hlp:() => {
            message("help ?command");
            message("lists all commands, optionaly prints help message for specific command");
            message("view the <a style='color:lightblue;margin:0px;display:inline' href='https://github.com/ShadowTide14/JSPseudoOS/wiki'>GitHub JSPOS wiki</a> for more info on JSPOS");
        }
    },
    
    clear:{
        run:(c) => {for (let i = 0; i <= lineMax; i++) {document.getElementById("line"+i).innerText = "\u00A0";}},
        hlp: () => {message("clear");message("clears the screen");}
    },
    /*
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
    */

    root:{
        run:(c) => {
            if (flags.root.valid) {
                query('`yellow`WARNING: you are trying to change your root folder! are you sure?` `white`y/n`',(answer) => {if (answer == 'y') {flags.root.valid = false;commands.root.run("root");} else {message("cancelling")}});
            } else {
                window.showDirectoryPicker().then((dir) => {
                    flags.root.valid = true;
                    flags.root.pointer = dir;
                    fileExplorer.current = dir;
                    fileExplorer.prev = [dir];
                    messageColors('selected `white`' + dir.name + '` as root directory');
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
    
    changeEditor:{
        run:(c) => {
            if (c == "changeEditor") {
                fileEditor.current = fileEditor.default;
            } else if (c.split(' ')[1] != "") {
                let a = c.substring(1 + c.indexOf(' '));
                if (Object.keys(fileEditor.editors).findIndex(e => e == a) != -1) {
                    fileEditor.current = a;
                }
            }
        },
        hlp:(c) => {
            message("changeEditor ?*[editor name]");
            message("lets you switch what is your current editor.");
            message("if left blank the command sets your editor to the default");
            message("as of right now your default editor is: " + fileEditor.default);
        }
    },
    
    importEditor:{
        run:(c) => {
            const pickerOpts = {
              types: [
                {
                  description: "JSPOS compatable file editors",
                  accept: {
                    "idk/*": [".txt",".js"],
                  },
                },
              ],
              excludeAcceptAllOption: true,
              multiple: false,
            };
            window.showOpenFilePicker(pickerOpts).then((rslt) => {
                //rslt[0] has the file we need to open
                rslt[0].getFile().then((file) => {
                    file.text().then((text) => {
                        //really unsafe!!
                        fileEditor.editors[rslt[0].name.split('.',1)[0]] = eval(text);
                    }).catch((e) => {
                        messageError("failed to grab text from file");
                    });
                });
                
            }).catch((e) => {
                messageError("failed to open file");
                console.log(e);
            });
        },
        hlp:() => {
            message("importEditor");
            message("lets you select a .txt or .js file to add as an editor");
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
                            break;
                        case '..':
                            if (fileExplorer.prev.length == 1) {
                                fileExplorer.current = flags.root.pointer;
                                fileExplorer.prev = [flags.root.pointer];
                            } else {
                                fileExplorer.current = fileExplorer.prev[fileExplorer.prev.length - 1];
                                fileExplorer.prev.pop();
                            }
                            break;
                        default:
                            fileExplorer.current.getDirectoryHandle(c.split(' ')[1]).then((result) => {
                                //found directory
                                fileExplorer.prev[fileExplorer.prev.length] = fileExplorer.current;
                                fileExplorer.current = result;
                            },() => {
                                //did not find directory
                                messageError("could not find directory: " + c.split(' ')[1]);
                            });
                            break;
                    }
                    message("current directory: " + fileExplorer.current.name);
                    
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
                    messageError("failed to create file");
                });
            } else {
                messageError("no root folder selected");
                messageColors('try the command `white`root`');
            }
        },
        hlp:() => {
            message("mkfile *file name");
            message("makes a new file [file name]");
            message("note that any file extensions (.txt, .js, etc.)");
            message("are part of the filename");
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
                    fileEditor.run(c);
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
            message("see the <a style='color:lightblue;margin:0px;display:inline' href='https://github.com/ShadowTide14/JSPseudoOS/wiki'>GitHub JSPOS wiki</a> to get more info on custom editors");
        }
    },
    
    sysInfo:{
        run:(c) => {
            message("");
            message("JavaScript Psuedo Operating System (JSPOS) version "+version);
            message("File editors:");
            for (const e of Object.keys(fileEditor.editors)) message(e);
            message("Current Editor: " + fileEditor.current);
            message("Default editor: " + fileEditor.default);
        },
        hlp:() => {
            message("sysInfo");
            message("displays info about your version of JSPOS");
        }
        
    },
    
    grep:{
        run:(c) => {
            
        },
        hlp:() => {
            message("work in progress");
            message("does nothing right now");
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
    
    //intro message
    messageColors("welcome to JSPOS `white`v" + version + "`!");
    messageColors("you can use `white`help` to view a list of commands");
    messageColors("and `white`help [command]` to learn more about [command]!");
    
    ready = true;
}

//runs every couple of frames
function Main() {if(ready){}}

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
    messageColors(str);
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
