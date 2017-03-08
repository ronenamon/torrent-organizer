"use strict";

module.exports = {
	seasonPatt(file) { //For instance -> S02E05
		let episode = /(S|s)\d+(E|e)+\d\d/g.exec(file);
		if(!episode) return { response: false };
		episode = episode[0].toUpperCase();
		return {episode, response: true};
	},
	seasonXEpiNamePatt(file) { // For instance -> 1x02
		let episode = /\d+x\d\d/gi.exec(file);
		if(!episode) return {response: false};
		episode = episode[0];
		episode.indexOf("x") === 1 ? episode += "S0" : episode += "S";   //1x10 -> S01x10 or 19x09 -> S19x09
		episode = episode.replace(/x/gi, "E");
		return {episode, response: true};
	}
};
