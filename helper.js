"use strict";

const fs = require("fs");
const patts = require("./patterns");
const https = require("https");

module.exports = function () {

	this.isDir = file => fs.statSync(file).isDirectory() ? true : false;

	this.disectArrayAndPush = (path, deeperDir, arr) => {
		deeperDir.map(item => arr.push(path + item));
		return arr;
	};

	/* file => get Season and episode pattern and if movies, get it's name */
	this.isMatch = files => {
		let keys = Object.keys(patts);
		for(let i = 0; i < keys.length; i+=1) {
			let objFunc = patts[keys[i]](files);
			if(!objFunc) continue;
			return objFunc;
		}
		return {response: false};
	};

	/*
		Helps getShows to figure out if this show is already found but this file is of different season.
		{name: props} is returned because the same show can have files with different names Mr robot and mr robot
	*/
	this.sameShow = (shows, title, season) => {
		for(let prop in shows) {
			if(!new RegExp(title + "$", "i").test(prop)) continue;
			if(shows[prop].season.indexOf(season) === -1) return {newSeason: true, name: prop};
			return {newSeason: null, name: prop}; //If not same season but same shows
		}
		return false;
	};

	/* Saves poster */
	this.saveImage = (url, name) => {
		return new Promise(resolve => {
			let file = fs.createWriteStream(name);
			https.get(url, response => { response.pipe(file); resolve(); });
		}).catch(e => console.log(e));
	};

	/* Gets shows and posters from omdbapi */
	this.getData = reqPath => {
		return new Promise(resolve => {
			let options = {
				host: "www.omdbapi.com",
				path: reqPath,
				method: "GET",
				headers: {"Content-Type": "application/json"}
			};
			https.request(options).on("response", res => {
				let output = "";
				res.setEncoding("utf8");
				res.on("data", chunk => output += chunk);
				res.on("end", () => resolve(JSON.parse(output)) );
			}).end();
		}).catch(e => console.log("getData " + new Error(e)));
	};

	/* Matches the found title with the api title word by word -> mr robot -> mr, check with api title -> robot, check with api title */
	function compareShowNameWithApi(name, apiName) {
		if(!name) return false;
		let nameSplit = name.split(" ");
		let matches = 0;
		nameSplit.forEach(item => new RegExp(item, "gi").test(apiName) ? matches += 1 : "");
		return matches === nameSplit.length ? true : false;
	}

	this.getEpisodeTitleAndShowName = ({name, season, episode}, showsData) => {
		let title;
		showsData.forEach(show => {
			let isName = compareShowNameWithApi(name, show.Title);
			if(!isName || show.Season != season) return;
			episode < 10 ? episode = parseInt(episode) : episode;
			show.Episodes.forEach(({Episode, Title}) => episode == Episode ? title = Title : "");
		});
		return title ? title.replace(/[^\w\s-\.$]/gi, "") : null; //Repalace is for weird titles like - Horseback Riding\Man Zone
	};

	/* Outputs season, Show name and episode number*/
	this.getFileStats = ({file, episode}) => {
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " "); // "path/New Girl HDTV.LOL S02E01.mp4" -> "/New Girl HDTV LOL S02E01 mp4"
		let indexE = /e/gi.exec(episode)["index"];
		return {
			season: parseInt(episode.slice(1, indexE)), // S02E01 -> 02
			name: file.indexOf(episode) !== 0 ? file.slice(0, file.indexOf(episode) - 1).replace(/\(\s*[^)]*\)/g, "")
				.replace(/\[\s*[^\]]*\]/g, "").replace(/\/\\/g, "").trim() : null, // "/Shameless S02E02" -> "Shameless" or "[something] Fargo -> Fargo"
			episode: episode.slice(indexE + 1, episode.length) //S01E02 -> 02
		};
	};

	/* Generated random folder name to organize the shows */
	this.generateRandomFolderName = () => {
		let letters = ["A","B","C","D","E","F","G","H","I","J","K","L","M","N","O","P","Q","R","S","T","U","V","W","X","Y","Z"];
		let randomString = [];
		for(let i = 0; i < 6; i+=1) {
			let ran = letters[Math.floor(Math.random() * letters.length)];
			if(Math.random() < 0.699) ran = ran.toLowerCase(); //So that it gives equal change to Upper case and lower case alphabets maybe (I'll check it later)
			randomString.push(ran);
		}
		return randomString.join("");
	};
};
