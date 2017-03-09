"use strict";

///basePath = basePath + "/"; //Adding "/" instead of "\" because I can use find the first one in an array and second is a escape char (Decrepted, I guess)
//basePath = basePath.replace(/\\/g, "/"); //Oct 29 2016, Changed this
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
		let basePath = "H:/Movies".replace(/\\/g, "/");
		if(!basePath) return;
		if(basePath[basePath.length - 1] !== "/") basePath += "/";
		let files = GetFiles.readFiles(basePath);
		let {dirs, video, other} = filterFiles(files);
		let [shows, movies] = filterShowsAndMovies(video);
		console.log("Filtered movies and shows");
		let [showsData, posters, moviesData] = await apiShowsAndMovies(shows, movies);
		basePath += Helper.generateRandomFolderName();
		await makeShowAndMoviesFolders({basePath, shows, posters, "movies": moviesData});
		console.log("created folders");
		let newNames = findNewNamesForFiles({video, showsData, moviesData});
		console.log("found names");
		newNames.map(({oldFile, newFile}) => fs.renameSync(oldFile, basePath + newFile));
		other.map(file => whatToDoWithFile(file, basePath));
		console.log("Removing dirs");
		removeDirs(dirs);
	} catch(e) {
		console.log("Organize error");
		console.log(new Error(e));
	}
})();


function findNewNamesForFiles({video, showsData, moviesData}) {
	let names = [];
	video.map(file => {
		file.type === "movie" ? names.push(findNewNameForMovie(file, moviesData)) :
		names.push(findNewNameForShow(file, showsData));
	});
	return names;
}

function findNewNameForShow(fileData, showsData) {
	let newFile = {oldFile: fileData.file};
	let ext = fileData.file.slice(fileData.file.length - 4, fileData.file.length);
	let showStats = Helper.getFileStats({file: fileData.file, episode: fileData.episode});
	let title = Helper.getEpisodeTitle(showStats, showsData);
	let {name, season, episode} = showStats;
	let baseName = `/Tv Shows/${name}/Season ${season}/${name} S${season < 10 ? "0" + season : season}E${episode}`;
	title ? newFile["newFile"] = `${baseName} - ${title}${ext}` :
		newFile["newFile"] = baseName + ext;
	return newFile;
}

function findNewNameForMovie({file, name}, moviesData) {
	let newFile = {oldFile: file};
	file = file.slice(file.lastIndexOf("/") + 1, file.length);
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
	if(ext === ".srt") Subs.fixSubs(file);
	/\.mkv|\.mp4|\.srt|\.avi/g.test(ext) ? fs.renameSync(file, `${basePath}/No Match Found/${fileName}`) : fs.unlinkSync(file);
}


/* Gets shows data through OmdbAPI with their poster url's */
function apiShowsAndMovies(shows, movies) {
	try {
		return new Promise(async resolve => {
			let [showsData, posters] = await apiShows(shows);
			let moviesData = await apiMovies(movies);
			resolve([showsData, posters, moviesData]);
		});
	} catch(e) {
		console.log("Execute API error");
		console.log(new Error(e));
	}
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
	} catch(e) { console.log("apiMovies Error"); console.log(new Error(e)); }

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
	} catch(e) { console.log("apiMovies Error"); console.log(new Error(e)); }
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
			console.log("Done!");
			resolve();
		});
	} catch(e) {
		console.log("Make Show Folders Error");
		console.log(new Error(e));
	}
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
	} catch(e) { console.log("makeShowsFolders error"); console.log(new Error(e)); }
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
				await Helper.saveImage(Poster, `${basePath}/Movies/${folder}/${Title}.jpg`);
			}
			resolve();
		});
	} catch(e) { console.log("makeMoviesFolders error"); console.log(new Error(e)); }
}

/* Downloads and save posters */
async function savePosters({basePath, posters, showName}) {
	try {
		for(let {title, url} of posters) {
			title = title.replace(/%20/g, "").toLowerCase();
			title === showName.replace(/\s/gi, "").toLowerCase() ?
				await Helper.saveImage(url, `${basePath}/Tv Shows/${showName}/${showName}.jpg`) : "";
		}
	} catch(e) { console.log(e); }
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
		type && /\.mkv|\.mp4|\.srt|\.avi/gi.test(file) ? video.push({file, type, episode, name}) : other.push(file);
	});
	return {dirs: dirs.sort((a, b) => b.length - a.length), video, other};
}
