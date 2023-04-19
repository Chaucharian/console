# Console

Console is a command-line interface (CLI) tool for deploying files to a remote server using SSH. It supports deploying files from a source directory on your local machine to a destination directory on the remote server.

A menu is also available to select some nginx configuration

## Usage

To use Console, open a terminal and navigate to the directory where your files are located. Then, run the following command:

```
console deploy [login] [sourcePath] [hostPath]
```

### Options

- `login`: The login credentials to use when connecting to the remote server. This should be in the format `username@hostname`.
- `sourcePath`: The path to the local directory containing the files you want to deploy.
- `hostPath`: The path to the remote directory where you want to deploy the files.

### Examples

To deploy the files in the current directory to the `/home/example` directory on the remote server at `example.com`, run the following command:

```
console deploy ssh@example.com . /home/example
```

## Installation

To install Console, you must have Node.js installed on your machine. Then, run the following command to install the package:

```
npm install -g @chaucharian/console
```

Once the package is installed, you can run the `console` command from any directory in your terminal.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
