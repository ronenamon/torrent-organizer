"use strict";

const fs = require("fs");
const HelperFuncs = require("./helper");
const SubsFuncs = require("./fixSubs");
const GetFilesFuncs = require("./getFiles.js");

const Helper = new HelperFuncs();
const Subs = new SubsFuncs();
const GetFiles = new GetFilesFuncs();

/* Start of the Function */
(async function () {
	try {
		if(!process.argv[2]) console.log("Invalid Path");
		let basePath = process.argv[2].replace(/\\/g, "/");
		if(basePath[basePath.length - 1] !== "/") basePath += "/";
		console.time("It took");
		console.log(`Organizing ${basePath}`);
		console.log("Reading Files");
		let files = GetFiles.readFiles(basePath);
		console.log("Filtering Files into video, directories and other files");
		let {dirs, video, other} = filterFiles(files);
		console.log("Filtering movies and tv shows files");
		let [shows, movies] = filterShowsAndMovies(video);
		console.log("Getting shows and movies data from OmdbAPI.com");
		let [showsData, posters, moviesData] = await apiShowsAndMovies(shows, movies);
		console.log("Making new folders for movies and tv shows");
		basePath += Helper.generateRandomFolderName();
		await makeShowAndMoviesFolders({basePath, shows, posters, "movies": moviesData});
		console.log("Finding new names for movies and tv shows");
		let newNames = findNewNamesForFiles({video, showsData, moviesData});
		console.log("Renaming files");
		newNames.map(({oldFile, newFile}) => fs.renameSync(oldFile, basePath + newFile));
		other.map(file => whatToDoWithFile(file, basePath)); //It will deal with all the srt, false positives in movies, and tv shows and other files
		console.log("Deleting uneccesary files");
		removeDirs(dirs);
		console.log("Your organized files are in - " + basePath);
		console.timeEnd("It took");
	} catch(e) { console.log("Organize " + new Error(e)); }
})();


function findNewNamesForFiles({video, showsData, moviesData}) {
	let names = [];
	video.map(file => {
		file.type === "movie" ? names.push(findNewNameForMovie(file, moviesData)) :
		names.push(findNewNameForShow(file, showsData));
	});
	return names.filter(({newFile}) => newFile); //No API Match but pattern match
}

function findNewNameForShow(fileData, showsData) {
	let newFile = {oldFile: fileData.file};
	let ext = fileData.file.slice(fileData.file.length - 4, fileData.file.length);
	if(ext === ".srt") Subs.fixSubs(fileData.file);
	let showStats = Helper.getFileStats({file: fileData.file, episode: fileData.episode});
	let title = Helper.getEpisodeTitle(showStats, showsData);
	let {name, season, episode} = showStats;
	if(!name) return newFile; //False positive
	let baseName = `/Tv Shows/${name}/Season ${season}/${name} S${season < 10 ? "0" + season : season}E${episode}`;
	title ? newFile["newFile"] = `${baseName} - ${title}${ext}` :
		newFile["newFile"] = baseName + ext;
	return newFile;
}

function findNewNameForMovie({file, name}, moviesData) {
	let newFile = {oldFile: file};
	file = file.slice(file.lastIndexOf("/") + 1, file.length);
	if(ext === ".srt") Subs.fixSubs(file);
	let ext = file.slice(file.length - 4, file.length);
	moviesData.map(item => {
		if(name !== item.Title) return;
		let {Title, Year, Runtime, Rating} = item;
		newFile["newFile"] = `/Movies/${Title} ${Year} (${Runtime}) (${Rating})/${Title} ${Year}${ext}`;
	});
	return newFile;
}

/* Renames video and sub files, removes hearing aid from subs and delete files other than video files */
function whatToDoWithFile(file, basePath) {
	let fileName = file.slice(file.lastIndexOf("/") + 1, file.length);
	let ext = file.slice(file.length - 4, file.length);
	/\.mkv|\.mp4|\.srt|\.avi/g.test(ext) ? fs.rename(file, `${basePath}/No Match Found/${fileName}`, () => "") : fs.unlinkSync(file);
}


/* Gets shows data through OmdbAPI with their poster url's */
function apiShowsAndMovies(shows, movies) {
	try {
		return new Promise(async resolve => {
			let [showsData, posters] = await apiShows(shows);
			let moviesData = await apiMovies(movies);
			resolve([showsData, posters, moviesData]);
		});
	} catch(e) { console.log("Execute API " + new Error(e)); }
}

/* Gets movies Data form api */
async function apiMovies(movies) {
	try {
		return new Promise(async resolve => {
			let apiData = [];
			for(let movie of movies) {
				movie = movie.split(" ").join("%20");
				let {Title, Year, Poster, Runtime, imdbRating, Response} = await Helper.getData(`/?t=${movie}`);
				apiData.push({Title, Year, Poster, Runtime, Rating: imdbRating, Response});
			}
			resolve(apiData.filter(({Response}) => Response === "True"));
		});
	} catch(e) { console.log("apiMovies "); console.log(new Error(e)); }

}

