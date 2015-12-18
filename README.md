# svn-git-migrate

> Migrate to Git from SVN toolkit


## Install

Make sure you have git, git-svn, svn and sed installed and accessible via system path.
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
    all: runs clone, remotes, ignore and clean in sequence
```

## Migration variants
Make sure your svn credentials are cached before running the following commands.

Migrate sequentially:
```sh
svn-git-migrate clone http://svnserver/svn/demorepo --authors-file="authors.txt" demorepo

# fetch any following commits after clone
cd demorepo
svn-git-migrate rebase

# migrate to git (after running these commands a `svn-git-migrate rebase` doesent work anymore)
svn-git-migrate remotes
svn-git-migrate ignores
svn-git-migrate clean

# push repository to your prefered git backend
git remote add origin http://mygitbackend/myusername/demorepo.git
git push -u origin master
git push origin --all
git push origin --tags
```

Migrate at once:
```sh
svn-git-migrate all http://svnserver/svn/demorepo --authors-file="authors.txt" demorepo
cd demorepo

# push repository to your prefered git backend
git remote add origin http://mygitbackend/myusername/demorepo.git
git push -u origin master
git push origin --all
git push origin --tags
```


## License

MIT © [Andreas Scherer](https://github.com/andischerer)
