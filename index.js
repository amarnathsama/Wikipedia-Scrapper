const axios = require("axios");
const cheerio = require("cheerio");
const { POINT_CONVERSION_COMPRESSED } = require("constants");
const { raw } = require("express");
const fs = require("fs");

function hasOwnProperty(obj, prop) {
    var proto = obj.__proto__ || obj.constructor.prototype;
    return prop in obj && (!(prop in proto) || proto[prop] !== obj[prop]);
}
// 1987
// 1985
// 1984
// 1983
// 1981
// 1980
// 1978
// 1977
// 1976
// 1975
// 1974
// 1973
// 1972
// 1971
// 1965
// 1920

function uniq(a) {
    return a.sort().filter(function (item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });
}

function cleanUpName(str) {
    str = str.trim();
    str = str.replace(/[\r\n]+/gm, "");
    if (str[0] === "[") str = str.substr(3);
    if (str[str.length - 1] === "]") {
        str = str.substr(0, str.length - 3);
    }
    str = str.trim();
    return str;
}
createMovieDatabase = async () => {
    let movieDatabase = [];
    for (let year = 2020; year >= 1920; year--) {
        //1920
        let isInDatabase = false;
        const page_url = `https://en.wikipedia.org/wiki/List_of_Bollywood_films_of_${year}`;
        const { data } = await axios.get(page_url);
        const $ = cheerio.load(data);
        const $table = $(`.wikitable`); //this line is giving error
        $table
            .slice(1)
            .find("tr")
            .each((j, row) => {
                const $row = $(row);
                let off = 0;
                let isValidEntry = true;
                let currentYearMovieDetails = {
                    year,
                };
                let effectiveIndex = 0;
                let isIt2011 = 0;
                let validColumnsReached = false;
                if (year == 2011) isIt2011 = 1;
                $row.find("td").each((k, element) => {
                    if (effectiveIndex - isIt2011 > 2) return;
                    const $element = $(element);
                    if (
                        $element.attr("rowspan") > 0 ||
                        !isNaN(Number($element.text()))
                    ) {
                        if (validColumnsReached) isValidEntry = false;
                        return;
                    }
                    if (isIt2011 == 1 && effectiveIndex == 1) {
                        effectiveIndex++;
                        return;
                    }
                    validColumnsReached = true;
                    if (effectiveIndex === 0)
                        currentYearMovieDetails.title = cleanUpName(
                            $element.text()
                        );
                    else if (effectiveIndex - isIt2011 === 1) {
                        let rawNames = $element.text().split(",");
                        let directors = [];
                        if (rawNames.length > 1) directors = rawNames;
                        else {
                            let li = 0;
                            for (let x = 1; x < rawNames[0].length; x++) {
                                if (
                                    /[a-zA-Z]/.test(rawNames[0][x]) &&
                                    rawNames[0][x] ==
                                        rawNames[0][x].toUpperCase() &&
                                    /[a-zA-Z]/.test(rawNames[0][x - 1]) &&
                                    rawNames[0][x - 1] !=
                                        rawNames[0][x - 1].toUpperCase()
                                ) {
                                    directors.push(
                                        rawNames[0].substr(li, x - li)
                                    );
                                    li = x;
                                }
                            }
                            directors.push(rawNames[0].substr(li));
                        }
                        currentYearMovieDetails.directors = [];
                        directors.forEach((actorName, l) => {
                            currentYearMovieDetails.directors.push(
                                cleanUpName(actorName)
                            );
                        });
                    } else {
                        let rawNames = $element.text().split(",");
                        let actors = [];
                        if (rawNames.length > 1) actors = rawNames;
                        else {
                            let li = 0,
                                cnt = 0;
                            for (let x = 1; x < rawNames[0].length; x++) {
                                if (
                                    /[a-zA-Z]/.test(rawNames[0][x]) &&
                                    rawNames[0][x] ==
                                        rawNames[0][x].toUpperCase() &&
                                    /[a-zA-Z]/.test(rawNames[0][x - 1]) &&
                                    rawNames[0][x - 1] !=
                                        rawNames[0][x - 1].toUpperCase()
                                ) {
                                    actors.push(rawNames[0].substr(li, x - li));
                                    li = x;
                                }
                            }
                            actors.push(rawNames[0].substr(li));
                        }
                        currentYearMovieDetails.actors = [];
                        actors.forEach((actorName, l) => {
                            currentYearMovieDetails.actors.push(
                                cleanUpName(actorName)
                            );
                        });
                    }
                    effectiveIndex++;
                });
                if (
                    isValidEntry &&
                    hasOwnProperty(currentYearMovieDetails, "title") &&
                    hasOwnProperty(currentYearMovieDetails, "directors") &&
                    hasOwnProperty(currentYearMovieDetails, "actors") &&
                    currentYearMovieDetails["title"].length > 0 &&
                    currentYearMovieDetails["directors"].length > 0 &&
                    currentYearMovieDetails["actors"].length > 0 &&
                    currentYearMovieDetails["actors"][0] != "" &&
                    currentYearMovieDetails["directors"][0] != ""
                )
                    movieDatabase.push(currentYearMovieDetails),
                        (isInDatabase = true);
            });
    }
    movieDatabase.sort();
    console.log(movieDatabase.length);
    fs.writeFile(
        "movieDatabase.json",
        JSON.stringify(movieDatabase),
        function (err) {
            if (err) throw err;
            console.log("complete");
        }
    );
};

