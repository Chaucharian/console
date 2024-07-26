import inquirer from "inquirer";
import { exec } from "child_process";
import Rsync from "rsync";
import ora from "ora";
import { Params } from "./Params.js";

const spinner = ora("Loading...");

function command(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

function makePromise(cb) {
  return new Promise((resolve, reject) => {
    cb(resolve, reject);
  });
}

const nginxConfig = {
  server: ({ subdomain, domain, port }) => `
    server {
        location / {
        proxy_pass http://localhost:${port};
        }
        index index.html;
        server_name   www.${subdomain}.${domain}  ${subdomain}.${domain};
    } 
  `,
  static: ({ subdomain, domain, path = "/home/example/dist" }) => `
  server {
  
      location / {
          root ${path};
          try_files $uri $uri/ /index.html?$args;
      }   
     
      index index.html;
      server_name   www.${subdomain}.${domain}  ${subdomain}.${domain};
  } 
    `,
};

async function uploadSsh({ sourcePath, hostPath, exclude }) {
  // Build the command
  var rsync = new Rsync()
    .shell("ssh")
    .flags("htvzrp")
    .set("progress")
    .source(sourcePath.trim())
    .destination(hostPath.trim());

  if (exclude?.length) {
    rsync.exclude(exclude);
  }

  const commandText = rsync.command();

  console.log(`Executing uploading: ${commandText}`);

  await makePromise((resolve, reject) =>
    rsync.execute(
      function execute(error, code, cmd) {
        if (error) {
          console.error(`Rsync error: ${error.message}`);
          reject(error);
          return;
        }

        console.log(`Rsync exited with code ${code}`);
        resolve("ok");
      },
      function progress(progress) {
        console.log(progress);
      }
    )
  );
}

async function generateSSL({ fullDomain }) {
  await command(
    `certbot --nginx -d ${fullDomain} -d www.${fullDomain} --force-renew`
  );
  // await command(`certbot renew --dry-run`);
}

async function makeNginxFile({ config, fileName }) {
  await command(`echo '${config}' > /etc/nginx/sites-available/${fileName}`);
}
async function linkFile({ fileName }) {
  await command(
    `ln -sfn /etc/nginx/sites-available/${fileName} /etc/nginx/sites-enabled/`
  );
}
async function restartNginx() {
  await command(`systemctl restart nginx`);
}

const getENVSdeclaration = (envs) =>
  envs.map((env) => `export ${env}`).join(" ");

async function runSSH({ user, host, script, envs }) {
  console.log("EEEENVSS", getENVSdeclaration(envs));

  return await command(
    `ssh -t ${user}@${host} 'bash -c -i "${getENVSdeclaration(
      envs
    )} && ${script}"'`
  );
}

async function createProxyFlow() {
  let config = {};

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: "select what to do?",
      choices: ["nginx config", "upload files"],
    },
  ]);

  if (choice === "upload files") {
    const { sourcePath } = await inquirer.prompt([
      {
        type: "text",
        name: "sourcePath",
        message: "write source path (ie. ./ ./dist)",
      },
    ]);
    const { hostPath } = await inquirer.prompt([
      {
        type: "text",
        name: "hostPath",
        message:
          "write destination path (ie. root@marplacode.com:/home/example)",
      },
    ]);
    spinner.start();
    await uploadSsh({ sourcePath, hostPath });
    spinner.succeed("Done!");
    return;
  }

  const { proxyType } = await inquirer.prompt([
    {
      type: "list",
      name: "proxyType",
      message: "is your app a server or static?",
      choices: ["server", "static"],
    },
  ]);

  if (proxyType === "server") {
    const { domain } = await inquirer.prompt([
      {
        type: "text",
        name: "domain",
        message: "what's your domain name?",
      },
    ]);
    const { subdomain } = await inquirer.prompt([
      {
        type: "text",
        name: "subdomain",
        message: "what's your sub-domain name?",
      },
    ]);
    const { port } = await inquirer.prompt([
      {
        type: "text",
        name: "port",
        message: "wich port will be used?",
      },
    ]);
    config = {
      config: nginxConfig.server({ port, domain, subdomain }),
      fileName: `${subdomain}.${domain}.conf`,
    };
  } else {
    const { domain } = await inquirer.prompt([
      {
        type: "text",
        name: "domain",
        message: "what's your domain name?",
      },
    ]);
    const { subdomain } = await inquirer.prompt([
      {
        type: "text",
        name: "subdomain",
        message: "what's your sub-domain name?",
      },
    ]);
    const { path } = await inquirer.prompt([
      {
        type: "text",
        name: "path",
        message: "where's the site located? (/home/example)",
      },
    ]);
    config = {
      config: nginxConfig.static({ domain, subdomain, path }),
      fileName: `${subdomain}.${domain}.conf`,
      fullDomain: subdomain + "." + domain,
    };
  }

  makeNginxFile(config);
  linkFile(config);
  restartNginx();
  generateSSL(config);
}

const params = new Params();
params.noOptions(() => createProxyFlow());
params.deploy({
  onCompleted: async (argv) => {
    const { server, exclude, envs, command } = argv;
    spinner.start();

    try {
      if (server?.sourcePath) {
        const { user, host, sourcePath, hostPath } = server;
        await uploadSsh({
          sourcePath: sourcePath,
          hostPath: `${user}@${host}:${hostPath}`,
          exclude,
        });
      }
      if (command?.script) {
        const { user, host, script } = command;
        const output = await runSSH({
          user,
          host,
          envs,
          script,
        });
        console.log(`command output: ${output}`);
      }
      spinner.succeed("Done! :)");
    } catch (error) {
      const errorMessage = `An error ocurred running some command: ${error.message}`;
      spinner.fail("Error! :(");
      throw new Error(errorMessage);
    }
  },
});
