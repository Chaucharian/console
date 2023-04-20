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
          envs: {
            describe: "Env vars to inject on the host",
            type: "array",
            alias: "e",
            demandOption: false,
            default: "",
            coerce: function (arg) {
              const envs = arg;
              if (!excludeFiles.length) {
                throw new Error("Must provide some env bar i.e EXAMPLE=123");
              }

              return { envs };
            },
          },
          exclude: {
            describe: "File to exclude from the transfer",
            type: "array",
            alias: "ex",
            demandOption: false,
            default: "",
            coerce: function (arg) {
              const excludeFiles = arg;
              if (!excludeFiles.length) {
                throw new Error("Invalid exclude files");
              }

              return { excludeFiles };
            },
          },
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
            await onServer({
              server: argv.server,
              envs: argv.envs?.envs,
              excludeFiles: argv.exclude?.excludeFiles ?? "",
            });
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
