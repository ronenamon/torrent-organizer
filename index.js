"use strict";

///basePath = basePath + "/"; //Adding "/" instead of "\" because I can use find the first one in an array and second is a escape char (Decrepted, I guess)
//basePath = basePath.replace(/\\/g, "/"); //Oct 29 2016, Changed this
const fs = require("fs");
const HelperFuncs = require("./helper");
const SubsFuncs = require("./fixSubs");
const GetFilesFuncs = require("./getFiles.js");
const RenameFuncs = require("./renamefile");

const Helper = new HelperFuncs();
const Subs = new SubsFuncs();
const GetFiles = new GetFilesFuncs();
const Rename = new RenameFuncs();

/* Start of the Function */
(async function () {
	try {
		let basePath = "H:/Tv Shows".replace(/\\/g, "/");
		if(!basePath) return;
		if(basePath[basePath.length - 1] !== "/") basePath += "/";
		let files = GetFiles.readFiles(basePath);
		let {dirs, video, other} = filterFiles(files);
		let shows = getShows(video);
		let [apiData, posters] = await getApiData(shows);
		let randomFolder = Helper.generateRandomFolderName();
		await makeShowFolders({basePath, randomFolder, shows, posters});
		await Promise.all(other.map(async file => await whatToDoWithFile({basePath, randomFolder, file, apiData})));
		console.log("Removing dirs");
		removeDirs(dirs);
	} catch(e) {
		console.log("Organize error");
		console.log(new Error(e));
	}
})();

/* Gets shows data through OmdbAPI with their poster url's */
function getApiData(shows) {
	try {
		return new Promise(async resolve => {
			let [apiData, posters] = [[],[]];
			for(let showName of Object.keys(shows)) {
				let {season} = shows[showName];
				showName = showName.split(" ").join("%20"); //For api
				let {Poster} = await Helper.getData(`/?t=${showName}`);
				posters.push({title: showName, url: Poster});
				for(let item of season) {
					apiData.push(await Helper.getData(`/?t=${showName}&Season=${item}`));
				}
			}
			apiData = apiData.filter(({Response}) => Response === "True");
			posters = posters.filter(({url, title}) => url && title);
			resolve([apiData, posters]);
		});
	} catch(e) {
		console.log("Execute API error");
		console.log(new Error(e));
	}
}

/* Renames video and sub files, removes hearing aid from subs and delete files other than video files */
async function whatToDoWithFile(info) {
	try {
		let ext = info.file.slice(info.file.length - 4, info.file.length);
		if (ext === ".srt") Subs.fixSubs(info.file);
		/\.mkv|\.mp4|\.srt|\.avi/g.test(ext) ? await Rename.renameFile({...info, ext}) : fs.unlinkSync(info.file);
	} catch(e) { console.log(e); }
}

/* Gets show names with their respective season numbers */
function getShows(files) {
	let shows = {};
	files.map(file => {
		let {name, season} = Helper.getFileStats(file);
		if(!name) return;
		let sameShow = Helper.sameShow(shows, name, season);
		if(!sameShow) { shows[name] = {season: [season], length: 1}; return; } //New show detected
		if(!sameShow.newSeason) return; //Same show detected
		shows[name].season.push(season); //Same show but different season
		shows[name].length += 1;
	});
	return shows;
}

/* Removes empty dirs after the rename of the files */
function removeDirs(files) {
	files.map(file => fs.rmdirSync(file)); //This just does not throw any errors
}

/* Makes folder for the shows with; Season and showName */
function makeShowFolders({basePath, randomFolder, shows, posters}) {
	try {
		return new Promise(async resolve => {
			makeInitialFolders({basePath, randomFolder});
			basePath += `${randomFolder}/`;
			for(let showName of Object.keys(shows)) {
				let {season} = shows[showName];
				fs.mkdirSync(`${basePath}${showName}`);
				await savePosters({basePath, showName, posters});
				season.map(season => fs.mkdirSync(`${basePath}${showName}/Season ${season}`));
			}
			console.log("Done!");
			resolve();
		});
	} catch(e) {
		console.log("Make Show Folders Error");
		console.log(new Error(e));
	}
}

/*Makes the random folder and the no match folder */
function makeInitialFolders({basePath, randomFolder}) {
	fs.mkdirSync(`${basePath}${randomFolder}`);
	fs.mkdirSync(`${basePath}${randomFolder}/No Match Found`);
}

/* Downloads and save posters */
async function savePosters({basePath, posters, showName}) {
	try {
		for(let {title, url} of posters) {
			title = title.replace(/%20/g, "").toLowerCase();
			title === showName.replace(/\s/gi, "").toLowerCase() ?
				await Helper.saveImage(url, `${basePath}${showName}/${showName}.jpg`) : "";
		}
	} catch(e) { console.log(e); }
}

/*
	Filters files into video files, directories and other files. Sorts the directories from deepest to outmost.
*/
function filterFiles(files) {
	let [dirs, video, other] = [[],[],[]];
	files.map(file => {
		let response = Helper.getFileStats(file);
		if(Helper.isDir(file)) { dirs.push(file); return; }
		if(response && /\.mkv|\.mp4|\.avi|/.test(file)) video.push(file);
		other.push(file);
	});
	return {dirs: dirs.sort((a, b) => b.length - a.length), video, other};
}
