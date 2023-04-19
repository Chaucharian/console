import fs from "fs";
import { exec } from "child_process";

const md = `# "Console"

"Console" is a command-line interface (CLI) tool for deploying files to a remote server using SSH. It supports deploying files from a source directory on your local machine to a destination directory on the remote server.

## Usage

To use "Console", open a terminal and navigate to the directory where your files are located. Then, run the following command:

\`\`\`
console deploy [login] [sourcePath] [hostPath]
\`\`\`

### Options

- \`login\`: The login credentials to use when connecting to the remote server. This should be in the format \`username@hostname\`.
- \`sourcePath\`: The path to the local directory containing the files you want to deploy.
- \`hostPath\`: The path to the remote directory where you want to deploy the files.

### Examples

To deploy the files in the current directory to the \`public_html\` directory on the remote server at \`example.com\`, run the following command:

\`\`\`
console deploy ssh@example.com . public_html
\`\`\`

To deploy the files in the \`dist\` directory to the \`www\` directory on the remote server at \`myserver.com\`, run the following command:

\`\`\`
console deploy me@myserver.com dist www
\`\`\`

## Installation

To install "Console", you must have Node.js installed on your machine. Then, run the following command to install the package:

\`\`\`
npm install -g console-deploy
\`\`\`

Once the package is installed, you can run the \`console\` command from any directory in your terminal.

## License

This project is licensed under the MIT License. See the LICENSE file for details.`;

// Write the markdown file
fs.writeFileSync("README.md", md);

// Copy the markdown to clipboard
if (process.platform === "darwin") {
  exec("pbcopy", { input: md });
  console.log("Markdown copied to clipboard");
} else {
  console.log("Markdown copied to console (not supported on this platform)");
  console.log(md);
}
