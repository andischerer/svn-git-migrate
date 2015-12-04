'use strict';

const childProcess = require('child_process');
const path = require('path');
const fs = require('fs');

const ini = require('ini');
const del = require('del');
const Promise = require('pinkie-promise');
const sanitizeFilename = require('sanitize-filename');
const mkdirp = require('mkdirp');
const url = require('url');
const decamelizeKeys = require('decamelize-keys');

const TAG_PATH = '.git/refs/tags';
const BRANCH_PATH = '.git/refs/heads';
const GIT_CONFIG_PATH = '.git/config';

function execCommand(gitArgs) {
	return new Promise((resolve, reject) => {
		console.log('starting: ', `git ${gitArgs.join(' ')}`);

		const child = childProcess.spawn('git', gitArgs);
		child.stdout.pipe(process.stdout);
		child.stderr.pipe(process.stderr);
		child.on('close', code => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error('git svn clone failed'));
			}
		});
	});
}

function parseOptions(options) {
	const gitArgs = [];
	if (options) {
		options = decamelizeKeys(options, '-');
		for (const key of Object.keys(options)) {
			if (typeof options[key] === 'boolean') {
				gitArgs.push(`--${key}`);
			} else {
				gitArgs.push(`--${key}=${options[key]}`);
			}
		}
	}
	return gitArgs;
}

function migrate() {}

migrate.clone = function (svnRepoUrl, options) {
	const urlParts = url.parse(svnRepoUrl);
	const urlPathList = urlParts.path.replace(/\/+$/, '').split('/');
	const repoName = urlPathList.pop();
	del.sync(repoName);

	const gitArgs = [
		'svn',
		'clone'
	];
	gitArgs.push(svnRepoUrl);
	gitArgs.push('--stdlayout');

	return execCommand(gitArgs.concat(parseOptions(options))).then(() => Promise.resolve(repoName));
};

migrate.rebase = function (options) {
	const gitArgs = [
		'svn',
		'rebase'
	];

	return execCommand(gitArgs.concat(parseOptions(options)));
};

migrate.convertRemotes = function () {
	return new Promise(resolve => {
		const out = childProcess.execSync('git show-ref').toString();
		const lines = out.split('\n').map(line => line.trim());

		// create necessary Folders
		mkdirp.sync('.git/refs/heads');
		mkdirp.sync('.git/refs/tags');

		lines.forEach(line => {
			if (line === '') {
				return;
			}
			const lineParts = line.split(' ');
			const ref = lineParts[0];
			const remotePath = lineParts[1];

			// skip local refs and deleted branches which could not referenced by git svn
			if (remotePath.startsWith('refs/remotes/') && !remotePath.includes('@')) {
				let remoteName = sanitizeFilename(decodeURI(remotePath.split('/').pop()));
				// and whitespaces
				remoteName = remoteName.replace(/ +/g, '-');

				let convertedRefsFilePath;
				let remoteType;
				if (remotePath.startsWith('refs/remotes/origin/tags/')) {
					// we have a tag
					convertedRefsFilePath = path.join(TAG_PATH, remoteName);
					remoteType = 'tag';
				} else if (remotePath.startsWith('refs/remotes/origin/')) {
					// we have a branch
					convertedRefsFilePath = path.join(BRANCH_PATH, remoteName);
					remoteType = 'branch';
				}
				fs.writeFileSync(convertedRefsFilePath, ref, 'utf8');
				console.log(`Local ${remoteType} "${remoteName}" created`);
			}
		});

		console.log('All remotes converted to local tags and branches');
		resolve();
	});
};

migrate.ignore = function () {
	const output = childProcess.execSync('git svn create-ignore').toString();
	console.log(output);
	console.log('.gitignore done');
	return Promise.resolve();
};

migrate.clean = function () {
	// remove git-svn-id in commits (not for windows, sed is missing)
	if (/^win/.test(process.platform) === false) {
		const branches = childProcess.execSync('git branch').toString();
		const branchList = branches.split('\n');
		branchList.forEach(line => {
			const lineParts = line.split(' ');
			const branchName = lineParts.pop().trim();
			if (branchName !== '') {
				childProcess.execSync(`git checkout ${branchName}`);
				const output = childProcess.execSync('git filter-branch -f --msg-filter \'sed -e "/git-svn-id:/d"\'').toString();
				console.log(output);
			}
		});
		childProcess.execSync('git checkout master');
	}

	// remove git-svn specific folders
	del.sync('.git/refs/remotes');
	del.sync('.git/svn');

	// cleanup ini
	const gitConfig = ini.parse(fs.readFileSync(GIT_CONFIG_PATH, 'utf-8'));
	delete gitConfig['svn-remote "svn"'];
	delete gitConfig.svn;
	fs.writeFileSync(GIT_CONFIG_PATH, ini.stringify(gitConfig));

	console.log('SVN-References cleaned');
};

module.exports = migrate;