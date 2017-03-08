"use strict";

const fs = require("fs");
const HelperFuncs = require("./helper");

const Helper = new HelperFuncs();

module.exports = function() {

	/*
		Renames file with their matched names ->
			if !match found -> renames with same name to "No match Found"
			if match found with a title -> renames it to it's respective season folder
			if match found without a title -> renames it to it's respective season folder without adding title
	*/
	this.renameFile = ({basePath, randomFolder, file, apiData, ext}) => {
		return new Promise(resolve => {
			let fileName = file.slice(file.lastIndexOf("/"), file.length);
			let {res, name, season, episode, title} = findCorrectNames(fileName, apiData);
			if(res === null) { fs.renameSync(file, `${basePath}${randomFolder}/No Match Found${fileName}`); resolve(); }//Return null -> Just move it to new folder
			basePath = `${basePath}${randomFolder}/${name}/Season ${season}`;
			let baseName = `${basePath}/${name} S${season < 10 ? "0" + season : season}E${episode}`; //For instance - Broad City S01E02
			res ? fs.renameSync(file, `${baseName} - ${title}${ext}`) : fs.renameSync(file, `${baseName}${ext}`);
			resolve();
		}).catch(e => console.log(e));
	};

	/*
		Gets all the files video and the others. Finds title for each of them, if found returns title, if not return name
		if name not found - returns null
	*/
	function findCorrectNames(file, apiData) {
		let {name, season, episode} = Helper.getFileStats(file);
		if(!name) return {res: null};
		let title = getEpisodeTitle({name, season, episode}, apiData);
		return title ? { episode, title, name, season, res: true } : { res: false, name, season, episode };
	}

	/*Finds title by matching Episode number with apiData's Episode Number */
	function getEpisodeTitle({name, season, episode}, apiData) {
		let title;
		apiData.forEach(currShow => {
			if(name !== currShow.Title) return;
			episode < 10 ? episode = parseInt(episode) : episode;
			currShow.Episodes.forEach(({Episode, Title}) => episode == Episode ? title = Title : "");
		});
		return title ? title.replace(/[^\w\s-\.]/gi, "") : null; //Repalce is for weird titles like - Horseback Riding\Man Zone
	}

};
