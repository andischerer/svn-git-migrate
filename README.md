# svn-git-migrate

> Migrate to Git from SVN toolkit


## Install

```
$ npm install --global svn-git-migrate
```


## Usage

```
$ svn-git-migrate --help

  Migrate a svn repository to git

  Usage:
    $ svn-git-migrate [COMMAND] <svn-repository-url>

  Commands
    clone: do a git svn clone
    rebase: do a rebase of an already cloned svn repository
    remotes: convert remote branches and tags to local ones
    clean: cleanup any git-svn repository information from repo
    ignore: create .gitignore file from svn properties
    all: runs clone, remotes and clean in sequence
```


## License

MIT © [Andreas Scherer](https://github.com/andischerer)
