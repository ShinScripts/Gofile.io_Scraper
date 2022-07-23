import puppeteer from 'puppeteer';
import { writeFileSync, existsSync, readFileSync } from 'fs';
import { WebhookClient } from 'discord.js';
import 'dotenv/config';

const base = 'https://gofile.io/d/';
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const client = new WebhookClient({
	url: process.env.TOKEN,
});

const visitedPath = `${process.cwd()}/src/visited.json`;
let iter = 0;
let obj = {
	visited: [],
};

if (existsSync(visitedPath)) {
	obj.visited = [...JSON.parse(readFileSync(visitedPath).toString())['visited']];
}

const writeToFile = function () {
	writeFileSync(visitedPath, JSON.stringify(obj, null, 4));
};

const scrape = async function () {
	let rnd = '';
	// Loop 6 times and add a random character for each iteration to the variable "rnd"
	for (let i = 0; i < 6; i++) {
		rnd += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	if (obj.visited.includes(rnd)) return false;

	// Combine the base url and the random 6 characters
	const url = `${base}${rnd}`;

	// Start up the browser
	const browser = await puppeteer.launch({
		headless: true,
		defaultViewport: null,
	});

	// Create a new page
	const page = await browser.newPage();

	// Send the page to the URL define above and wait until the page has no more than 2 requests sent/received during that second
	await page.goto(url, { waitUntil: 'networkidle2' });

	// For catching a site error
	if (await page.$('body > div.swal2-container.swal2-center.swal2-backdrop-show > div')) {
		await browser.close();
		console.log(`${++iter} INVALID: ${rnd}`);
		obj.visited.push(rnd);
		writeToFile();
		return false;
	}

	// If anything withing the "try" block fails, it'll stop the code execution inside and immediately jump to the "catch" block below
	try {
		// Wait until an element within the page with the ID of "rowFolder-tableContent" loads
		const element = await page.$('#rowFolder-tableContent');

		const data = await element.evaluate((el) => {
			const arr = [];

			// Loop over each child element of the "rowFolder-tableContent" element
			for (const child of Array.from(el.childNodes) as Element[]) {
				if (child.id != null) {
					arr.push(
						// Find the URL's within the child elements and push them to the array named "arr"
						(Array.from(Array.from(child.childNodes)[3].childNodes)[1] as Element).getAttribute('href')
					);
				}
			}

			// Once the loop is done, return the arr (the variable data is now equal to the array "arr")
			return arr;
		});

		obj.visited.push(rnd);

		// Write down the URL's, one per line in a file named the "URL".txt
		writeFileSync(`./output/${url}.txt`, data.join('\n'));

		// Send over that file in the specified discord channel (through a webhook)
		await client.send({ files: [`./output/${url}.txt`] });
		return true;
	} catch (e) {
		// If the code within the "try" block would fail, we'd be here now
		console.log(`${++iter} INVALID: ${rnd}`);
		obj.visited.push(rnd);
		return false;
	} finally {
		writeToFile();
		// At last, close the browser so chromium instances won't build up and cause a memory leak / stack overflow
		await browser.close();
	}
};

// For running the scraper, runs until it finds a valid URL
(async () => {
	let result = false;

	do {
		result = await scrape();
	} while (result !== true);
})();
