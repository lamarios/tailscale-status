const {St, Clutter} = imports.gi;
const Main = imports.ui.main;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Me = imports.misc.extensionUtils.getCurrentExtension();




let testString = "some status";
let statusString = "Status: ";
// let enabledString = "⚪";
let enabledString = "✅ ";
let disabledString = "❌";

class TailscaleNode {
  constructor(_name, _address, _status, _offersExit, _usesExit) {
    this.name = _name;
    this.address = _address;
    this.status = _status;
    this.offersExit = _offersExit;
    this.usesExit = _usesExit;
    // this.item = new PopupMenu.PopupMenuItem(this.line);
  }

  get line() {
    var statusIcon;
    switch (this.status) {
      case "idle":
        statusIcon = "🟢"
        break;
      case "online":
        statusIcon = "🟢"
        break;
      case "offline":
        statusIcon = disabledString;
        break;
      case "-":
        statusIcon = "💻"
        break;
      default:
        statusIcon = "X"
    }
    return statusIcon + " " + this.address + " " + this.name;
  }
}


let nodes = [
  new TailscaleNode("test", "6.9.6.9", "online", false, false),
  new TailscaleNode("puter", "1.1.1.1", "-", false, false),
  new TailscaleNode("boontoo", "2.1.2.1", "offline", false, false),
  new TailscaleNode("linukcs", "3.1.3.1", "online", true, false)
];

let nodesMenu;
let exitNodeMenu;


function refreshNodesMenu() {
  nodesMenu.removeAll();
  nodes.forEach( (node) => {
    nodesMenu.actor.add_child( new PopupMenu.PopupMenuItem(node.line) );
  });
}

function refreshExitNodesMenu() {
  exitNodeMenu.menu.removeAll();
  exitNodeMenu.menu.addMenuItem(new PopupMenu.PopupMenuItem('None'), 0)
  
  nodes.forEach( (node) => {
    if (node.offersExit) {
      exitNodeMenu.menu.addMenuItem(new PopupMenu.PopupMenuItem(node.name));
    }
  })
}


const MyPopup = GObject.registerClass(
    class MyPopup extends PanelMenu.Button {
    
      _init () {

        super._init(0);

        let icon = new St.Icon({
          // icon_name : 'security-low-symbolic',
          gicon : Gio.icon_new_for_string( Me.dir.get_path() + '/icons/big2.svg' ),
          style_class : 'system-status-icon',
        });
        
        this.add_child(icon);

        let statusItem = new PopupMenu.PopupMenuItem( statusString, {reactive : false} );
        let upItem = new PopupMenu.PopupMenuItem("Tailscale Up");
        let downItem = new PopupMenu.PopupMenuItem("Tailscale Down");
        nodesMenu = new PopupMenu.PopupMenuSection();
        exitNodeMenu = new PopupMenu.PopupSubMenuMenuItem("Exit Nodes");

        
        this.menu.addMenuItem(statusItem, 0);
        this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem(), 1);

        this.menu.addMenuItem(upItem, 2);
        upItem.connect('activate', () => {
          statusItem.label.text = statusString + "tailscale up";
          log("clicked: ", statusItem.label.text);

          refreshExitNodesMenu();

          nodes.forEach( (node) => {
            node.name = "suck";
          })

          refreshNodesMenu();
          

        });
        
        this.menu.addMenuItem(downItem, 3);
        downItem.connect('activate', () => {
          statusItem.label.text = statusString + "tailscale down";
          log("clicked: ", statusItem.label.text);
        });
        
        this.menu.connect('open-state-changed', (menu, open) => {
          if (open) {
            log("open - update nodes")
          }
        });
        
        this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem(), 4);
        this.menu.addMenuItem(nodesMenu, 5);
        this.menu.addMenuItem( new PopupMenu.PopupSeparatorMenuItem(), 6);
        this.menu.addMenuItem(exitNodeMenu, 7);
        exitNodeMenu.menu.addMenuItem( new PopupMenu.PopupMenuItem('None'), 0); // setOrnament(1)
        
        nodes.forEach( (node, index) => {
          nodesMenu.actor.add_child( new PopupMenu.PopupMenuItem(node.line) );
        });

        // nodesMenu.actor.add_child( new PopupMenu.PopupMenuItem('item 1') );
        // nodesMenu.actor.add_child( new PopupMenu.PopupMenuItem('item 2'), 0 );
        // exitNodeMenu.actor.add_child( new PopupMenu.PopupMenuItem('item 2'));
        
        // // section
        // let popupMenuSection = new PopupMenu.PopupMenuSection();
        // popupMenuSection.actor.add_child( new PopupMenu.PopupMenuItem('section') );
        // this.menu.addMenuItem(popupMenuSection);
        
        // // image item
        // let popupImageMenuItem = new PopupMenu.PopupImageMenuItem(
        //   'Menu Item with Icon',
        //   'security-high-symbolic',
        //   );
        //   this.menu.addMenuItem(popupImageMenuItem);
          
          
          // sub menu
        // you can close, open and toggle the menu with
        // this.menu.close();
        // this.menu.open();
        // this.menu.toggle();
      }
    
});
    



let timeout;
let output;

let loop = GLib.MainLoop.new(null, false);


function run_cmd(argv) {
    try {
        let proc = Gio.Subprocess.new(
            argv,
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );
        proc.communicate_utf8_async(null, null, (proc, res) => {
            try {
                let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                if (proc.get_successful()) {
                    output = stdout;
                    log(">>>>>>>", stdout);
                } else {
                    throw new Error(stderr);
                }
            } catch (e) {
                logError(e);
            } finally {
                loop.quit();
            }
        });
    } catch (e) {
        logError(e);
    }
    
    loop.run();

    return true;
}


function init () {

}

function enable () {
    myPopup = new MyPopup();
    Main.panel.addToStatusArea('myPopup', myPopup, 1);



    
}

function disable () {
    myPopup.destroy();
}