createPopularActorDatabase = async () => {
    let popularActors = [];
    for (let pageNumber = 1; pageNumber <= 3; pageNumber++) {
        let page_url = `https://www.imdb.com/list/ls068010962/?sort=list_order,asc&mode=detail&page=${pageNumber}`;
        if (pageNumber == 3)
            page_url = `https://www.imdb.com/list/ls069958662/`;
        if (pageNumber == 4)
            page_url = `https://www.imdb.com/list/ls068664564/`;
        const { data } = await axios.get(page_url);
        const $ = cheerio.load(data);
        const $allNames = $(".lister-item-header a");
        $allNames.each((i, name) => {
            const $name = $(name);
            popularActors.push(cleanUpName($name.text()));
        });
    }
    uniq(popularActors);
    fs.writeFile(
        "popularActors.json",
        JSON.stringify(popularActors),
        function (err) {
            if (err) throw err;
            console.log("complete");
        }
    );
};

createPopularDirectorDatabase = async () => {
    const popularDirectors = [];
    const page_url = `https://www.imdb.com/list/ls022489127/`;
    const { data } = await axios.get(page_url);
    const $ = cheerio.load(data);
    const $allNames = $(".lister-item-header a");
    $allNames.each((i, name) => {
        const $name = $(name);
        popularDirectors.push(cleanUpName($name.text()));
    });
    uniq(popularDirectors);
    fs.writeFile(
        "popularDirectors.json",
        JSON.stringify(popularDirectors),
        function (err) {
            if (err) throw err;
            console.log("complete");
        }
    );
};

createPopularMovieDatabase = () => {
    const movieDatabase = require("./movieDatabase.json");
    const popularActors = require("./popularActors.json");
    const popularDirectors = require("./popularDirectors.json");
    // const filteredArray = array1.filter(value => array2.includes(value));
    let popularMovies = [];
    movieDatabase.forEach((movie) => {
        if (
            popularActors.filter((value) => movie.actors.includes(value))
                .length > 0 ||
            popularDirectors.filter((value) => movie.directors.includes(value))
                .length > 0
        ) {
            popularMovies.push(movie);
            // console.log(movie.title);
        }
    });
    fs.writeFile(
        "popularMovies.json",
        JSON.stringify(popularMovies),
        function (err) {
            if (err) throw err;
            console.log("complete");
        }
    );
    let popularMoviesSince1990 = [];
    popularMovies.forEach((movie) => {
        if (movie.year >= 1990) popularMoviesSince1990.push(movie);
    });
    console.log(popularMoviesSince1990.length);
    // fs.writeFile(
    //     "popularMoviesSince1990.json",
    //     JSON.stringify(popularMoviesSince1990),
    //     function (err) {
    //         if (err) throw err;
    //         console.log("complete");
    //     }
    // );
};

// createMovieDatabase();
// createPopularActorDatabase();
// createPopularDirectorDatabase();
createPopularMovieDatabase();
