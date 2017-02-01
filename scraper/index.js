const Nightmare = require('nightmare');
const moment = require('moment');


async function fakeSearch() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log('faking search...');
            resolve({ lala: 1 });
        }, 100);
    });
}

async function scrapePeriod(arrival, departure, period, fromAirports, toAirports) {
    const results = [];
    for (let i = 0; i < fromAirports.length; i++) {
        for (let j = 0; j < toAirports.length; j++) {
            console.log(`---- Scraping from ${fromAirports[i]} to ${toAirports[j]}`);

            try {
                const result = await search(fromAirports[i], toAirports[j], arrival, departure, period);
                results.push(result);   
            } catch (error) {
                console.log(`---- Scraping failed: ${error}`);
            }
        }
    }

    return results;
}

export default async function doScraping(fromArrivalDate, toArrivalDate, defaultPeriod, fromAirports, toAirports, maximumDeviation) {
    const scrapingResult = { results: [], scrapingTime: new Date() };

    for (let arrival = moment(fromArrivalDate); arrival.diff(toArrivalDate, 'days') <= 0; arrival.add(1, 'days')) {
        for (let deviation = -maximumDeviation; deviation <= maximumDeviation; deviation++) {
            const period = defaultPeriod + deviation;
            let departure = moment(arrival).add(period, 'days');

            console.log(`-- Scraping from ${arrival.format('DD-MM-YYYY')} to ${departure.format('DD-MM-YYYY')}`)
            const results = await scrapePeriod(arrival, departure, period, fromAirports, toAirports);
            scrapingResult.results = scrapingResult.results.concat(results);
        }
    }

    return scrapingResult;
};


function search(from, to, arrival, departure, period) {
    const nightmare = Nightmare({ waitTimeout: 60000 });
    const searchUrl = getSearchString(from, to, arrival, departure);
    const arrivalString = arrival.format('DD-MM-YYYY');
    const departureString = departure.format('DD-MM-YYYY');

    console.log(`Searching with: ${searchUrl}`);
    return nightmare
        .goto(searchUrl)
        .wait('#searchProgressText')
        .wait(function () {
            return document.querySelector('#searchProgressText').innerText === 'Search complete';
        })
        .click('#flight-tickets-sortbar-bestdeal')
        .evaluate(function () {
            const result = {};

            const firstResultBox = document.querySelector('.result-boxes .result-box:first-child');
            result.totalPrice = firstResultBox.querySelector('.ticketinfo .price-total .price').innerText;
            result.singlePrice = firstResultBox.querySelector('.ticketinfo .price-pax .price').innerText;
            result.segments = [];
            result.score = firstResultBox.querySelector('.rating .value').innerText;
            const segments = firstResultBox.querySelectorAll('.segments .segment');

            for (let i = 0; i < segments.length; i++) {
                const segment = segments[i];
                const segmentData = {};
                segmentData.name = segment.querySelector('.names').innerText;
                segmentData.duration = segment.querySelector('.duration .travel-time').innerText;
                segmentData.stops = segment.querySelector('.duration .travel-stops .total').innerText;
                result.segments.push(segmentData);
            }

            return result;
        })
        .end()
        .then(function (result) {
            result.searchUrl = searchUrl;
            result.from = from;
            result.to = to;
            result.arrival = arrivalString;
            result.departure = departureString;
            result.period = period;

            return result;
        })
}

function getSearchString(from, to, arrival, departure) {
    return `http://www.momondo.com/flightsearch/?Search=true&TripType=2&SegNo=2&SO0=${from}&SD0=${to}&SDP0=${arrival.format('DD-MM-YYYY')}&SO1=${to}&SD1=${from}&SDP1=${departure.format('DD-MM-YYYY')}&AD=2&TK=ECO&DO=false&NA=false`;
}

