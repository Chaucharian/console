import Yargs from "yargs";

export class Params {
  constructor() {
    this.commands = {};
    this.yargs = Yargs(process.argv.slice(2));
  }

  deploy({ onServer, onStatic }) {
    this.yargs
      .command({
        command: "deploy",
        describe: "Deploy application",
        builder: {
          server: {
            describe: "Deploy to server",
            type: "string",
            alias: "s",
            demandOption: false,
            default: "./",
            nargs: 3,
            coerce: function (arg) {
              const [user, host] = arg[0].split("@");

              if (host === "") {
                throw new Error("Invalid ssh format try i.e root@domain.com");
              }

              const sourcePath = arg[1];
              const hostPath = arg[2];
              if (sourcePath === "" || hostPath === "") {
                throw new Error("Invalid path");
              }

              return { sourcePath, hostPath, user, host };
            },
          },
          static: {
            describe: "Deploy to static hosting",
            type: "boolean",
            demandOption: false,
            default: false,
          },
        },
        handler: async function (argv) {
          if (argv.server) {
            console.log(`Deploying to server ${argv.server}`);
            // Your deployment code for server
            await onServer(argv.server);
          } else if (argv.static) {
            console.log("Deploying to static hosting");
            // Your deployment code for static hosting
            await onStatic(argv.server);
          } else {
            console.log("Please specify either --server or --static option");
          }
        },
      })
      .help("h")
      .parse();
  }

  noOptions(initFlowCb) {
    const { _ } = this.yargs.parse();
    if (!_.length) {
      initFlowCb();
    }
  }
}
