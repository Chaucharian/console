#! /usr/bin/env node
import inquirer from "inquirer";
import { exec } from "child_process";
// import command from "./exec";

function command(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
      }
      resolve(stdout ? stdout : stderr);
    });
  });
}

const nginxConfig = {
  server: ({ subdomain, domain, port }) => `
    server {
        location / {
        proxy_pass http://localhost:${port};
        }
        index index.html;
        server_name   www.${subdomain}.${domain}.com  ${subdomain}.${domain}.com;
    } 
  `,
  static: ({ subdomain, domain, path = "/home/example/dist" }) => `
  server {
  
      location / {
          root ${path};
          try_files $uri $uri/ /index.html?$args;
      }   
     
      index index.html;
      server_name   www.${subdomain}.${domain}.com  ${subdomain}.${domain}.com;
  } 
    `,
};

async function makeNginxFile({ config, fileName }) {
  await command(`echo '${config}' > /etc/nginx/sites-available/${fileName}`);
}
async function linkFile({ fileName }) {
  await command(
    `ln -s /etc/nginx/sites-available/${fileName} /etc/nginx/sites-enabled/`
  );
}
async function restartNginx() {
  await command(`systemctl restart nginx`);
}

async function createProxyFlow() {
  let config = {};
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
      fileName: `${subdomain}.${domain}.com.conf`,
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
      fileName: `${subdomain}.${domain}.com.conf`,
    };
  }

  makeNginxFile(config);
  linkFile(config);
  restartNginx();
}

createProxyFlow();
