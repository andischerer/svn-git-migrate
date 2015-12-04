#!/usr/bin/env node

'use strict';

const fs = require('fs');

const meow = require('meow');
const Promise = require('pinkie-promise');

const svnGitMigrate = require('./');

const commands = {
	clone: '  clone: do a git svn clone',
	rebase: '  rebase: do a rebase of an already cloned svn repository',
	remotes: '  remotes: convert remote branches and tags to local ones',
	clean: '  clean: cleanup any git-svn repository information from repo',
	ignore: '  ignore: create .gitignore file from svn properties',
	all: '  all: runs clone, remotes and clean in sequence'
};

const helpText = [
	'Usage:',
	'  $ svn-git-migrate [COMMAND] <svn-repository-url>',
	'',
	'Commands'
];
for (const key of Object.keys(commands)) {
	helpText.push(commands[key]);
}

const cli = meow({
	help: helpText
}, {
	string: ['_']
});

const command = cli.input.shift();
const svnRepositoryUrl = cli.input.shift();
const flags = cli.flags;

function isGitRepository() {
	return fs.existsSync('.git');
}

if (commands.hasOwnProperty(command)) {
	switch (command) {
		case 'clone':
			if (svnRepositoryUrl) {
				svnGitMigrate.clone(svnRepositoryUrl, flags);
			} else {
				console.error('  Error: <svn-repository-url> is missing.');
				cli.showHelp();
			}
			break;
		case 'rebase':
			if (isGitRepository()) {
				svnGitMigrate.rebase(flags);
			} else {
				console.error('  ERROR: current working dir is not a git repository.');
				cli.showHelp();
			}
			break;
		case 'all':
			if (svnRepositoryUrl) {
				svnGitMigrate.clone(svnRepositoryUrl, flags)
					.then(repoName => {
						process.chdir(repoName);
						return Promise.resolve();
					})
					.then(svnGitMigrate.ignore)
					.then(svnGitMigrate.convertRemotes)
					.then(svnGitMigrate.clean)
					.then(() => {
						console.log('\n\nDONE');
					})
					.catch(err => console.error(err.message));
			} else {
				console.error('  Error: <svn-repository-url> is missing.');
				cli.showHelp();
			}
			break;
		case 'ignore':
			if (isGitRepository()) {
				svnGitMigrate.ignore();
			} else {
				console.error('  ERROR: current working dir is not a git repository.');
				cli.showHelp();
			}
			break;
		case 'remotes':
			if (isGitRepository()) {
				svnGitMigrate.convertRemotes();
			} else {
				console.error('  ERROR: current working dir is not a git repository.');
				cli.showHelp();
			}
			break;
		case 'clean':
			if (isGitRepository()) {
				svnGitMigrate.clean();
			} else {
				console.error('  ERROR: current working dir is not a git repository.');
				cli.showHelp();
			}
			break;
		default:
				// just for coding convention
			break;
	}
} else {
	console.error(`<svn-repository-url> is missing.`);
	cli.showHelp();
}