/* Gets shows data from api */
async function apiShows(shows) {
	try {
		return new Promise(async resolve => {
			let [apiData, posters] = [[], []];
			for(let showName of Object.keys(shows)) {
				let {season} = shows[showName];
				showName = showName.split(" ").join("%20"); //For api
				let baseUrl = `/?t=${showName}`;
				let {Poster} = await Helper.getData(baseUrl);
				posters.push({title: showName, url: Poster});
				for(let item of season) { apiData.push(await Helper.getData(`${baseUrl}&Season=${item}`)); }
			}
			resolve([apiData.filter(({Response}) => Response === "True"), posters.filter(({url, title}) => url && title)]);
		});
	} catch(e) { console.log("apiMovies "); console.log(new Error(e)); }
}

/* Gets show names with their respective season numbers */
function filterShowsAndMovies(video) {
	let [shows, movies] = [{}, []];
	video.map(({file, type, episode, name}) => {
		if(type === "movie") return movies.length ? movies.indexOf(name) === -1 ? movies.push(name) : "" : movies.push(name);
		{
			let {name, season} = Helper.getFileStats({file, episode, type});
			if(!name) return;
			let sameShow = Helper.sameShow(shows, name, season);
			if(!sameShow) { shows[name] = {season: [season], length: 1}; return; } //New show detected
			if(!sameShow.newSeason) return; //Same show detected
			shows[name].season.push(season); //Same show but different season
			shows[name].length += 1;
		}
	});
	return [shows, movies];
}

/* Removes empty dirs after the rename of the files */
function removeDirs(files) {
	files.map(file => fs.rmdirSync(file)); //This just does not throw any errors
}

/* Makes folder for shows and movies */
function makeShowAndMoviesFolders({basePath, shows, posters, movies}) {
	try {
		return new Promise(async resolve => {
			fs.mkdirSync(basePath);
			["Tv Shows", "Movies", "No Match Found"].map(str => fs.mkdirSync(`${basePath}/${str}`)); //Initial Folders
			await Promise.all([makeShowsFolders({shows, basePath, posters}), makeMoviesFolders(movies, basePath)]);
			resolve();
		});
	} catch(e) { console.log("Make Show Folders " + new Error(e)); }
}

/* Makes folder for the shows with; Season and showName */
function makeShowsFolders({shows, posters, basePath}) {
	try {
		return new Promise(async resolve => {
			for(let showName of Object.keys(shows)) {
				let {season} = shows[showName];
				fs.mkdirSync(`${basePath}/Tv Shows/${showName}`);
				await savePosters({basePath, showName, posters});
				season.map(season => fs.mkdirSync(`${basePath}/Tv Shows/${showName}/Season ${season}`));
			}
			resolve();
		});
	} catch(e) { console.log("makeShowsFolders "); console.log(new Error(e)); }
}

/* Makes folder for the movies with name, year, rating and runtime */
function makeMoviesFolders(movies, basePath) {
	try {
		return new Promise(async resolve => {
			for(let movie of movies) {
				let keys = Object.keys(movie);
				keys.splice(2, 1); //Remove Poster
				keys.forEach(item => movie[item] = movie[item].replace(/[\|><\*:\?\"/\/]/g, ""));
				let {Title, Rating, Poster, Runtime, Year} = movie;
				let folder = `${Title} ${Year} (${Runtime}) (${Rating})`;
				fs.mkdirSync(`${basePath}/Movies/${folder}`);
				if(Poster !== "N/A") await Helper.saveImage(Poster, `${basePath}/Movies/${folder}/${Title}.jpg`);
			}
			resolve();
		});
	} catch(e) { console.log("makeMoviesFolders " + new Error(e)); }
}

/* Downloads and save posters */
async function savePosters({basePath, posters, showName}) {
	try {
		for(let {title, url} of posters) {
			title = title.replace(/%20/g, "").toLowerCase();
			title === showName.replace(/\s/gi, "").toLowerCase() ?
				await Helper.saveImage(url, `${basePath}/Tv Shows/${showName}/${showName}.jpg`) : "";
		}
	} catch(e) { console.log("savePosters " + new Error(e)); }
}

/*
	Filters files into video files, directories and other files. Sorts the directories from deepest to outmost.
*/
function filterFiles(files) {
	let [dirs, video, other] = [[],[],[]];
	files.map(file => {
		if(Helper.isDir(file)) { dirs.push(file); return; }
		let {episode = null, type, name = null} = Helper.isMatch(file);
		if(/Sample/gi.test(file)) { other.push(file); return; }
		if(type && /\.mkv|\.mp4|\.srt|\.avi/gi.test(file)) video.push({file, type, episode, name});
		other.push(file);
	});
	return {dirs: dirs.sort((a, b) => b.length - a.length), video, other};
}
