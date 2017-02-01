require('babel-polyfill');
require('babel-register')({
    presets: ['latest', 'stage-0'],
    ignore: /node_modules/,
    //plugins: ["transform-async-to-generaator"]
});

const jsonfile = require('jsonfile');
const scrape = require('./scraper').default;
const moment = require('moment');


const fromAirports = ['CPH'];
const toAirports = ['ROM', 'PAR', 'BCN'];

const fromArrivalDate = moment('2017-06-01');
const toArrivalDate = moment('2017-06-15');

const period = 14;
const deviation = 3;


scrape(fromArrivalDate, toArrivalDate, period, fromAirports, toAirports, deviation).then((data) => {
    var file = 'data.json';
    jsonfile.writeFileSync(file, data);
    var minPrice = data.results.reduce((prev, cur) => prev.totalPrice < cur.totalPrice ? prev : cur);
    console.log(minPrice);
});

