"use strict";

module.exports = {
	seasonPatt(file) { //For instance -> S02E05
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		let episode = /S\d+E\d+/gi.exec(file);
		if(!episode) return false;
		episode = episode[0].toUpperCase();
		return {episode, type: "tv"};
	},
	seasonXEpiNamePatt(file) { // For instance -> 1x02
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		let episode = /\d+x\d\d/gi.exec(file);
		if(!episode) return false;
		episode = episode[0];
		episode.indexOf("x") === 1 ? episode += "S0" : episode += "S";   //1x10 -> S01x10 or 19x09 -> S19x09
		episode = episode.replace(/x/gi, "E");
		return {episode, type: "tv"};
	},
	ifMovie(file) {
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		let name = /20\d+|19\d+/gi.exec(file);
		if(!name) return false;
		name = file.slice(0, name["index"]).replace(/\./g, " ").trim();
		return {name, type: "movie"};
	}
};
